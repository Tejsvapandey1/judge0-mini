function getStatusTone(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30";
    case "running":
    case "submitting":
    case "pending":
      return "bg-amber-500/15 text-amber-200 ring-amber-400/30";
    case "error":
      return "bg-rose-500/15 text-rose-200 ring-rose-400/30";
    default:
      return "bg-slate-800 text-slate-200 ring-white/10";
  }
}

function getVerdictTone(verdict) {
  switch (verdict) {
    case "Accepted":
      return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30";
    case "Wrong Answer":
    case "Runtime Error":
    case "Compilation Error":
      return "bg-rose-500/15 text-rose-200 ring-rose-400/30";
    case "Time Limit Exceeded":
      return "bg-amber-500/15 text-amber-200 ring-amber-400/30";
    default:
      return "bg-slate-800 text-slate-200 ring-white/10";
  }
}

export default function Result({ result, jobState }) {
  const tests = result?.results ?? [];
  const acceptedCount = tests.filter((item) => item.verdict === "Accepted").length;
  const status = result?.status ?? jobState;

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Results
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Submission Panel</h2>
        </div>
        <div className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${getStatusTone(status)}`}>
          {status}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Passed
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {acceptedCount}/{tests.length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            State
          </p>
          <p className="mt-2 text-3xl font-semibold capitalize text-white">{status}</p>
        </div>
      </div>

      {!result ? (
        <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/70 p-5">
          <p className="text-lg font-semibold text-white">No submission yet</p>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            Run the current solution to see verdicts, expected output, and actual output for each test case.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {tests.map((item, index) => (
            <article
              key={`${item.input}-${index}`}
              className="rounded-[1.5rem] border border-white/10 bg-slate-950/75 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Test {index + 1}
                </span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getVerdictTone(item.verdict)}`}>
                  {item.verdict}
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <ResultBlock label="Input" value={item.input} />
                <ResultBlock label="Expected" value={item.expected} />
                <ResultBlock label="Got" value={item.got || "No output"} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ResultBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100">
        {value}
      </pre>
    </div>
  );
}
