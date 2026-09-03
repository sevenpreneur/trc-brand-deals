"use client";

import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { InboundHeatmapEntry } from "@/apis/stat";
import { DAY_LABEL, formatNumber } from "@/lib/format";
import { TooltipRow, TooltipShell } from "./ChartTooltip";

const HEAT_STEPS = [
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
  "var(--heat-5)",
  "var(--heat-6)",
];
const EMPTY_COLOR = "var(--heat-0)";

const MARGIN = { top: 8, right: 12, bottom: 24, left: 36 };
const CHART_HEIGHT = 232;
const HOURS = 24;
const DAYS = 7;
/** Celah 2px berwarna surface antar sel — pemisah tanpa border. */
const GAP = 2;

interface Cell {
  hour: number;
  day: number;
  messages: number;
  conversations: number;
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

interface HeatTooltipProps {
  active?: boolean;
  payload?: { payload: Cell }[];
}

function HeatTooltip({ active, payload }: HeatTooltipProps) {
  if (!active || !payload?.length) return null;
  const cell = payload[0].payload;
  const hour = String(cell.hour).padStart(2, "0");
  return (
    <TooltipShell title={`${DAY_LABEL[cell.day]} · ${hour}.00–${hour}.59`}>
      <TooltipRow label="Pesan masuk" value={formatNumber(cell.messages)} />
      <TooltipRow label="Percakapan" value={formatNumber(cell.conversations)} />
    </TooltipShell>
  );
}

export default function InboundHeatmapChart({
  data,
  totalMessages,
}: {
  data: InboundHeatmapEntry[];
  totalMessages: number;
}) {
  const { ref, width } = useContainerWidth();

  const byKey = new Map<string, InboundHeatmapEntry>();
  for (const entry of data) {
    byKey.set(`${entry.day_of_week}-${entry.hour}`, entry);
  }

  const cells: Cell[] = [];
  for (let day = 0; day < DAYS; day += 1) {
    for (let hour = 0; hour < HOURS; hour += 1) {
      const entry = byKey.get(`${day + 1}-${hour}`);
      cells.push({
        hour,
        day,
        messages: entry?.message_count ?? 0,
        conversations: entry?.conversation_count ?? 0,
      });
    }
  }

  const max = cells.reduce((peak, cell) => Math.max(peak, cell.messages), 0);
  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const cellWidth = plotWidth / HOURS;
  const cellHeight = (CHART_HEIGHT - MARGIN.top - MARGIN.bottom) / DAYS;

  function colorFor(messages: number) {
    if (messages === 0 || max === 0) return EMPTY_COLOR;
    const step = Math.ceil((messages / max) * HEAT_STEPS.length);
    return HEAT_STEPS[Math.min(step, HEAT_STEPS.length) - 1];
  }

  function renderCell(props: { cx?: number; cy?: number; payload?: Cell }) {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return <g />;
    const rectWidth = Math.max(1, cellWidth - GAP);
    const rectHeight = Math.max(1, cellHeight - GAP);
    return (
      <rect
        x={cx - rectWidth / 2}
        y={cy - rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        rx={3}
        fill={colorFor(payload.messages)}
      />
    );
  }

  return (
    <div>
      <div ref={ref} style={{ height: CHART_HEIGHT }} className="w-full">
        {width > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={MARGIN}>
              <XAxis
                type="number"
                dataKey="hour"
                domain={[-0.5, HOURS - 0.5]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                tickFormatter={(hour: number) =>
                  `${String(hour).padStart(2, "0")}.00`
                }
              />
              <YAxis
                type="number"
                dataKey="day"
                domain={[-0.5, DAYS - 0.5]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                reversed
                tickLine={false}
                axisLine={false}
                width={MARGIN.left}
                tick={{ fill: "var(--ink-muted)", fontSize: 11 }}
                tickFormatter={(day: number) => DAY_LABEL[day] ?? ""}
              />
              <Tooltip content={<HeatTooltip />} cursor={false} />
              <Scatter
                data={cells}
                shape={renderCell}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ramp sequential selalu disertai legenda skala. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">0</span>
          <div className="flex gap-0.5">
            <span
              className="h-3 w-6 rounded-xs"
              style={{ background: EMPTY_COLOR }}
            />
            {HEAT_STEPS.map((color) => (
              <span
                key={color}
                className="h-3 w-6 rounded-xs"
                style={{ background: color }}
              />
            ))}
          </div>
          <span className="text-xs text-ink-muted tabular-nums">
            {formatNumber(max)} pesan
          </span>
        </div>
        <span className="text-xs text-ink-muted">
          Total {formatNumber(totalMessages)} pesan masuk
        </span>
      </div>
    </div>
  );
}
