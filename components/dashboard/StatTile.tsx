import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warning" | "critical";

const TONE_COLOR: Record<Tone, string> = {
  neutral: "var(--ink-2)",
  good: "var(--success-text)",
  warning: "var(--status-serious)",
  critical: "var(--status-critical)",
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
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-surface p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {starred && (
          <span aria-label="Metric utama" title="Metric utama">
            ⭐
          </span>
        )}
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      {detail && (
        <p
          className="mt-1.5 text-sm font-medium"
          style={{ color: TONE_COLOR[detailTone] }}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
