import MonacoEditor from "@monaco-editor/react";

const languages = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
];

export default function Editor({
  language,
  code,
  onCodeChange,
  onLanguageChange,
  onReset,
  onSubmit,
  isRunning,
  sampleInput,
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.55)]">
      <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
            Workspace
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Solve in your preferred language
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Language
          </label>
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-100 outline-none transition focus:border-cyan-400"
          >
            {languages.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/5"
          >
            Reset Code
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isRunning}
            className="rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 bg-slate-900/80 px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
          Sample Input
        </p>
        <pre className="mt-2 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-3 font-mono text-sm text-cyan-100">
          {sampleInput || "No sample available"}
        </pre>
      </div>

      <MonacoEditor
        height="520px"
        theme="vs-dark"
        language={language === "cpp" ? "cpp" : language}
        value={code}
        onChange={(value) => onCodeChange(value ?? "")}
        options={{
          fontSize: 15,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 18 },
          roundedSelection: true,
          wordWrap: "on",
          lineNumbersMinChars: 3,
        }}
      />
    </section>
  );
}
