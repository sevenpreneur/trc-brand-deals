export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-hairline px-4 py-8 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
}
