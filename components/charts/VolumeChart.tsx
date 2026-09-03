"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarShapeProps } from "recharts";
import type { ChatsVolumeEntry } from "@/apis/stat";
import { VOLUME_SERIES } from "@/lib/chart-series";
import { countTicks, formatDateShort, formatNumber } from "@/lib/format";
import { TooltipRow, TooltipShell } from "./ChartTooltip";

const SERIES = VOLUME_SERIES;

interface Datum {
  date: string;
  label: string;
  baru: number;
  lanjutan: number;
  total: number;
}

interface VolumeTooltipProps {
  active?: boolean;
  payload?: { payload: Datum }[];
}

function VolumeTooltip({ active, payload }: VolumeTooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;
  return (
    <TooltipShell title={datum.label}>
      <TooltipRow
        color={SERIES[0].color}
        label={SERIES[0].label}
        value={formatNumber(datum.baru)}
      />
      <TooltipRow
        color={SERIES[1].color}
        label={SERIES[1].label}
        value={formatNumber(datum.lanjutan)}
      />
      <TooltipRow label="Total percakapan" value={formatNumber(datum.total)} />
    </TooltipShell>
  );
}

/**
 * Ujung atas stack dibulatkan 4px, alas tetap siku. Segmen "lanjutan" bisa
 * bernilai 0, jadi "baru" ikut dibulatkan ketika dia yang jadi segmen teratas.
 */
function BaruBarShape(props: BarShapeProps) {
  const datum = props.payload as Datum | undefined;
  const isTop = (datum?.lanjutan ?? 0) === 0;
  return <Rectangle {...props} radius={isTop ? [4, 4, 0, 0] : 0} />;
}

export default function VolumeChart({ data }: { data: ChatsVolumeEntry[] }) {
  const chartData: Datum[] = data.map((entry) => ({
    date: entry.date,
    label: formatDateShort(entry.date),
    baru: entry.new_conversation_count,
    lanjutan: entry.returning_conversation_count,
    total: entry.conversation_count,
  }));

  const peak = chartData.reduce(
    (highest, datum) => Math.max(highest, datum.total),
    0
  );
  const ticks = countTicks(peak);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16 }}>
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
            width={44}
            allowDecimals={false}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <Tooltip
            content={<VolumeTooltip />}
            cursor={{ fill: "var(--surface-sunken)" }}
          />
          {/* stroke berwarna surface = celah 2px antar segmen, bukan border. */}
          <Bar
            dataKey="baru"
            stackId="volume"
            fill={SERIES[0].color}
            stroke="var(--surface)"
            strokeWidth={2}
            maxBarSize={24}
            shape={BaruBarShape}
            isAnimationActive={false}
          />
          <Bar
            dataKey="lanjutan"
            stackId="volume"
            fill={SERIES[1].color}
            stroke="var(--surface)"
            strokeWidth={2}
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
