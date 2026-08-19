export function ErrorState({
  message,
  retry,
  onRetry,
}: {
  message: string;
  retry: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-6 py-14 text-center"
      role="alert"
    >
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-soft">
        <svg
          className="h-6 w-6 text-brand"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
          />
        </svg>
      </div>
      <h3 className="text-base font-medium text-ink">Couldn’t load the data</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {retry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
