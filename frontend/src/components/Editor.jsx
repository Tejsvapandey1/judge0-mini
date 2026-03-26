import Editor from "@monaco-editor/react";
import { useState } from "react";

const starterCode = {
  python: `a, b = map(int, input().split())\nprint(a + b)`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b;\n  return 0;\n}`,
  java: `import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int a = sc.nextInt();\n    int b = sc.nextInt();\n    System.out.println(a + b);\n  }\n}`,
};

export default function CodeEditor({ onSubmit, isRunning, theme }) {
  const [code, setCode] = useState(starterCode.python);
  const [language, setLanguage] = useState("python");

  const handleLanguageChange = (event) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    setCode(starterCode[nextLanguage]);
  };

  const handleSubmit = () => {
    const job = {
      code,
      language,
      testCases: [
        { input: "2 3", output: "5" },
      ],
    };

    onSubmit(job);
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white/80 p-4 shadow-[0_24px_70px_rgba(120,86,40,0.10)] backdrop-blur transition-colors duration-300 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-700 dark:text-orange-300">
            Editor
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950 dark:text-white sm:text-3xl">
            Code workspace
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 dark:text-slate-300">
            Starter templates are wired to the sample test case so we can verify
            the full judge flow quickly.
          </p>
        </div>

        <div className="w-full max-w-xs">
          <label
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400"
            htmlFor="language"
          >
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={handleLanguageChange}
            className="w-full rounded-2xl border border-black/10 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-orange-400 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-black/10 dark:border-white/10">
        <Editor
        height="460px"
        theme={theme === "dark" ? "vs-dark" : "light"}
        language={language === "cpp" ? "cpp" : language}
        value={code}
        onChange={(value) => setCode(value ?? "")}
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
      </div>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="rounded-[1.5rem] border border-black/10 bg-stone-50 px-4 py-3 dark:border-white/10 dark:bg-slate-900/80">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-500 dark:text-slate-400">
            Sample input
          </p>
          <code className="mt-2 inline-flex rounded-xl bg-white px-3 py-2 text-sm text-stone-900 dark:bg-slate-800 dark:text-slate-100">
            2 3
          </code>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(249,115,22,0.28)] transition hover:translate-y-[-1px] disabled:cursor-wait disabled:opacity-70"
          onClick={handleSubmit}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>
    </section>
  );
}
