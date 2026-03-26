export default function Result({ result, jobState }) {
  const testResults = result?.results ?? [];
  const statusLabel = result?.status ?? jobState;

  const statusClasses = {
    idle: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
    pending:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    submitting:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    running:
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    completed:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    error:
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
  };

  const verdictClasses = {
    Accepted:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    "Wrong Answer":
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    "Runtime Error":
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    "Compilation Error":
      "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    "Time Limit Exceeded":
      "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-4 shadow-[0_24px_70px_rgba(120,86,40,0.10)] backdrop-blur transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
            Results
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Execution summary
          </h2>
          <p className="mt-3 text-sm leading-7 text-stone-600 dark:text-slate-300">
            Compare each test case against what your program actually returned.
          </p>
        </div>

        <div
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ring-1 ${
            statusClasses[statusLabel] ?? statusClasses.idle
          }`}
        >
          <span className="capitalize">{statusLabel}</span>
        </div>
      </div>

      {!result && (
        <div className="mt-5 flex min-h-[320px] flex-col justify-center rounded-[1.75rem] border border-dashed border-black/15 bg-gradient-to-br from-orange-50 via-white to-emerald-50 p-6 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/30">
          <p className="text-2xl font-bold tracking-tight text-stone-950 dark:text-white">
            No run yet
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-stone-600 dark:text-slate-300">
            Execute the sample or your own code to inspect verdicts and actual
            output here.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-5 grid gap-4">
          {testResults.map((item, index) => (
            <article
              className="rounded-[1.5rem] border border-black/10 bg-stone-50/80 p-4 dark:border-white/10 dark:bg-slate-900/70"
              key={`${item.input}-${index}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-500 dark:text-slate-400">
                  Test {index + 1}
                </span>
                <strong
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                    verdictClasses[item.verdict] ?? statusClasses.idle
                  }`}
                >
                  {item.verdict}
                </strong>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                    Input
                  </span>
                  <code className="mt-2 inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900 dark:bg-slate-800 dark:text-slate-100">
                    {item.input}
                  </code>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                    Expected
                  </span>
                  <code className="mt-2 inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900 dark:bg-slate-800 dark:text-slate-100">
                    {item.expected}
                  </code>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-950/80">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                    Got
                  </span>
                  <code className="mt-2 inline-flex max-w-full overflow-x-auto rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-900 dark:bg-slate-800 dark:text-slate-100">
                    {item.got || "No output"}
                  </code>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
