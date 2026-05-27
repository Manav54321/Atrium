/**
 * Browser-side client for the Managed Agent (`atrium-attending`).
 *
 * Talks to the FastAPI proxy at `/agent/*` — never directly to LLM providers.
 * The provider API keys live server-side only.
 *
 * Responsibilities:
 *   - bootstrap()           — one-time create of the agent + environment,
 *                             idempotent (server returns cached IDs).
 *   - createSession()       — per-player, per-shift.
 *   - sendUserMessage()     — user.message event.
 *   - sendCustomToolResult()— reply to an agent.custom_tool_use.
 *   - sendInterrupt()       — jump the queue.
 *   - openEventStream()     — async iterator over events, with the
 *                             reconnect+dedupe pattern.
 */

const AGENT_BASE = '/agent';

export interface BootstrapResult {
  agent_id: string;
  agent_version: number | null;
  environment_id: string;
  /** True if the server created the agent/env this call; false if cached. */
  created: boolean;
}

export interface CreateSessionResult {
  session_id: string;
}

/** Minimal shape — we only rely on `type` and `id`. Everything else we
 *  pass straight through to consumers so renderer can read more fields
 *  than we've typed here. */
export interface ManagedAgentEvent {
  id: string;
  type: string;
  processed_at?: string | null;
  // Permissive — the full payload depends on the event type.
  [key: string]: unknown;
}

export interface StreamOptions {
  /** Called when the SSE connection is closed for any reason (terminal
   *  event, proxy error, user abort). */
  onClose?: (reason: 'terminated' | 'idle-end-turn' | 'abort' | 'error') => void;
  /** Called on proxy-reported errors or transport errors before we
   *  attempt to reconnect. */
  onError?: (err: unknown) => void;
  /** AbortSignal to tear down the stream early. */
  signal?: AbortSignal;
  /** If true, on reconnect we fetch the event history via
   *  `GET /agent/sessions/:id/events` and replay any events the caller
   *  hasn't seen yet. Default true for lossless stream reconnect. */
  backfillOnReconnect?: boolean;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AGENT_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${AGENT_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function bootstrap(): Promise<BootstrapResult> {
  return postJson<BootstrapResult>('/bootstrap', {});
}

export async function createSession(title?: string): Promise<CreateSessionResult> {
  return postJson<CreateSessionResult>('/sessions', { title });
}

export async function sendUserMessage(sessionId: string, text: string): Promise<void> {
  await postJson(`/sessions/${encodeURIComponent(sessionId)}/events`, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text }],
      },
    ],
  });
}

export async function sendCustomToolResult(
  sessionId: string,
  customToolUseId: string,
  result: string,
  isError = false,
): Promise<void> {
  await postJson(`/sessions/${encodeURIComponent(sessionId)}/events`, {
    events: [
      {
        type: 'user.custom_tool_result',
        custom_tool_use_id: customToolUseId,
        content: [{ type: 'text', text: result }],
        is_error: isError,
      },
    ],
  });
}

export async function sendInterrupt(sessionId: string): Promise<void> {
  await postJson(`/sessions/${encodeURIComponent(sessionId)}/events`, {
    events: [{ type: 'user.interrupt' }],
  });
}

async function fetchHistory(sessionId: string): Promise<ManagedAgentEvent[]> {
  const page = await getJson<{ data: ManagedAgentEvent[] }>(
    `/sessions/${encodeURIComponent(sessionId)}/events?limit=1000`,
  );
  return page.data ?? [];
}

/** Terminal stop_reason types on `session.status_idle`. Idle with any other
 *  stop_reason (notably `requires_action`) means the session is blocked —
 *  we must NOT treat it as terminal. */
const TERMINAL_IDLE_STOP_REASONS = new Set(['end_turn', 'retries_exhausted']);

function isTerminal(event: ManagedAgentEvent): boolean {
  if (event.type === 'session.status_terminated') return true;
  if (event.type === 'session.status_idle') {
    const stopReason = (event as { stop_reason?: { type?: string } }).stop_reason;
    const t = stopReason?.type;
    return t !== undefined && TERMINAL_IDLE_STOP_REASONS.has(t);
  }
  return false;
}

/**
 * Open the event stream. Yields every event in order; on reconnect
 * backfills missed events via the paginated list endpoint and dedupes
 * by event ID.
 *
 * Caller is responsible for processing each event — e.g. dispatching a
 * `user.custom_tool_result` when an `agent.custom_tool_use` arrives.
 */
