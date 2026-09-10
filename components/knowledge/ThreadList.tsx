"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ConversationListEntry } from "@/apis/knowledge";
import {
  deleteConversationAction,
  renameConversationAction,
} from "@/app/knowledge/actions";

interface ThreadListProps {
  entries: ConversationListEntry[];
  error: string | null;
}

export default function ThreadList({ entries, error }: ThreadListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  function submitRename(convId: string) {
    const title = editingTitle;
    setEditingId(null);
    startTransition(async () => {
      const result = await renameConversationAction(convId, title);
      setActionError(result.error);
    });
  }

  function remove(convId: string) {
    startTransition(async () => {
      const result = await deleteConversationAction(convId);
      setActionError(result.error);
      // Thread yang sedang dibuka baru saja hilang; kembalikan ke chat kosong.
      if (!result.error && pathname === `/knowledge/${convId}`) {
        router.push("/knowledge");
      }
    });
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-3">
        <p className="text-xs font-semibold tracking-wide text-ink-2 uppercase">
          Riwayat
        </p>
        <Link
          href="/knowledge"
          className="rounded-full border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-2 transition hover:text-ink"
        >
          Chat baru
        </Link>
      </div>

      {(error || actionError) && (
        <p
          role="alert"
          className="mx-3 mb-2 rounded-lg border border-hairline px-2.5 py-2 text-xs text-ink-2"
        >
          {error || actionError}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 && !error ? (
          <p className="px-3 py-2 text-xs text-ink-muted">
            Belum ada chat. Mulai dengan satu pertanyaan.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {entries.map((entry) => {
              const active = pathname === `/knowledge/${entry.id}`;

              if (editingId === entry.id) {
                return (
                  <li key={entry.id} className="px-1.5">
                    <input
                      autoFocus
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={() => submitRename(entry.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submitRename(entry.id);
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      aria-label="Judul chat"
                      className="w-full rounded-lg border border-hairline bg-surface px-2.5 py-2 text-[13px] text-ink focus:outline-none"
                    />
                  </li>
                );
              }

              return (
                <li key={entry.id} className="group relative px-1.5">
                  <Link
                    href={`/knowledge/${entry.id}`}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg py-2 pr-14 pl-2.5 transition ${
                      active
                        ? "bg-surface-sunken text-ink"
                        : "text-ink-2 hover:bg-surface-sunken hover:text-ink"
                    }`}
                  >
                    <span className="block truncate text-[13px] font-medium">
                      {entry.title || "Chat baru"}
                    </span>
                    {entry.last_message_preview && (
                      <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                        {entry.last_message_preview}
                      </span>
                    )}
                  </Link>

                  <div className="absolute top-2 right-3 flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <button
                      type="button"
                      aria-label={`Ganti judul ${entry.title || "chat"}`}
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditingTitle(entry.title);
                      }}
                      className="rounded-md p-1.5 text-ink-muted transition hover:text-ink"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                        className="size-3.5"
                      >
                        <path
                          d="M11 2.5 13.5 5 6 12.5l-3.5 1 1-3.5L11 2.5Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${entry.title || "chat"}`}
                      onClick={() => remove(entry.id)}
                      className="rounded-md p-1.5 text-ink-muted transition hover:text-status-critical"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden
                        className="size-3.5"
                      >
                        <path
                          d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5 5 13h6l.5-8.5"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
