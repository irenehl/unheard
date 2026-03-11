export default function Loading() {
  return (
    <main aria-busy="true">
      <section className="relative flex min-h-dvh flex-col justify-between border-b border-border px-6 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="h-2 w-24 animate-pulse bg-secondary" />
          <div className="h-2 w-20 animate-pulse bg-secondary" />
        </div>

        <div>
          <div className="h-24 w-[70%] animate-pulse bg-secondary sm:h-32" />
          <div className="mt-5 border-t border-border pt-5">
            <div className="h-2 w-full max-w-xl animate-pulse bg-secondary" />
            <div className="mt-3 h-2 w-[85%] max-w-xl animate-pulse bg-secondary" />
          </div>
        </div>
      </section>

      <section className="h-dvh w-full animate-pulse bg-secondary/70" />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="border-t-[3px] border-b-[3px] border-foreground">
          <div className="columns-1 gap-x-px bg-border md:columns-2 lg:columns-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="mb-px h-56 w-full break-inside-avoid bg-background/90 p-8"
              >
                <div className="h-2 w-24 animate-pulse bg-secondary" />
                <div className="mt-5 h-2 w-full animate-pulse bg-secondary" />
                <div className="mt-3 h-2 w-[92%] animate-pulse bg-secondary" />
                <div className="mt-3 h-2 w-[84%] animate-pulse bg-secondary" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
