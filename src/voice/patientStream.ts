export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const PATIENT_STREAM_URL = '/agent/patient/stream';

/** Backend owns the Groq API key (POST /agent/patient/stream).
 *  Kept as a function so callers don't need to change — any real failure
 *  surfaces from the first streamPatientResponse() fetch. */
export function hasOpenAIKey(): boolean {
  return true;
}

export async function* streamPatientResponse(
  systemPrompt: string,
  messages: ChatMessage[],
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(PATIENT_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: systemPrompt, messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`patient stream failed: ${res.status} ${detail}`.trim());
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      const dataLines = frame
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trimStart());
      if (!dataLines.length) continue;
      let parsed: { text?: string; done?: boolean; error?: string };
      try {
        parsed = JSON.parse(dataLines.join('\n'));
      } catch {
        continue;
      }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.done) return;
      if (typeof parsed.text === 'string') yield parsed.text;
    }
  }
}
