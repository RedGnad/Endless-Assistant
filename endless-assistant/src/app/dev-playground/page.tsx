"use client";

import { useState } from "react";

type RiskLevel = "low" | "medium" | "high";

type AnalysisAction = {
  type: string;
  description: string;
  severity?: string;
};

type AnalysisRisk = {
  type: string;
  level: RiskLevel | string;
  description: string;
};

type AnalysisPrivacy = {
  type: string;
  description: string;
};

type DeveloperHint = {
  type: string;
  description: string;
};

type Explanation = {
  userHeadline: string;
  userBody: string;
  userPrivacyNote: string;
  devNotes: string;
};

type OnchainRiskLevel = "unknown" | "low" | "medium" | "high";

type OnchainRiskSignal = {
  source: "onchainRegistry";
  contract: string;
  level: OnchainRiskLevel;
  label: string;
  uri?: string;
};

type AnalysisResult = {
  input?: unknown;
  actions: AnalysisAction[];
  risks: AnalysisRisk[];
  privacy: AnalysisPrivacy[];
  developerHints: DeveloperHint[];
  onchainRisk?: OnchainRiskSignal | null;
  aiSummary: string;
  explanation: Explanation;
};

export default function DevPlaygroundPage() {
  const [rawInput, setRawInput] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawInput }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze transaction.");
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error during analysis.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const prettyResult = result ? JSON.stringify(result, null, 2) : "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-6xl flex-col gap-8 py-16 px-6 sm:px-10 lg:px-16 bg-white dark:bg-black">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Developer Playground
            </h1>
            <a
              href="/"
              className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Back to main assistant
            </a>
          </div>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Paste raw calldata or a JSON representation of a transaction on the
            left. The assistant will call the same analysis engine used by the
            main user view and show the user-facing explanation, developer
            notes, on-chain risk signal and the full structured JSON result for
            debugging and integration.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleAnalyze} className="flex flex-col gap-3">
            <label
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
              htmlFor="dev-raw-input"
            >
              Raw transaction input
            </label>
            <textarea
              id="dev-raw-input"
              className="min-h-[260px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs sm:text-sm font-mono text-zinc-900 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !rawInput.trim()}
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-zinc-400 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}
          </form>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                User-facing explanation ("Endless explains")
              </h2>
              {result ? (
                <div className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {result.explanation.userHeadline}
                  </p>
                  <p>{result.explanation.userBody}</p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Run an analysis to see what the main wallet view will tell an
                  end user.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                On-chain Endless Risk Signal
              </h2>
              {result && result.onchainRisk ? (
                <div className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="font-semibold">Contract:</span>{" "}
                    {result.onchainRisk.contract}
                  </div>
                  <div>
                    <span className="font-semibold">Level:</span>{" "}
                    {result.onchainRisk.level}
                  </div>
                  {result.onchainRisk.label && (
                    <div>
                      <span className="font-semibold">Label:</span>{" "}
                      {result.onchainRisk.label}
                    </div>
                  )}
                  {result.onchainRisk.uri && (
                    <div>
                      <span className="font-semibold">Details:</span>{" "}
                      <a
                        href={result.onchainRisk.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-600 underline dark:text-sky-400"
                      >
                        {result.onchainRisk.uri}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  If the target contract is known and tagged in the Endless Risk
                  Registry on Sepolia, the on-chain risk signal will appear
                  here.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Developer hints
              </h2>
              {result &&
              result.developerHints &&
              result.developerHints.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {result.developerHints.map((hint, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-black/5 px-2 py-1 text-xs sm:text-sm dark:bg-white/5"
                    >
                      <span className="font-semibold">{hint.type}:</span>{" "}
                      {hint.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  Run an analysis to see implementation and UX recommendations
                  for Endless builders here.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Structured analysis (JSON)
              </h2>
              <pre className="mt-2 max-h-[320px] overflow-auto rounded-md bg-black/90 p-3 text-[11px] leading-relaxed text-zinc-100">
                {prettyResult ||
                  "{/* The full structured result will appear here after running an analysis. */}"}
              </pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
