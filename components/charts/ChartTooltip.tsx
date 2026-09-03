import type { ReactNode } from "react";

export function TooltipShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-ink">{title}</p>
      <div className="mt-1.5 space-y-1">{children}</div>
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2 text-xs text-ink-2">
      {color && (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ background: color }}
        />
      )}
      <span>{label}</span>
      <span className="ml-auto pl-3 font-semibold text-ink tabular-nums">
        {value}
      </span>
    </p>
  );
}
