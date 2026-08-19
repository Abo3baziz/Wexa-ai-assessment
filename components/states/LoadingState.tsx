export function LoadingState() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <div className="h-28 w-full animate-pulse rounded-xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 w-full animate-pulse rounded-xl bg-surface-2"
          />
        ))}
      </div>
      <span className="sr-only">Loading patient overview</span>
    </div>
  );
}
