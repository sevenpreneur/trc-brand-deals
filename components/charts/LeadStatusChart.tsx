"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LeadStatusEntry } from "@/apis/stat";
import { LEAD_STATUS_COLOR, LEAD_STATUS_ORDER } from "@/lib/chart-series";
import {
  formatNumber,
  formatPercent,
  formatRupiahCompact,
  LEAD_STATUS_LABEL,
} from "@/lib/format";
import { TooltipRow, TooltipShell } from "./ChartTooltip";

interface Datum {
  status: string;
  label: string;
  value: number;
  share: number;
  ai: number;
  human: number;
  winningRate: number;
  valuedCount: number;
  projectValue: number;
}

interface FunnelTooltipProps {
  active?: boolean;
  payload?: { payload: Datum }[];
}

function FunnelTooltip({ active, payload }: FunnelTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <TooltipShell title={datum.label}>
      <TooltipRow
        color={LEAD_STATUS_COLOR[datum.status]}
        label="Percakapan"
        value={`${formatNumber(datum.value)} · ${formatPercent(datum.share, 0)}`}
      />
      <TooltipRow
        label="Nilai tertahan"
        value={formatRupiahCompact(datum.projectValue)}
      />
      <TooltipRow
        label="Sudah ada nilai"
        value={`${formatNumber(datum.valuedCount)} percakapan`}
      />
      <TooltipRow
        label="Rata-rata winning rate"
        value={formatPercent(datum.winningRate, 0)}
      />
      <TooltipRow
        label="AI / human"
        value={`${formatNumber(datum.ai)} / ${formatNumber(datum.human)}`}
      />
    </TooltipShell>
  );
}

export default function LeadStatusChart({
  data,
  total,
}: {
  data: LeadStatusEntry[];
  total: number;
}) {
  const chartData: Datum[] = LEAD_STATUS_ORDER.map((status) => {
    const entry = data.find((item) => item.lead_status === status);
    const value = entry?.conversation_count ?? 0;
    return {
      status,
      label: LEAD_STATUS_LABEL[status],
      value,
      share: total > 0 ? (value / total) * 100 : 0,
      ai: entry?.mode_ai_count ?? 0,
      human: entry?.mode_human_count ?? 0,
      winningRate: entry?.avg_winning_rate ?? 0,
      valuedCount: entry?.valued_conversation_count ?? 0,
      projectValue: entry?.total_project_value ?? 0,
    };
  });

  const peak = chartData.reduce(
    (highest, datum) => Math.max(highest, datum.value),
    0
  );
  const valued = chartData.filter((datum) => datum.projectValue > 0);

  return (
    <div>
      {/* Bar horizontal menurun: stage funnel itu kategori berurutan, dan
          label stage-nya panjang — sumbu vertikal muat tanpa memiringkan teks. */}
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 44, bottom: 0, left: 0 }}
            barCategoryGap="22%"
          >
            <XAxis
              type="number"
              hide
              domain={[0, Math.max(peak, 1)]}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={136}
              tick={{ fill: "var(--ink-2)", fontSize: 12 }}
            />
            <Tooltip
              content={<FunnelTooltip />}
              cursor={{ fill: "var(--surface-sunken)" }}
            />
            <Bar
              dataKey="value"
              maxBarSize={24}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              {chartData.map((datum) => (
                <Cell
                  key={datum.status}
                  fill={LEAD_STATUS_COLOR[datum.status]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Nilai dilabeli di ujung bar, tapi stage bernilai 0 tidak
            menghasilkan mark sehingga LabelList kehilangan jangkarnya.
            Kolom ini memakai pembagian tinggi yang sama dengan band chart,
            jadi angkanya sejajar dan stage kosong tetap terbaca. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex w-10 flex-col justify-around text-right"
        >
          {chartData.map((datum) => (
            <span
              key={datum.status}
              className={`text-xs font-semibold tabular-nums ${
                datum.value === 0 ? "text-ink-muted" : "text-ink"
              }`}
            >
              {formatNumber(datum.value)}
            </span>
          ))}
        </div>
      </div>

      {/* Nama stage sudah jadi label sumbu — daftar ini hanya menambah nilai
          tertahan, dan cuma untuk stage yang nilainya sudah terisi. */}
      {valued.length > 0 && (
        <dl className="mt-4 space-y-2 border-t border-hairline pt-4">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
            Nilai tertahan per stage
          </p>
          {valued.map((datum) => (
            <div key={datum.status} className="flex items-baseline gap-2">
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: LEAD_STATUS_COLOR[datum.status] }}
              />
              <dt className="truncate text-xs text-ink-2">{datum.label}</dt>
              <dd className="ml-auto text-xs font-semibold text-ink tabular-nums">
                {formatRupiahCompact(datum.projectValue)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
