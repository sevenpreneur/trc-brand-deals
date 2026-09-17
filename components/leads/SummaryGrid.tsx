import type { StatSummary } from "@/apis/stat";
import {
  formatDuration,
  formatDurationTick,
  formatNumber,
  formatPercent,
} from "@/lib/format";

type Tone = "plain" | "good" | "warning";

function toneColor(tone: Tone) {
  if (tone === "good") return "var(--success-text)";
  if (tone === "warning") return "var(--tint-warning-ink)";
  return "var(--ink)";
}

function Tile({
  label,
  value,
  sub,
  tone = "plain",
  star = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  star?: boolean;
}) {
  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <p className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
        {label}
        {star && <span aria-hidden>*</span>}
      </p>
      <p
        className="mt-1.5 text-[26px] leading-none font-semibold tabular-nums"
        style={{ color: toneColor(tone) }}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

/** Tujuh angka ringkasan dalam satu baris — garis pemisah dari gap-px di atas bg-hairline. */
export default function SummaryGrid({
  summary,
  days,
  targetSeconds,
}: {
  summary: StatSummary;
  days: number;
  targetSeconds: number;
}) {
  const totalTurns = summary.replied_turn_count + summary.unanswered_turn_count;
  const perDay = days > 0 ? summary.new_conversation_count / days : 0;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-4 xl:grid-cols-7">
      <Tile
        label="New conversations"
        value={formatNumber(summary.new_conversation_count)}
        sub={`${formatNumber(summary.active_conversation_count)} aktif di window`}
      />
      <Tile
        label="Baru / hari"
        value={formatNumber(perDay, 1)}
        sub={`dari ${formatNumber(summary.new_conversation_count)} percakapan baru`}
      />
      <Tile
        label="Reply rate"
        tone="good"
        value={formatPercent(summary.reply_rate_percent)}
        sub={`${formatNumber(summary.replied_turn_count)} dari ${formatNumber(totalTurns)} turn dibalas`}
      />
      <Tile
        label="Median reply"
        star
        value={formatDuration(summary.median_response_seconds)}
        sub="termasuk balasan bot"
      />
      <Tile
        label="P90 reply"
        star
        value={formatDuration(summary.p90_response_seconds)}
        sub="termasuk balasan bot"
      />
      <Tile
        label={`Dibalas ≤ ${formatDurationTick(targetSeconds)}`}
        tone={summary.within_target_percent >= 90 ? "good" : "warning"}
        value={formatPercent(summary.within_target_percent)}
        sub={`${formatNumber(summary.within_target_count)} dari ${formatNumber(summary.replied_turn_count)} balasan`}
      />
      <Tile
        label="Menunggu balasan"
        tone={summary.unanswered_conversation_count > 0 ? "warning" : "good"}
        value={formatNumber(summary.unanswered_conversation_count)}
        sub="lihat tab Queue"
      />
    </div>
  );
}
