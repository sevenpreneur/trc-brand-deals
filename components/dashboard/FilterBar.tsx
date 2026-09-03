"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RANGE_PRESETS, type RangeValue } from "@/lib/format";

const TARGET_OPTIONS = [
  { value: 300, label: "5 menit" },
  { value: 900, label: "15 menit" },
  { value: 1800, label: "30 menit" },
  { value: 3600, label: "1 jam" },
];

interface FilterBarProps {
  range: RangeValue;
  targetSeconds: number;
}

export default function FilterBar({ range, targetSeconds }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);
    startTransition(() => {
      router.replace(`/?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <div
        role="group"
        aria-label="Rentang tanggal"
        className="inline-flex rounded-full border border-hairline bg-surface p-1 shadow-card"
      >
        {RANGE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={range === preset.value}
            onClick={() => setParam("range", preset.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              range === preset.value
                ? "bg-ink text-surface"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-ink-2">
        Target balas
        <select
          value={targetSeconds}
          onChange={(event) => setParam("target", event.target.value)}
          className="rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink shadow-card"
        >
          {TARGET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
