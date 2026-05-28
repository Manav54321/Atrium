// Hook that drives an end-of-encounter debrief through the atrium-attending
// Managed Agent.
//
// Lifecycle:
//   1. Caller passes a `DebriefRequest` (built via buildDebriefRequest).
//      The hook does nothing until `request` becomes non-null AND `enabled`
//      is true — that's the trigger.
//   2. bootstrap (idempotent), createSession, sendUserMessage with the
//      [debrief request] body, then openEventStream.
//   3. Auto-ack any `auto`-permission custom tool calls. Surface a
//      `render_case_evaluation` invocation as the final result (validated
//      via parseCustomToolUse).
//   4. Cleanup on unmount via AbortSignal.

import { useEffect, useState } from 'react';
import {
  bootstrap,
  createSession,
  sendCustomToolResult,
  sendUserMessage,
  openEventStream,
} from './managedAgent';
import {
  type CaseEvaluationInput,
  CUSTOM_TOOL_PERMISSIONS,
  parseCustomToolUse,
} from './customTools';
import {
  type DebriefRequest,
  debriefRequestToUserMessage,
} from './debriefRequest';

export type DebriefStatus =
  | 'idle'
  | 'starting'
  | 'streaming'
  | 'got-evaluation'
  | 'error'
  | 'aborted';

export interface UseAttendingDebriefResult {
  status: DebriefStatus;
  evaluation: CaseEvaluationInput | null;
  error: string | null;
  /** Each `agent.message` `delta` text concatenated, for showing the
   *  agent's "thinking aloud" while it streams toward the eval emit. */
  partialNarration: string;
  /** Reset to allow a re-run with a new request. */
  reset: () => void;
}

interface Options {
  enabled?: boolean;
}

export function useAttendingDebrief(
  request: DebriefRequest | null,
  opts: Options = {},
): UseAttendingDebriefResult {
  const enabled = opts.enabled !== false;
  const [status, setStatus] = useState<DebriefStatus>('idle');
  const [evaluation, setEvaluation] = useState<CaseEvaluationInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partialNarration, setPartial] = useState('');
  // Effect deps the request reference directly; useMemo at the call site
  // stabilises it across non-load-bearing re-renders. Under React 18
  // StrictMode the effect fires twice in dev — the first run's cleanup
  // aborts its controller, the second run starts fresh. That's fine: each
  // run creates its own session.

  useEffect(() => {
    if (!enabled || !request) return;

    const ctrl = new AbortController();
    let cancelled = false;
    setStatus('starting');
    setError(null);
    setEvaluation(null);
    setPartial('');

    void (async () => {
      try {
        await bootstrap();
        const sessionId = await createSession(`debrief-${request.case_id}-${Date.now()}`)
          .then((s) => s.session_id);
        if (cancelled) return;

        const streamPromise = consumeStream(
          sessionId,
          ctrl.signal,
          (e) => !cancelled && setEvaluation(e),
          (delta) => !cancelled && setPartial((p) => p + delta),
        );

        await sendUserMessage(sessionId, debriefRequestToUserMessage(request));
        if (cancelled) return;
        setStatus('streaming');

        const result = await streamPromise;
        if (cancelled) return;
        if (result.kind === 'eval') setStatus('got-evaluation');
        else if (result.kind === 'aborted') setStatus('aborted');
        else if (result.kind === 'closed-without-eval') {
          setStatus('error');
          setError('Agent stream closed without emitting a case evaluation.');
        }
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [enabled, request]);

  return {
    status,
    evaluation,
    error,
    partialNarration,
    reset: () => {
      setStatus('idle');
      setEvaluation(null);
      setError(null);
      setPartial('');
    },
  };
}

type StreamResult =
  | { kind: 'eval' }
  | { kind: 'closed-without-eval' }
  | { kind: 'aborted' };

async function consumeStream(
  sessionId: string,
  signal: AbortSignal,
  onEval: (e: CaseEvaluationInput) => void,
  onPartialDelta: (delta: string) => void,
): Promise<StreamResult> {
  let gotEval = false;
  const stream = openEventStream(sessionId, { signal });
  for await (const ev of stream) {
    if (signal.aborted) return { kind: 'aborted' };

    if (ev.type === 'agent.message') {
      const delta = (ev as { delta?: unknown }).delta;
      if (typeof delta === 'string') {
        onPartialDelta(delta);
      } else {
        const content = (ev as { content?: unknown }).content;
        if (typeof content === 'string') {
          onPartialDelta(content);
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (
              block && typeof block === 'object' &&
              (block as { type?: unknown }).type === 'text'
            ) {
              const text = (block as { text?: unknown }).text;
              if (typeof text === 'string') onPartialDelta(text);
            }
          }
        }
      }
      continue;
    }

    if (ev.type === 'agent.custom_tool_use') {
      const toolName = (ev as { name?: string }).name ?? '';
      const toolUseId = (ev as { id?: string }).id ?? '';
      const input = (ev as { input?: unknown }).input;
      const parsed = parseCustomToolUse(toolName, input);
      if (!parsed.ok) {
        // Reply with an error so the agent knows the input was bad — don't
        // crash the stream. The agent can choose to retry.
        await sendCustomToolResult(
          sessionId,
          toolUseId,
          `Validation error: ${parsed.error}`,
          true,
        );
        continue;
      }

      if (parsed.call.name === 'render_case_evaluation') {
        gotEval = true;
        onEval(parsed.call.input);
        await sendCustomToolResult(sessionId, toolUseId, 'rendered');
        continue;
      }

      const perm = CUSTOM_TOOL_PERMISSIONS[parsed.call.name];
      if (perm === 'auto') {
        await sendCustomToolResult(sessionId, toolUseId, 'rendered');
      }
      // confirm-gated tools: leave for the host UI to handle in this
      // debrief flow we don't expect them; ignore.
      continue;
    }
  }
  return gotEval ? { kind: 'eval' } : { kind: 'closed-without-eval' };
}
