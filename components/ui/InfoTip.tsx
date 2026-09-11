/** Ikon "i" menampilkan definisi metric saat diarahkan atau difokuskan. */
export default function InfoTip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={text}
        className="peer flex size-4 cursor-help items-center justify-center rounded-full border border-hairline text-[10px] leading-none font-semibold text-ink-muted transition-colors hover:border-ink-muted hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        i
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border border-hairline bg-surface px-3 py-2 text-left text-xs leading-relaxed font-normal text-ink-2 opacity-0 shadow-lg transition-opacity duration-100 peer-hover:opacity-100 peer-focus:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
