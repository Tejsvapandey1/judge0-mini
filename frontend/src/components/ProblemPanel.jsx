export function ProblemList({ questions, activeSlug, onSelect }) {
  return (
    <aside className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
            Problems
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Sample Set</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
          {questions.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {questions.map((question, index) => {
          const active = question.slug === activeSlug;
          return (
            <button
              type="button"
              key={question.slug}
              onClick={() => onSelect(question.slug)}
              className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-400/10"
                  : "border-white/10 bg-slate-950/70 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  #{index + 1}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                  {question.difficulty}
                </span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">{question.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {question.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export function ProblemDetail({ question }) {
  if (!question) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5 text-slate-300">
        Loading question...
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.35)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Problem
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            {question.title}
          </h1>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
          {question.difficulty}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {question.topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="mt-6 space-y-6 text-sm leading-7 text-slate-200">
        {question.description.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {question.examples.map((example, index) => (
          <div key={`${example.input}-${index}`} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Example {index + 1}
            </h3>
            <ProblemValue label="Input" value={example.input} />
            <ProblemValue label="Output" value={example.output} />
            {example.explanation ? <ProblemValue label="Explanation" value={example.explanation} /> : null}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300/80">
          Constraints
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {question.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ProblemValue({ label, value }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100">
        {value}
      </pre>
    </div>
  );
}
