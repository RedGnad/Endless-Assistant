"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  SAMPLE_ERC20_TRANSFER,
  SAMPLE_ERC20_APPROVE_UNLIMITED,
} from "@/lib/sampleInputs";
import { WalletConfirmationPreview } from "@/components/WalletConfirmationPreview";

const NessyAvatar = dynamic(() => import("@/components/NessyAvatar"), {
  ssr: false,
});

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
  aiSummary: string;
  explanation: Explanation;
  onchainRisk?: OnchainRiskSignal | null;
};

type NessyMood = "safe" | "cautious" | "danger";

type NessySignal = {
  mood: NessyMood;
  message: string;
};

function normalizeRiskLevel(level: AnalysisRisk["level"]): RiskLevel {
  const value = String(level).toLowerCase();
  if (
    value.includes("high") ||
    value.includes("severe") ||
    value.includes("critical")
  ) {
    return "high";
  }
  if (value.includes("medium") || value.includes("moderate")) {
    return "medium";
  }
  return "low";
}

function formatOnchainRiskLevel(level: OnchainRiskLevel): string {
  switch (level) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "Unknown";
  }
}

function getGlobalRiskLevel(result: AnalysisResult | null): RiskLevel {
  let current: RiskLevel = "low";

  if (result) {
    if (result.risks && result.risks.length > 0) {
      for (const risk of result.risks) {
        const lvl = normalizeRiskLevel(risk.level);
        if (lvl === "high") {
          return "high";
        }
        if (lvl === "medium" && current === "low") {
          current = "medium";
        }
      }
    }

    if (result.onchainRisk) {
      const level = result.onchainRisk.level;
      const mapped: RiskLevel =
        level === "high"
          ? "high"
          : level === "medium"
          ? "medium"
          : level === "low"
          ? "low"
          : "low";

      if (mapped === "high") {
        return "high";
      }
      if (mapped === "medium" && current === "low") {
        current = "medium";
      }
    }
  }

  return current;
}

function getNessySignal(result: AnalysisResult | null): NessySignal | null {
  if (!result) return null;
  const level = getGlobalRiskLevel(result);

  if (level === "high") {
    return {
      mood: "danger",
      message:
        "Warning: this transaction could grant broad or long-term control over your tokens. Only continue if you fully trust this app.",
    };
  }

  if (level === "medium") {
    return {
      mood: "cautious",
      message:
        "Some sensitive permissions are involved. Double-check who you’re approving and the amounts before signing.",
    };
  }

  return {
    mood: "safe",
    message:
      "This looks like a standard transaction with no critical new permissions detected.",
  };
}

type StarConfig = {
  top: string;
  left: string;
  variants?: string[];
};

const STAR_POSITIONS: StarConfig[] = [
  // Top band
  { top: "5%", left: "12%", variants: ["small", "dim", "slow"] },
  { top: "9%", left: "32%", variants: ["small", "fast"] },
  { top: "7%", left: "61%", variants: ["dim"] },
  { top: "11%", left: "82%", variants: ["small", "slow"] },

  // Upper mid
  { top: "20%", left: "8%", variants: ["small", "slow"] },
  { top: "23%", left: "27%", variants: ["dim"] },
  { top: "19%", left: "47%", variants: ["small"] },
  { top: "26%", left: "68%", variants: ["fast"] },
  { top: "22%", left: "90%", variants: ["small", "dim"] },

  // Center band
  { top: "38%", left: "6%", variants: ["dim"] },
  { top: "35%", left: "36%", variants: ["small", "slow"] },
  { top: "41%", left: "58%", variants: ["small"] },
  { top: "37%", left: "80%", variants: ["small", "fast"] },

  // Lower mid
  { top: "57%", left: "14%", variants: ["small", "dim"] },
  { top: "54%", left: "30%", variants: ["small", "fast"] },
  { top: "60%", left: "52%", variants: ["dim", "slow"] },
  { top: "56%", left: "72%", variants: ["small"] },
  { top: "62%", left: "90%", variants: ["fast"] },

  // Bottom band
  { top: "78%", left: "10%", variants: ["small", "slow"] },
  { top: "82%", left: "38%", variants: ["dim"] },
  { top: "86%", left: "63%", variants: ["small", "fast"] },
  { top: "80%", left: "84%", variants: ["small", "dim"] },
];

