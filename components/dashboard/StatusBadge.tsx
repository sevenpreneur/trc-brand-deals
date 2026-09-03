type Tone = "good" | "warning" | "serious" | "critical" | "neutral";

const TONE: Record<Tone, { tint: string; ink: string }> = {
  good: { tint: "var(--tint-good)", ink: "var(--tint-good-ink)" },
  warning: { tint: "var(--tint-warning)", ink: "var(--tint-warning-ink)" },
  serious: { tint: "var(--tint-serious)", ink: "var(--tint-serious-ink)" },
  critical: { tint: "var(--tint-critical)", ink: "var(--tint-critical-ink)" },
  neutral: { tint: "var(--tint-neutral)", ink: "var(--tint-neutral-ink)" },
};

/** Label ada di dalam pill, jadi warna tidak pernah berdiri sendiri. */
export default function StatusBadge({
  tone,
  label,
}: {
  tone: Tone;
  label: string;
}) {
  const { tint, ink } = TONE[tone];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap"
      style={{ background: tint, color: ink }}
    >
      {label}
    </span>
  );
}
