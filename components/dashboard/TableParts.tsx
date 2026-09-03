import type { ReactNode } from "react";
import { LEAD_STATUS_COLOR } from "@/lib/chart-series";
import { LEAD_STATUS_LABEL } from "@/lib/format";

export function HeaderCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-ink-2 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/** Nama WhatsApp sering ditempeli brand, jadi ambil potongan sebelum pemisah. */
function initials(name: string) {
  const person = name.split(/[-–—|/(]/)[0].trim() || name.trim();
  const words = person.split(/\s+/).filter((word) => /\p{L}/u.test(word));
  const letters = words
    .slice(0, 2)
    .map((word) => [...word].find((char) => /\p{L}/u.test(char)) ?? "");
  return letters.join("").toUpperCase() || "?";
}

/** Bit rendah hash cuma paritas karakter, jadi slot diambil dari bit ke-3 ke atas. */
function tintIndex(name: string) {
  let hash = 0;
  for (const char of name)
    hash = (Math.imul(hash, 131) + (char.codePointAt(0) ?? 0)) >>> 0;
  return ((hash >>> 3) % 2) + 1;
}

/** Inisial kontak sebagai jangkar visual baris: huruf, bukan aset gambar. */
export function Avatar({ name }: { name: string }) {
  const slot = tintIndex(name);
  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{
        background: `var(--avatar-${slot})`,
        color: `var(--avatar-${slot}-ink)`,
      }}
    >
      {initials(name)}
    </span>
  );
}

/** Titik chip memakai ramp ordinal yang sama dengan chart funnel. */
export function StageChip({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-sunken px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-ink-2">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ background: LEAD_STATUS_COLOR[status] ?? "var(--ink-muted)" }}
      />
      {LEAD_STATUS_LABEL[status] ?? status}
    </span>
  );
}
