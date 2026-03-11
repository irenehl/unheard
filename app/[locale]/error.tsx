"use client";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        We could not render this page. Try again, and if the issue persists share the
        debug digest shown below.
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        digest: {error.digest ?? "n/a"}
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center h-9 bg-primary px-4 text-xs font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-colors uppercase"
      >
        Retry
      </button>
    </div>
  );
}
