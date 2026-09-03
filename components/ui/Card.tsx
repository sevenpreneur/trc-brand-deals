import type { ReactNode } from "react";

interface CardProps {
  title: string;
  description?: string;
  /** Legend / kontrol kecil di kanan header. */
  aside?: ReactNode;
  footnote?: string;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  description,
  aside,
  footnote,
  className = "",
  children,
}: CardProps) {
  return (
    <section
      className={`flex min-w-0 flex-col rounded-2xl border border-hairline bg-surface p-5 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-ink-2">{description}</p>
          )}
        </div>
        {aside}
      </div>
      <div className="mt-4 flex-1">{children}</div>
      {footnote && (
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">{footnote}</p>
      )}
    </section>
  );
}
