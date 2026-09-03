"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ResponseTimeEntry } from "@/apis/stat";
import { RESPONSE_SERIES } from "@/lib/chart-series";
import {
  durationTicks,
  formatDateShort,
  formatDuration,
  formatDurationTick,
  formatNumber,
} from "@/lib/format";
import { TooltipRow, TooltipShell } from "./ChartTooltip";

interface Datum {
  label: string;
  median: number | null;
  p90: number | null;
  inbound: number;
  unanswered: number;
}

interface ResponseTooltipProps {
  active?: boolean;
  payload?: { payload: Datum }[];
  targetSeconds: number;
}

function ResponseTooltip({
  active,
  payload,
  targetSeconds,
}: ResponseTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  const withinTarget =
    datum.median !== null ? datum.median <= targetSeconds : null;

  return (
    <TooltipShell title={datum.label}>
      <TooltipRow
        color={RESPONSE_SERIES[0].color}
        label={RESPONSE_SERIES[0].label}
        value={formatDuration(datum.median)}
      />
      <TooltipRow
        color={RESPONSE_SERIES[1].color}
        label={RESPONSE_SERIES[1].label}
        value={formatDuration(datum.p90)}
      />
      <TooltipRow label="Turn inbound" value={formatNumber(datum.inbound)} />
      <TooltipRow
        label="Tanpa balasan"
        value={formatNumber(datum.unanswered)}
      />
      {withinTarget !== null && (
        <p className="pt-0.5 text-xs font-semibold text-ink-2">
          Median {withinTarget ? "di bawah" : "di atas"} target
        </p>
      )}
    </TooltipShell>
  );
}

export default function ResponseTimeChart({
  data,
  targetSeconds,
}: {
  data: ResponseTimeEntry[];
  targetSeconds: number;
}) {
  const chartData: Datum[] = data.map((entry) => ({
    label: formatDateShort(entry.date),
    median: entry.median_response_seconds,
    p90: entry.p90_response_seconds,
    inbound: entry.inbound_turn_count,
    unanswered: entry.unanswered_turn_count,
  }));

  const peak = chartData.reduce(
    (highest, datum) => Math.max(highest, datum.p90 ?? 0, datum.median ?? 0),
    targetSeconds
  );
  const ticks = durationTicks(peak);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 16, left: -8 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--axis)" }}
            tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
            minTickGap={16}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
            width={52}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={formatDurationTick}
          />
          <Tooltip
            content={<ResponseTooltip targetSeconds={targetSeconds} />}
            cursor={{ stroke: "var(--axis)" }}
          />
          {/* Ambang target — garis putus-putus di sini berarti "threshold",
              bukan gridline. */}
          <ReferenceLine
            y={targetSeconds}
            stroke="var(--ink-muted)"
            strokeDasharray="5 4"
            ifOverflow="extendDomain"
          />
          <Line
            type="monotone"
            dataKey="median"
            stroke={RESPONSE_SERIES[0].color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls={false}
            dot={{
              r: 4,
              fill: RESPONSE_SERIES[0].color,
              stroke: "var(--surface)",
              strokeWidth: 2,
            }}
            activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="p90"
            stroke={RESPONSE_SERIES[1].color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls={false}
            dot={{
              r: 4,
              fill: RESPONSE_SERIES[1].color,
              stroke: "var(--surface)",
              strokeWidth: 2,
            }}
            activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
