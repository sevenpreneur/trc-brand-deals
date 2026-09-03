type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

const TONE: Record<Tone, { color: string; icon: string }> = {
  good: { color: "var(--status-good)", icon: "●" },
  warning: { color: "var(--status-warning)", icon: "▲" },
  serious: { color: "var(--status-serious)", icon: "▲" },
  critical: { color: "var(--status-critical)", icon: "■" },
  neutral: { color: "var(--ink-muted)", icon: "○" },
};

/** Warna status tidak pernah berdiri sendiri — selalu ikon + label. */
export default function StatusBadge({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  const { color, icon } = TONE[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
      <span aria-hidden style={{ color, fontSize: "0.7em" }}>
        {icon}
      </span>
      <span className="text-ink-2">{label}</span>
    </span>
  );
}
