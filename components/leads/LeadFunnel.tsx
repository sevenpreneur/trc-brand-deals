import type { LeadStatusFunnel } from "@/apis/stat";
import { LEAD_STATUS_COLOR } from "@/lib/chart-series";
import {
  LEAD_STATUS_LABEL,
  formatNumber,
  formatPercent,
  formatRupiahCompact,
} from "@/lib/format";

/** Lima stage funnel sebagai kartu berjajar: jumlah, %, nilai tertahan, split AI/Human. */
export default function LeadFunnel({ funnel }: { funnel: LeadStatusFunnel }) {
  const total = funnel.total_conversation_count;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {funnel.list.map((stage) => {
        const pct = total > 0 ? (stage.conversation_count / total) * 100 : 0;
        return (
          <div
            key={stage.lead_status}
            className="rounded-lg border border-hairline bg-surface-sunken/40 p-3"
          >
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  background:
                    LEAD_STATUS_COLOR[stage.lead_status] ?? "var(--ink-muted)",
                }}
              />
              <span className="text-xs font-medium text-ink-2">
                {LEAD_STATUS_LABEL[stage.lead_status] ?? stage.lead_status}
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
              {formatNumber(stage.conversation_count)}
            </p>
            <p className="text-xs text-ink-muted">{formatPercent(pct, 0)}</p>
            <p className="mt-2 text-xs font-medium text-ink">
              {formatRupiahCompact(stage.total_project_value)}
            </p>
            <p className="text-[11px] text-ink-muted">
              {stage.valued_conversation_count} ada nilai · AI{" "}
              {stage.mode_ai_count} · Human {stage.mode_human_count}
            </p>
          </div>
        );
      })}
    </div>
  );
}
