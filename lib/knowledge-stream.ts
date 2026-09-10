"use client";

/** Event yang dikirim backend lewat SSE. Payload tiap event selalu satu string. */
export type ChatEventName =
  | "conversation"
  | "source"
  | "delta"
  | "title"
  | "done"
  | "error";

export type ChatEvent = { event: ChatEventName; data: string };

const KNOWN_EVENTS: ChatEventName[] = [
  "conversation",
  "source",
  "delta",
  "title",
  "done",
  "error",
];

function isKnownEvent(value: string): value is ChatEventName {
  return (KNOWN_EVENTS as string[]).includes(value);
}

/** Pisahkan buffer SSE jadi event utuh; potongan terakhir dikembalikan sebagai buffer baru. */
export function parseEventStream(
  chunk: string,
  buffer: string
): { events: ChatEvent[]; buffer: string } {
  const merged = buffer + chunk;
  const blocks = merged.split("\n\n");
  const rest = blocks.pop() ?? "";

  const events: ChatEvent[] = [];
  for (const block of blocks) {
    let name = "";
    let data: string | null = null;

    for (const line of block.split("\n")) {
      // Baris komentar (": keepalive") sengaja diabaikan.
      if (!line || line.startsWith(":")) continue;

      const colon = line.indexOf(":");
      if (colon === -1) continue;

      const field = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trimStart();

      if (field === "event") {
        name = value;
      } else if (field === "data") {
        try {
          const parsed: unknown = JSON.parse(value);
          data = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        } catch {
          data = value;
        }
      }
    }

    if (data !== null && isKnownEvent(name)) {
      events.push({ event: name, data });
    }
  }

  return { events, buffer: rest };
}

export interface ChatStreamHandlers {
  onEvent?: (event: ChatEvent) => void;
  onCompleted?: () => void;
  onError?: (error: Error) => void;
}

/** `signal` hanya menghentikan pembacaan di browser; backend tetap menyimpan jawabannya. */
export async function streamChat(
  payload: { convId: string | null; message: string },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/knowledge/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conv_id: payload.convId,
        message: payload.message,
      }),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return;
    handlers.onError?.(new Error("Tidak bisa menghubungi server"));
    return;
  }

  if (!response.ok || !response.body) {
    const envelope = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    handlers.onError?.(
      new Error(envelope?.message ?? `Server membalas ${response.status}`)
    );
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      const parsed = parseEventStream(
        decoder.decode(value, { stream: true }),
        buffer
      );
      buffer = parsed.buffer;
      for (const event of parsed.events) handlers.onEvent?.(event);
    }
    handlers.onCompleted?.();
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return;
    handlers.onError?.(error as Error);
  } finally {
    reader.releaseLock();
  }
}
