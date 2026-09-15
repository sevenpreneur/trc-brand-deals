function Block({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-hairline bg-surface ${className}`}
    />
  );
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">
      <div className="h-8 w-80 animate-pulse rounded-lg bg-surface-sunken" />
      <div className="mt-3 h-4 w-96 animate-pulse rounded bg-surface-sunken" />
      <div className="mt-6 h-9 w-72 animate-pulse rounded-full bg-surface-sunken" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
        <Block className="h-32" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Block className="h-96 xl:col-span-8" />
        <Block className="h-96 xl:col-span-4" />
      </div>

      <div className="mt-4 grid gap-4">
        <Block className="h-[26rem]" />
        <Block className="h-80" />
      </div>
    </div>
  );
}
