"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ChatSource, KnowledgeChat } from "@/apis/knowledge";
import { streamChat } from "@/lib/knowledge-stream";
import ChatComposer from "./ChatComposer";
import Markdown from "./Markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  message: string;
  status: "queued" | "streaming" | "done" | "failed" | null;
  error: string | null;
  /** Jejak langkah retrieval, siap tampil. Dari kolom sources, atau dari event stream. */
  steps: string[] | null;
};

interface ChatThreadProps {
  convId: string | null;
  title: string;
  initialMessages: KnowledgeChat[];
}

const SUGGESTIONS = [
  "Bagaimana kondisi brand deal 30 hari terakhir?",
  "Brand mana yang paling lama belum dibalas?",
  "Bandingkan first response minggu ini dengan minggu lalu",
  "Deal apa saja yang sedang di tahap negotiation?",
];

function describe(source: ChatSource): string {
  return source.summary ? `${source.tool} · ${source.summary}` : source.tool;
}

function toMessage(chat: KnowledgeChat): Message {
  return {
    id: chat.id,
    role: chat.role,
    message: chat.message,
    status: chat.status,
    error: chat.error,
    steps: chat.sources ? chat.sources.map(describe) : null,
  };
}

export default function ChatThread({
  convId,
  title,
  initialMessages,
}: ChatThreadProps) {
  const router = useRouter();

  // Disimpan di ref karena URL diganti tanpa navigasi, jadi prop-nya tidak ikut berubah.
  const conversationRef = useRef(convId);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>(() =>
    initialMessages.map(toMessage)
  );
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Yang dihentikan hanya pembacaan stream di browser; job backend tetap selesai.
  useEffect(() => () => abortRef.current?.abort(), []);

  function appendToAnswer(text: string) {
    setMessages((prev) => {
      const last = prev.length - 1;
      if (last < 0 || prev[last].role !== "assistant") return prev;
      const next = [...prev];
      next[last] = {
        ...next[last],
        message: next[last].message + text,
        status: "streaming",
      };
      return next;
    });
  }

  function finishAnswer(
    patch: Partial<Message> | ((current: Message) => Partial<Message>)
  ) {
    setMessages((prev) => {
      const last = prev.length - 1;
      if (last < 0 || prev[last].role !== "assistant") return prev;
      const next = [...prev];
      next[last] = {
        ...next[last],
        ...(typeof patch === "function" ? patch(next[last]) : patch),
      };
      return next;
    });
  }

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setDraft("");
    setPending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `local-user-${Date.now()}`,
        role: "user",
        message: trimmed,
        status: null,
        error: null,
        steps: null,
      },
      {
        id: `local-assistant-${Date.now()}`,
        role: "assistant",
        message: "",
        status: "queued",
        error: null,
        steps: null,
      },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    await streamChat(
      { convId: conversationRef.current, message: trimmed },
      {
        onEvent(event) {
          switch (event.event) {
            case "conversation":
              if (conversationRef.current) break;
              conversationRef.current = event.data;
              // replaceState, bukan router.replace: navigasi me-remount dan menghapus jawaban yang mengalir.
              window.history.replaceState(
                null,
                "",
                `/knowledge/${event.data}`
              );
              break;
            case "source":
              finishAnswer((current) => ({
                steps: [...(current.steps ?? []), event.data],
              }));
              break;
            case "delta":
              appendToAnswer(event.data);
              break;
            case "done":
              finishAnswer({ id: event.data, status: "done" });
              break;
            case "error":
              finishAnswer({ status: "failed", error: event.data });
              break;
          }
        },
        onError(error) {
          finishAnswer({ status: "failed", error: error.message });
        },
      },
      controller.signal
    );

    setPending(false);
    // Menyegarkan daftar thread di sidebar dan judul yang baru dibuat agent.
    router.refresh();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-hairline bg-plane/95 px-4 py-4 backdrop-blur sm:px-8">
        <h1 className="truncate text-[15px] font-bold tracking-tight text-ink">
          {title || "Chat baru"}
        </h1>
        <p className="mt-1 text-xs text-ink-2">
          Jawaban disusun dari data yang sama dengan dashboard — bukan dari
          laporan manual.
        </p>
      </header>

      <div className="flex-1 px-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 py-6">
          {isEmpty ? (
            <div className="flex flex-col gap-4 py-8">
              <div>
                <p className="text-[15px] font-bold text-ink">
                  Tanya apa saja tentang brand deal yang masuk
                </p>
                <p className="mt-1.5 text-sm text-ink-2">
                  Angkanya diambil langsung dari percakapan WhatsApp lewat
                  endpoint yang sama dengan dashboard. Kalau datanya belum ada
                  di schema, jawabannya akan bilang begitu, bukan mengarang.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border border-hairline bg-surface px-3.5 py-2 text-left text-xs font-medium text-ink-2 shadow-card transition hover:text-ink"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-surface px-4 py-2.5 text-sm whitespace-pre-wrap text-ink shadow-card">
                    {message.message}
                  </p>
                </div>
              ) : (
                <Answer key={message.id} message={message} />
              )
            )
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-plane via-plane to-transparent px-4 pt-6 pb-4 sm:px-8">
        <div className="mx-auto w-full max-w-[760px]">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={() => send(draft)}
            disabled={pending}
            autoFocus={isEmpty}
          />
        </div>
      </div>
    </div>
  );
}

function Answer({ message }: { message: Message }) {
  const steps = message.steps ?? [];
  const waiting =
    (message.status === "queued" || message.status === "streaming") &&
    message.message === "";

  return (
    <div className="flex flex-col gap-2.5">
      {waiting && (
        <div className="flex flex-col gap-1.5">
          <p className="flex items-center gap-2 text-xs font-medium text-ink-2">
            <span className="size-1.5 animate-pulse rounded-full bg-series-1" />
            {steps.length > 0 ? "Mengambil data" : "Menyiapkan jawaban"}
          </p>
          {steps.map((step, index) => (
            <p key={index} className="pl-3.5 text-xs text-ink-muted">
              {step}
            </p>
          ))}
        </div>
      )}

      {message.message && <Markdown text={message.message} />}

      {message.status === "failed" && (
        <p
          role="alert"
          className="rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-ink-2"
        >
          {message.error || "Jawaban gagal disusun."} Coba kirim ulang
          pertanyaannya.
        </p>
      )}

      {!waiting && steps.length > 0 && (
        <details className="text-xs text-ink-muted">
          <summary className="cursor-pointer select-none">
            {steps.length} langkah pengambilan data
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1 pl-4">
            {steps.map((step, index) => (
              <li key={index} className="list-disc">
                {step}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
