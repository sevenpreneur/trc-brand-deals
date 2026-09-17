import type { ResponseTimeEntry } from "@/apis/stat";
import {
  formatDateShort,
  formatDuration,
  formatNumber,
  formatPercent,
} from "@/lib/format";

/** Hijau ≥ 90%, netral 75–89%, amber < 75% — sama seperti sumber acuan. */
function barColor(pct: number) {
  if (pct >= 90) return "var(--success-text)";
  if (pct >= 75) return "var(--ink-2)";
  return "var(--tint-warning-ink)";
}

export default function ReplyTimeTrend({
  data,
}: {
  data: ResponseTimeEntry[];
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-hairline text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
            <th className="py-2 pr-3 font-semibold">Hari</th>
            <th className="px-3 py-2 text-right font-semibold">Turn</th>
            <th className="px-3 py-2 text-right font-semibold">Median</th>
            <th className="px-3 py-2 text-right font-semibold">P90</th>
            <th className="py-2 pl-3 font-semibold">Dibalas ≤ target</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => {
            const small = entry.inbound_turn_count < 10;
            return (
              <tr
                key={entry.date}
                className="border-b border-hairline/60 last:border-0"
              >
                <td className="py-2.5 pr-3 whitespace-nowrap text-ink">
                  {formatDateShort(entry.date)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                  {formatNumber(entry.inbound_turn_count)}
                  {entry.unanswered_turn_count > 0 && (
                    <span style={{ color: "var(--tint-warning-ink)" }}>
                      {" "}
                      (+{entry.unanswered_turn_count})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                  {formatDuration(entry.median_response_seconds)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right tabular-nums ${
                    small ? "text-ink-muted" : "text-ink"
                  }`}
                >
                  {formatDuration(entry.p90_response_seconds)}
                </td>
                <td className="py-2.5 pl-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, entry.within_target_percent)}%`,
                          background: barColor(entry.within_target_percent),
                        }}
                      />
                    </div>
                    <span className="w-11 shrink-0 text-right text-xs tabular-nums text-ink-2">
                      {formatPercent(entry.within_target_percent, 0)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