export default function Home() {
  const [rawInput, setRawInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  function useExample(value: string) {
    setRawInput(value);
    setError(null);
    setResult(null);
  }

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();

    if (!rawInput.trim()) {
      return;
    }

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

  const nessySignal = getNessySignal(result);
  const globalRiskLevel = getGlobalRiskLevel(result);

  return (
    <div className="relative flex min-h-screen items-center justify-center font-sans">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {STAR_POSITIONS.map((star, index) => (
          <div
            key={index}
            className={[
              "star",
              ...(star.variants ?? []).map((v) => `star--${v}`),
            ].join(" ")}
            style={{ top: star.top, left: star.left }}
          />
        ))}
      </div>
      <main className="flex min-h-screen w-full max-w-4xl flex-col gap-8 py-16 px-6 sm:px-10 lg:px-16 rounded-3xl border border-zinc-200/60 bg-white shadow-lg shadow-black/10 dark:border-zinc-800/80 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-black dark:to-zinc-950">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Endless AI Transaction &amp; Privacy Assistant (Nessy Guardian)
            </h1>
            <a
              href="/dev-playground"
              className="hidden rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:inline-flex"
            >
              Developer playground
            </a>
          </div>
          <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            This prototype simulates what Endless Wallet could show you just
            before you sign a transaction. Use the examples or paste a
            transaction payload below. The assistant sends it to the
            <code className="mx-1 rounded bg-zinc-100 px-1 py-0.5 text-xs">
              /api/analyze-tx
            </code>
            endpoint, decodes basic ERC-20 activity, evaluates approval risks
            and privacy implications, and generates a concise explanation using
            rule-based logic and, when configured, an OpenAI model (or any
            custom model when available).
          </p>
        </header>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] items-start">
          <section className="flex flex-col gap-4">
            <form onSubmit={handleAnalyze} className="flex flex-col gap-3">
              <label
                className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                htmlFor="raw-input"
              >
                What are you about to sign?
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => useExample(SAMPLE_ERC20_TRANSFER)}
                  className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Example: ERC-20 transfer
                </button>
                <button
                  type="button"
                  onClick={() => useExample(SAMPLE_ERC20_APPROVE_UNLIMITED)}
                  className="rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Example: Unlimited approval
                </button>
              </div>
              <textarea
                id="raw-input"
                className="min-h-[140px] w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-mono text-zinc-900 shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                placeholder="Paste the transaction payload here (calldata or a JSON object)."
                value={rawInput}
                onChange={(event) => setRawInput(event.target.value)}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !rawInput.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-zinc-400 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  This is a prototype. Do not paste any private keys or
                  sensitive off-chain data.
                </p>
              </div>
            </form>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {error}
              </div>
            )}

            {result && (
              <>
                <div className="mt-4 grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Endless explains
                      </h2>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          globalRiskLevel === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            : globalRiskLevel === "medium"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                        }`}
                      >
                        {globalRiskLevel === "high"
                          ? "High risk"
                          : globalRiskLevel === "medium"
                          ? "Medium risk"
                          : "Low risk"}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">
                      {result.explanation.userHeadline}
                    </p>
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {result.explanation.userBody}
                    </p>
                    <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {result.explanation.userPrivacyNote}
                    </p>
                    {result.onchainRisk &&
                      result.onchainRisk.level !== "unknown" && (
                        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                          On-chain Endless Risk Registry:{" "}
                          {formatOnchainRiskLevel(result.onchainRisk.level)}{" "}
                          risk
                          {result.onchainRisk.label
                            ? ` · ${result.onchainRisk.label}`
                            : ""}
                        </p>
                      )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Actions
                      </h3>
                      <ul className="mt-1 space-y-1">
                        {result.actions.map((action, index) => (
                          <li
                            key={index}
                            className="rounded-md bg-white px-2 py-1 text-xs shadow-sm dark:bg-zinc-900"
                          >
                            <span className="font-semibold">
                              {action.type}:
                            </span>{" "}
                            {action.description}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Risks
                      </h3>
                      <ul className="mt-1 space-y-1">
                        {result.risks.map((risk, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-md bg-white px-2 py-1 text-xs shadow-sm dark:bg-zinc-900"
                          >
                            <span className="mt-0.5 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:bg-red-900 dark:text-red-200">
                              {typeof risk.level === "string"
                                ? risk.level
                                : String(risk.level)}
                            </span>
                            <span>
                              <span className="font-semibold">
                                {risk.type}:
                              </span>{" "}
                              {risk.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Privacy
                      </h3>
                      <ul className="mt-1 space-y-1">
                        {result.privacy.map((item, index) => (
                          <li
                            key={index}
                            className="rounded-md bg-white px-2 py-1 text-xs shadow-sm dark:bg-zinc-900"
                          >
                            <span className="font-semibold">{item.type}:</span>{" "}
                            {item.description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <WalletConfirmationPreview
                    result={result as AnalysisResult}
                  />
                </div>
              </>
            )}
          </section>

          <aside className="mt-6 lg:mt-0 lg:sticky lg:top-20">
            <div className="relative h-64 sm:h-72">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.7),_transparent_65%)]" />
              <NessyAvatar />
              {loading ? (
                <div className="pointer-events-none absolute -left-2 top-2 w-52 rounded-2xl bg-white/90 p-2 text-xs text-zinc-900 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900/90 dark:text-zinc-50 dark:ring-zinc-700">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <span>Nessy is thinking</span>
                    <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent dark:border-zinc-500 dark:border-t-transparent" />
                  </div>
                  <p className="leading-snug text-xs text-zinc-900 dark:text-zinc-50">
                    Analyzing this transaction for you...
                  </p>
                </div>
              ) : (
                nessySignal && (
                  <div className="pointer-events-none absolute -left-2 top-2 w-48 rounded-2xl bg-white/90 p-2 text-xs text-zinc-900 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900/90 dark:text-zinc-50 dark:ring-zinc-700">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Nessy says
                    </div>
                    <p className="leading-snug">{nessySignal.message}</p>
                  </div>
                )
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
