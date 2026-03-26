import { useEffect, useState } from "react";
import Editor from "./components/Editor";
import Result from "./components/Result";
import { submitCode } from "./api";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [result, setResult] = useState(null);
  const [jobState, setJobState] = useState("idle");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSubmit = async (job) => {
    setResult(null);
    setJobState("submitting");

    try {
      const res = await submitCode(job);
      const jobId = res.job_id;

      setJobState("running");

      const ws = new WebSocket(`ws://localhost:5000/ws/${jobId}`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setResult(data);
        setJobState("completed");
        ws.close();
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setJobState("error");
      };
    } catch (error) {
      console.error("Submission failed:", error);
      setJobState("error");
    }
  };

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <main className="min-h-screen bg-stone-100 text-stone-800 transition-colors duration-300 dark:bg-[#0b1220] dark:text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-orange-50 via-amber-50 to-emerald-50 p-6 shadow-[0_30px_80px_rgba(120,86,40,0.12)] transition-colors duration-300 dark:border-white/10 dark:from-[#111827] dark:via-[#0f172a] dark:to-[#0d1b2a] dark:shadow-[0_30px_80px_rgba(2,6,23,0.55)] sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_35%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.14),transparent_35%)] lg:block" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-700 dark:text-orange-300">
                Judge0 Mini
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-none tracking-[-0.06em] text-stone-950 dark:text-white sm:text-5xl lg:text-7xl">
                Run code in a Tailwind workspace built for fast feedback.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-600 dark:text-slate-300 sm:text-base">
                Submit code, stream results from the backend, and compare
                expected versus actual output in a layout that feels clean on
                mobile and comfortable on large screens.
              </p>
            </div>

            <div className="relative flex w-full max-w-sm flex-col gap-4 self-stretch rounded-[1.75rem] border border-black/10 bg-white/80 p-4 backdrop-blur xl:p-5 dark:border-white/10 dark:bg-white/5">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:bg-stone-700 dark:border-white/10 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>

              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-medium text-stone-700 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    jobState === "completed"
                      ? "bg-emerald-500"
                      : jobState === "error"
                        ? "bg-rose-500"
                        : jobState === "running" || jobState === "submitting"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                  }`}
                />
                <span className="capitalize">{jobState}</span>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                    Pipeline
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-900 dark:text-white">
                    REST submit -> worker -> WebSocket result
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
                    UX
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-900 dark:text-white">
                    Responsive layout with persistent theme preference
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
          <Editor
            onSubmit={handleSubmit}
            isRunning={jobState === "submitting" || jobState === "running"}
            theme={theme}
          />
          <Result result={result} jobState={jobState} />
        </section>
      </div>
    </main>
  );
}

export default App;
