"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "leads", label: "Leads" },
  { value: "queue", label: "Queue" },
  { value: "conversations", label: "Conversations" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function LeadsTabs({
  counts,
}: {
  counts: Partial<Record<TabValue, number>>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const active = (searchParams.get("view") as TabValue) ?? "overview";

  function go(value: TabValue) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "overview") next.delete("view");
    else next.set("view", value);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1 border-b border-hairline transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        const count = counts[tab.value];
        return (
          <button
            key={tab.value}
            type="button"
            aria-current={isActive ? "page" : undefined}
            onClick={() => go(tab.value)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-ink text-ink"
                : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {tab.label}
            {count != null && (
              <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[11px] tabular-nums text-ink-muted">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
