import { useEffect, useMemo, useState } from "react";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import Editor from "./components/Editor";
import { ProblemDetail, ProblemList } from "./components/ProblemPanel";
import Result from "./components/Result";
import { connectToJob, getQuestion, listQuestions, submitCode } from "./api";

function App({ authEnabled }) {
  if (!authEnabled) {
    return <ClerkSetupScreen />;
  }

  return (
    <>
      <SignedOut>
        <SignedOutScreen />
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<Navigate to="/problems" replace />} />
          <Route path="/problems" element={<ProblemsIndex />} />
          <Route path="/problems/:slug" element={<ProblemWorkspace />} />
          <Route path="*" element={<Navigate to="/problems" replace />} />
        </Routes>
      </SignedIn>
    </>
  );
}

function ProblemsIndex() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadQuestions() {
      try {
        setLoading(true);
        const data = await listQuestions();
        if (ignore) {
          return;
        }

        setQuestions(data.questions ?? []);
        setError("");
      } catch (loadErr) {
        if (!ignore) {
          setError(loadErr.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadQuestions();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <LoadingScreen label="Loading your problem set..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%),#020617] text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[1.75rem] border border-white/10 bg-slate-950/80 px-5 py-4 shadow-[0_16px_60px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-300/80">
                Judge0 Mini
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Choose a problem to start solving
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Signed in as <span className="font-semibold text-white">{user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress}</span>. Selecting a problem takes you to a dedicated solve page.
              </p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <ProblemList
          questions={questions}
          activeSlug=""
          onSelect={(slug) => navigate(`/problems/${slug}`)}
        />
      </div>
    </main>
  );
}

function ProblemWorkspace() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState("python");
  const [drafts, setDrafts] = useState({});
  const [jobState, setJobState] = useState("idle");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) {
      return;
    }

    let ignore = false;

    async function loadQuestion() {
      try {
        setLoading(true);
        const data = await getQuestion(slug);
        if (ignore) {
          return;
        }

        setQuestion(data);
        setLanguage("python");
        setResult(null);
        setJobState("idle");
        setDrafts((current) => ({
          ...current,
          [slug]: current[slug] ?? { ...data.starterCode },
        }));
        setError("");
      } catch (loadErr) {
        if (!ignore) {
          setError(loadErr.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadQuestion();

    return () => {
      ignore = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!question) {
      return;
    }

    setDrafts((current) => {
      const existing = current[question.slug] ?? {};
      const nextDraft = { ...question.starterCode, ...existing };
      return {
        ...current,
        [question.slug]: nextDraft,
      };
    });
  }, [question]);

  const currentCode = question
    ? drafts[question.slug]?.[language] ?? question.starterCode?.[language] ?? ""
    : "";

  const sampleInput = useMemo(() => {
    if (!question?.examples?.length) {
      return "";
    }

    return question.examples[0].input;
  }, [question]);

  const handleCodeChange = (value) => {
    if (!question) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [question.slug]: {
        ...current[question.slug],
        [language]: value,
      },
    }));
  };

  const handleReset = () => {
    if (!question) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [question.slug]: {
        ...current[question.slug],
        [language]: question.starterCode?.[language] ?? "",
      },
    }));
    setResult(null);
    setJobState("idle");
  };

  const handleRun = async () => {
    if (!question) {
      return;
    }

    setResult(null);
    setJobState("submitting");

    try {
      const submission = await submitCode({
        code: currentCode,
        language,
        test_cases: question.testCases,
      });

      setJobState("running");
      const ws = connectToJob(submission.job_id);

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        setResult(payload);
        setJobState("completed");
        ws.close();
      };

      ws.onerror = () => {
        setJobState("error");
      };
    } catch (runErr) {
      console.error(runErr);
      setJobState("error");
    }
  };

  if (loading) {
    return <LoadingScreen label="Loading problem workspace..." />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_28%),#020617] text-slate-100">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 rounded-[1.75rem] border border-white/10 bg-slate-950/80 px-5 py-4 shadow-[0_16px_60px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate("/problems")}
                className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 transition hover:border-white/30 hover:bg-white/5"
              >
                Back to Problems
              </button>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {question?.title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Focus mode for <span className="font-semibold text-white">{user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress}</span>. This route only shows the problem, editor, and output.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start lg:self-center">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {jobState === "idle" ? "Ready to code" : `Submission: ${jobState}`}
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(430px,1.08fr)]">
          <ProblemDetail question={question} />
          <div className="space-y-4">
            <Editor
              language={language}
              code={currentCode}
              onCodeChange={handleCodeChange}
              onLanguageChange={setLanguage}
              onReset={handleReset}
              onSubmit={handleRun}
              isRunning={jobState === "submitting" || jobState === "running"}
              sampleInput={sampleInput}
            />
            <Result result={result} jobState={jobState} />
          </div>
        </div>
      </div>
    </main>
  );
}

function SignedOutScreen() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_26%),#020617] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.55)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-300/80">
            Judge0 Mini
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl">
            Solve coding problems in a focused workspace built for fast runs.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Sign in first, browse the problem set, then move into a dedicated route for each question with a distraction-free solve screen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
              >
                Sign In with Clerk
              </button>
            </SignInButton>
            <div className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-300">
              Problem list route and focused solve route enabled
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.4)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/80">
            Flow
          </p>
          <div className="mt-5 space-y-4">
            {["Sign in", "Browse questions on /problems", "Solve on /problems/:slug"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 text-sm leading-7 text-slate-300"
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function ClerkSetupScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.55)]">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-300/80">
          Clerk Setup Required
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Add your Clerk publishable key to launch the authenticated workspace.
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Create a `frontend/.env.local` file and set `VITE_CLERK_PUBLISHABLE_KEY`. Once that is present, the app will show sign-in and the new routed problem flow.
        </p>
      </div>
    </main>
  );
}

function LoadingScreen({ label }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-300">
        {label}
      </div>
    </main>
  );
}

function ErrorScreen({ message }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-xl rounded-[1.75rem] border border-rose-400/20 bg-rose-500/10 px-6 py-5">
        <p className="text-lg font-semibold text-white">Unable to load the coding workspace</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">{message}</p>
      </div>
    </main>
  );
}

export default App;
