"use client";

import { useEffect, useRef, useState } from "react";

/** Catatan hampir selalu panjang, jadi baris penuh disembunyikan sampai diminta. */
export default function NoteCell({
  note,
  lines = 2,
}: {
  note: string | null;
  lines?: 1 | 2 | 3;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    // Saat terbuka tinggi konten sama dengan tinggi kotak, jadi ukur pas terklip saja.
    if (expanded) return;
    const measure = () =>
      setClipped(element.scrollHeight - element.clientHeight > 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, note]);

  const clamp = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" }[
    lines
  ];

  return (
    <div className="min-w-0">
      <p
        ref={textRef}
        className={`text-sm break-words text-ink-2 ${expanded ? "" : clamp}`}
      >
        {note ?? "Belum ada catatan"}
      </p>
      {clipped ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="mt-0.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          {expanded ? "Ringkas" : "Selengkapnya"}
        </button>
      ) : null}
    </div>
  );
}
