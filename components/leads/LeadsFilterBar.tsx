"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { RANGE_PRESETS, RESPONSE_MODES, type RangeValue } from "@/lib/format";
import type { ResponseMode } from "@/lib/types";

const TARGETS = [
  { value: 300, label: "≤ 5 min" },
  { value: 900, label: "≤ 15 min" },
  { value: 1800, label: "≤ 30 min" },
];

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-hairline bg-surface p-0.5">
        {children}
      </div>
    </div>
  );
}

interface LeadsFilterBarProps {
  range: RangeValue;
  responseMode: ResponseMode;
  targetSeconds: number;
}

export default function LeadsFilterBar({
  range,
  responseMode,
  targetSeconds,
}: LeadsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  const seg = "rounded-md px-3 py-1.5 text-xs font-medium transition";
  const on = "bg-ink text-surface";
  const off = "text-ink-2 hover:text-ink";

  return (
    <div
      className={`flex flex-wrap items-start gap-x-8 gap-y-4 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <Group label="Window">
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={range === preset.value}
            onClick={() => setParam("range", preset.value)}
            className={`${seg} ${range === preset.value ? on : off}`}
          >
            {preset.label}
          </button>
        ))}
      </Group>

      <Group label="Reply time measured on">
        {RESPONSE_MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={responseMode === option.value}
            onClick={() => setParam("mode", option.value)}
            className={`${seg} ${responseMode === option.value ? on : off}`}
          >
            {option.label}
          </button>
        ))}
      </Group>

      <Group label="Reply target">
        {TARGETS.map((target) => (
          <button
            key={target.value}
            type="button"
            aria-pressed={targetSeconds === target.value}
            onClick={() => setParam("target", String(target.value))}
            className={`${seg} ${targetSeconds === target.value ? on : off}`}
          >
            {target.label}
          </button>
        ))}
      </Group>
    </div>
  );
}
