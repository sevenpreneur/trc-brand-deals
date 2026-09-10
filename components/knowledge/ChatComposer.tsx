"use client";

import { useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const MAX_HEIGHT = 208;

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Tanya kondisi brand deal…",
  autoFocus = false,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tinggi mengikuti isi, sampai batas; lebih dari itu textarea-nya yang scroll.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter mengirim, Shift+Enter menambah baris — kebiasaan dari kolom chat lain.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (disabled || !value.trim()) return;
      onSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-2xl border border-hairline bg-surface p-3 shadow-card"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Pertanyaan"
        className="max-h-52 w-full resize-none bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-ink-muted">
          Enter kirim · Shift+Enter baris baru
        </p>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex size-8 items-center justify-center rounded-full bg-ink text-surface transition disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Kirim pertanyaan"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-4">
            <path
              d="M10 16V4M10 4 5 9M10 4l5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
