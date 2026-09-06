"use client";

import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  function handleRetry() {
    reset();
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-12 text-foreground sm:px-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-(--mint)/40 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-1/2 w-full bg-[linear-gradient(135deg,transparent_0_49%,rgba(29,37,34,.035)_49%_50%,transparent_50%)]" />

      <section className="relative mx-auto w-full max-w-3xl">
        <div className="mb-16 flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.18em] text-(--ink-muted)">
          <span className="h-2 w-2 rounded-full bg-(--accent)" />
          GETME / ERROR
        </div>

        <div className="grid gap-12 border-t border-(--line) pt-8 md:grid-cols-[1fr_auto] md:items-end md:gap-20">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-(--ink-muted)">
              The numbers slipped away
            </p>
            <h1 className="mt-5 max-w-xl text-6xl font-medium leading-[0.92] tracking-[-0.055em] sm:text-8xl">
              Something went <em className="font-serif font-normal not-italic text-(--accent)">wrong.</em>
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-(--ink-muted)">
              We are sorry, but an unexpected error has occurred. Try the game
              again and we will get you back on track.
            </p>
          </div>

          <div className="border-l-2 border-(--accent) pl-5 text-sm text-(--ink-muted) md:max-w-48">
            <span className="mb-2 block font-serif text-4xl text-(--accent)">!</span>
            <p>Something interrupted the next move.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-(--line) pt-6">
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-12 border border-(--accent) bg-(--accent) px-5 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-(--accent-dark) focus:outline-none focus:ring-4 focus:ring-[rgba(214,90,58,.18)]"
          >
            Try again
          </button>
          <p className="max-w-md truncate font-mono text-xs text-(--ink-muted)" title={error.message}>
            {error.message}
          </p>
        </div>
      </section>
    </main>
  );
}
