"use client";

type RiskLevel = "low" | "medium" | "high";

type BaseAction = {
  type: string;
  description: string;
  severity?: string;
};

type BaseRisk = {
  type: string;
  level: RiskLevel | string;
  description: string;
};

type BasePrivacy = {
  type: string;
  description: string;
};

type AnalysisResult = {
  input?: unknown;
  actions: BaseAction[];
  risks: BaseRisk[];
  privacy: BasePrivacy[];
  aiSummary: string;
};

type WalletConfirmationPreviewProps = {
  result: AnalysisResult;
};

function getRiskVisualState(risks: BaseRisk[]) {
  if (!risks || risks.length === 0) {
    return {
      label: "Low risk",
      badgeClass:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
      barClass: "bg-emerald-500",
      barWidthClass: "w-11/12",
    };
  }

  const levels = risks
    .map((risk) => String(risk.level).toLowerCase())
    .filter(Boolean);

  if (levels.includes("high")) {
    return {
      label: "High risk",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
      barClass: "bg-red-500",
      barWidthClass: "w-1/3",
    };
  }

  if (levels.includes("medium")) {
    return {
      label: "Medium risk",
      badgeClass:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
      barClass: "bg-amber-500",
      barWidthClass: "w-2/3",
    };
  }

  return {
    label: "Low risk",
    badgeClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    barClass: "bg-emerald-500",
    barWidthClass: "w-11/12",
  };
}

export function WalletConfirmationPreview({
  result,
}: WalletConfirmationPreviewProps) {
  const { label, badgeClass, barClass, barWidthClass } = getRiskVisualState(
    result.risks
  );

  const primaryAction = result.actions[0];

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs text-zinc-900 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-50">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-[10px] font-bold text-white">
            EW
          </div>
          <div className="flex flex-col leading-tight">
            <span>Endless Wallet</span>
            <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-500">
              Transaction review
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}
        >
          {label}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            You are about to
          </div>
          {primaryAction ? (
            <div className="rounded-lg bg-white px-3 py-2 text-[11px] shadow-sm dark:bg-zinc-900">
              <span className="font-semibold">{primaryAction.type}</span>
              <span className="mx-1 text-zinc-400">·</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {primaryAction.description}
              </span>
            </div>
          ) : (
            <div className="rounded-lg bg-white px-3 py-2 text-[11px] text-zinc-500 shadow-sm dark:bg-zinc-900 dark:text-zinc-400">
              No specific action could be decoded from this input.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            AI assistant note
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-zinc-700 shadow-inner dark:bg-zinc-900 dark:text-zinc-300">
            {result.aiSummary}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>Security &amp; privacy score</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${barClass} ${barWidthClass}`}
            />
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-800 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Reject
          </button>
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