export async function* openEventStream(
  sessionId: string,
  opts: StreamOptions = {},
): AsyncGenerator<ManagedAgentEvent, void, unknown> {
  const seen = new Set<string>();
  const backfillOnReconnect = opts.backfillOnReconnect !== false;
  let closed = false;

  const onAbort = () => {
    closed = true;
    opts.onClose?.('abort');
  };
  opts.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    // Stream-first ordering. We open the EventSource
    // immediately; if a caller paired this with a kickoff send(), the
    // stream is already buffering by the time send() resolves.
    while (!closed) {
      const pending: ManagedAgentEvent[] = [];
      let streamError: unknown | null = null;
      let streamEnded = false;
      let resolveWait: (() => void) | null = null;
      const wait = () => new Promise<void>((r) => { resolveWait = r; });
      const pushAndWake = () => {
        if (resolveWait) { resolveWait(); resolveWait = null; }
      };

      const es = new EventSource(
        `${AGENT_BASE}/sessions/${encodeURIComponent(sessionId)}/stream`,
      );
      // EventSource doesn't expose "unknown event types" via `onmessage`
      // unless we explicitly listen. The proxy sends one SSE `event:` per
      // managed-agents event type, so we listen to the most common ones.
      // Anything else falls through as generic `message`.
      const typedEvents = [
        'agent.message',
        'agent.thinking',
        'agent.tool_use',
        'agent.tool_result',
        'agent.mcp_tool_use',
        'agent.mcp_tool_result',
        'agent.custom_tool_use',
        'agent.thread_context_compacted',
        'session.status_idle',
        'session.status_running',
        'session.status_rescheduled',
        'session.status_terminated',
        'session.error',
        'span.model_request_start',
        'span.model_request_end',
        'user.message',
        'user.interrupt',
        'user.tool_confirmation',
        'user.custom_tool_result',
        'proxy_error',
      ];
      const addTyped = (etype: string) => {
        es.addEventListener(etype, (ev) => {
          try {
            const parsed = JSON.parse((ev as MessageEvent).data) as ManagedAgentEvent;
            pending.push(parsed);
            pushAndWake();
          } catch (err) {
            streamError = err;
            pushAndWake();
          }
        });
      };
      typedEvents.forEach(addTyped);
      es.onmessage = (ev) => {
        // Generic fallback for any SSE message without an explicit event:.
        try {
          const parsed = JSON.parse(ev.data) as ManagedAgentEvent;
          pending.push(parsed);
          pushAndWake();
        } catch (err) {
          streamError = err;
          pushAndWake();
        }
      };
      es.onerror = () => {
        // EventSource auto-reconnects on transport errors; we close
        // and do our own reconnect so we can backfill first.
        streamEnded = true;
        pushAndWake();
      };

      // Backfill BEFORE consuming live stream.
      if (backfillOnReconnect) {
        try {
          const history = await fetchHistory(sessionId);
          for (const ev of history) {
            if (!seen.has(ev.id)) {
              seen.add(ev.id);
              yield ev;
              if (isTerminal(ev)) {
                closed = true;
                opts.onClose?.(
                  ev.type === 'session.status_terminated'
                    ? 'terminated'
                    : 'idle-end-turn',
                );
                es.close();
                return;
              }
            }
          }
        } catch (err) {
          opts.onError?.(err);
          // Continue — backfill failure shouldn't kill the stream.
        }
      }

      // Drain pending from the live stream.
      while (!closed && !streamEnded) {
        if (pending.length === 0) {
          await wait();
          continue;
        }
        const ev = pending.shift()!;
        if (streamError) {
          opts.onError?.(streamError);
          streamError = null;
        }
        if (ev.type === 'proxy_error') {
          opts.onError?.(new Error(`proxy_error: ${String(ev.message ?? 'unknown')}`));
          continue;
        }
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          yield ev;
          if (isTerminal(ev)) {
            closed = true;
            opts.onClose?.(
              ev.type === 'session.status_terminated'
                ? 'terminated'
                : 'idle-end-turn',
            );
            break;
          }
        }
      }

      es.close();
      if (closed) break;
      // Transport-level disconnect; loop to reconnect with backfill.
      // Short backoff so a flapping connection doesn't spin.
      await new Promise((r) => setTimeout(r, 500));
    }
  } finally {
    opts.signal?.removeEventListener('abort', onAbort);
  }
}
