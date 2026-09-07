"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { formatNumber } from "@/lib/format";

/** Jendela nomor halaman: current ± 1, plus halaman pertama dan terakhir. */
function pageItems(page: number, totalPage: number): (number | "gap")[] {
  if (totalPage <= 7)
    return Array.from({ length: totalPage }, (_, index) => index + 1);

  const window = new Set([1, totalPage, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => window.add(value));
  if (page >= totalPage - 2)
    [totalPage - 3, totalPage - 2, totalPage - 1].forEach((value) =>
      window.add(value)
    );

  const pages = [...window]
    .filter((value) => value >= 1 && value <= totalPage)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const value of pages) {
    if (previous && value - previous > 1) items.push("gap");
    items.push(value);
    previous = value;
  }
  return items;
}

const BUTTON =
  "rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-2";

interface PaginationProps {
  /** Nama query param supaya beberapa tabel bisa dipaginasi terpisah. */
  param: string;
  page: number;
  totalPage: number;
  totalData: number;
  /** Jumlah baris yang benar-benar tampil, bukan page_size yang diminta. */
  shown: number;
  pageSize: number;
}

export default function Pagination({
  param,
  page,
  totalPage,
  totalData,
  shown,
  pageSize,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  if (totalPage <= 1) return null;

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete(param);
    else params.set(param, String(next));
    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  const first = shown === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = shown === 0 ? 0 : first + shown - 1;

  return (
    <nav
      aria-label="Navigasi halaman"
      className={`mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <p className="text-xs text-ink-muted">
        <span className="tabular-nums">
          {formatNumber(first)}–{formatNumber(last)}
        </span>{" "}
        dari <span className="tabular-nums">{formatNumber(totalData)}</span>{" "}
        brand deal
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={BUTTON}
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          Sebelumnya
        </button>

        {pageItems(page, totalPage).map((item, index) =>
          item === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden
              className="px-1 text-xs text-ink-muted"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-label={`Halaman ${item}`}
              aria-current={item === page ? "page" : undefined}
              onClick={() => goTo(item)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums transition ${
                item === page
                  ? "bg-ink text-surface"
                  : "border border-hairline bg-surface text-ink-2 shadow-card hover:text-ink"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className={BUTTON}
          disabled={page >= totalPage}
          onClick={() => goTo(page + 1)}
        >
          Berikutnya
        </button>
      </div>
    </nav>
  );
}
