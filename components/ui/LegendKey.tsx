interface LegendItem {
  label: string;
  color: string;
  /** "dash" untuk penanda ambang/threshold, bukan seri data. */
  variant?: "dot" | "dash";
}

interface LegendKeyProps {
  items: LegendItem[];
}

/**
 * Legend selalu hadir untuk chart dengan >= 2 seri — identitas tidak boleh
 * bergantung pada pencocokan warna saja. Teks tetap memakai token ink.
 */
export default function LegendKey({ items }: LegendKeyProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          {item.variant === "dash" ? (
            <span
              aria-hidden
              className="h-0 w-4 shrink-0 border-t-2 border-dashed"
              style={{ borderColor: item.color }}
            />
          ) : (
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
          )}
          <span className="text-xs font-medium text-ink-2">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
