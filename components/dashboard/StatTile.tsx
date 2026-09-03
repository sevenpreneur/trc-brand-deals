import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warning" | "critical";

/** Warna tidak pernah berdiri sendiri — tiap tone punya glyph sendiri. */
const TONE: Record<Tone, { color: string; icon: string | null }> = {
  neutral: { color: "var(--ink-muted)", icon: null },
  good: { color: "var(--tint-good-ink)", icon: "▲" },
  warning: { color: "var(--tint-warning-ink)", icon: "▲" },
  critical: { color: "var(--tint-critical-ink)", icon: "■" },
};

interface StatTileProps {
  label: string;
  value: string;
  /** Baris kedua: konteks angka, target, atau pembanding. */
  detail?: ReactNode;
  detailTone?: Tone;
  /** Ditandai bintang di dokumen evaluasi sebagai metric utama. */
  starred?: boolean;
}

export default function StatTile({
  label,
  value,
  detail,
  detailTone = "neutral",
  starred = false,
}: StatTileProps) {
  const tone = TONE[detailTone];

  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-surface p-5 shadow-card">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
        {starred && (
          <span
            aria-label="Metric utama"
            title="Metric utama"
            className="text-[11px]"
          >
            ⭐
          </span>
        )}
        {label}
      </p>
      <p className="mt-2 text-[28px] leading-none font-bold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {detail && (
        <p
          className="mt-2.5 flex items-start gap-1.5 text-xs leading-relaxed font-medium"
          style={{ color: tone.color }}
        >
          {tone.icon && (
            <span aria-hidden className="text-[0.65rem] leading-[1.35]">
              {tone.icon}
            </span>
          )}
          <span>{detail}</span>
        </p>
      )}
    </div>
  );
}
