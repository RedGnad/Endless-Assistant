import { Interface, MaxUint256, formatUnits } from "ethers";

export type RiskLevel = "low" | "medium" | "high";

export type DecodedAction = {
  type: string;
  description: string;
  severity?: string;
};

export type Risk = {
  type: string;
  level: RiskLevel;
  description: string;
};

export type PrivacyItem = {
  type: string;
  description: string;
};

export type DeveloperHint = {
  type: string;
  description: string;
};

export type TransactionAnalysis = {
  actions: DecodedAction[];
  risks: Risk[];
  privacy: PrivacyItem[];
  developerHints: DeveloperHint[];
  targetContract?: string | null;
};

const erc20Interface = new Interface([
  "function transfer(address to, uint256 value)",
  "function approve(address spender, uint256 value)",
  "function transferFrom(address from, address to, uint256 value)",
]);

function isUnlimitedApproval(value: bigint): boolean {
  try {
    return value === MaxUint256;
  } catch {
    return false;
  }
}

const DEFAULT_ERC20_DECIMALS = 18;

function formatTokenAmount(value: bigint): string {
  try {
    const raw = formatUnits(value, DEFAULT_ERC20_DECIMALS);
    // Supprimer les zéros inutiles en fin de chaîne (ex: "1.000000" -> "1")
    if (raw.includes(".")) {
      return raw.replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1");
    }
    return raw;
  } catch {
    return value.toString();
  }
}

export function analyzeRawInput(raw: string): TransactionAnalysis {
  const actions: DecodedAction[] = [];
  const risks: Risk[] = [];
  const privacy: PrivacyItem[] = [];
  const developerHints: DeveloperHint[] = [];

  const trimmed = raw.trim();

  let dataHex: string | null = null;
  let targetContract: string | null = null;

  // Option 1: JSON with a `data` field
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.data === "string") {
        dataHex = parsed.data;
      }

      // Optionally capture a `to` field if present (common JSON tx shape)
      if (typeof parsed.to === "string") {
        targetContract = parsed.to;
      }
    } catch {
      // ignore JSON parse errors, we will try hex next
    }
  }

  // Option 2: direct hex calldata
  if (!dataHex && trimmed.startsWith("0x")) {
    dataHex = trimmed;
  }

  if (dataHex) {
    try {
      const parsedTx = erc20Interface.parseTransaction({ data: dataHex, value: 0n });

      if (parsedTx && parsedTx.name === "transfer") {
        const [to, value] = parsedTx.args as unknown as [string, bigint];
        const amountReadable = formatTokenAmount(value);
        actions.push({
          type: "erc20.transfer",
          description: `Transfer of ${amountReadable} tokens to ${to}.`,
          severity: "info",
        });
      } else if (parsedTx && parsedTx.name === "approve") {
        const [spender, value] = parsedTx.args as unknown as [string, bigint];
        const unlimited = isUnlimitedApproval(value);
        const amountReadable = unlimited
          ? "an unlimited amount of"
          : `${formatTokenAmount(value)}`;

        actions.push({
          type: "erc20.approve",
          description: unlimited
            ? `Approve ${spender} to spend an unlimited amount of tokens.`
            : `Approve ${spender} to spend up to ${amountReadable} tokens.`,
          severity: "info",
        });

        if (unlimited) {
          risks.push({
            type: "unlimitedApproval",
            level: "high",
            description:
              "This approval appears to be unlimited (MaxUint256). This is often risky and should only be granted to highly trusted contracts.",
          });
        }
      } else if (parsedTx && parsedTx.name === "transferFrom") {
        const [from, to, value] = parsedTx.args as unknown as [
          string,
          string,
          bigint,
        ];
        const amountReadable = formatTokenAmount(value);
        actions.push({
          type: "erc20.transferFrom",
          description: `Transfer of ${amountReadable} tokens from ${from} to ${to}.`,
          severity: "info",
        });
      }
    } catch {
      // If parsing fails, we simply do not add any ERC20-specific actions.
    }
  }

  // Basic privacy note: even if we cannot fully decode, on-chain data is public.
  privacy.push({
    type: "onchainVisibility",
    description:
      "Transaction details such as addresses, token amounts, and called functions are publicly visible on-chain.",
  });

  // Developer-focused hints derived from the detected activity and risks.
  if (risks.some((risk) => risk.type === "unlimitedApproval")) {
    developerHints.push({
      type: "erc20.unlimitedApprovalPattern",
      description:
        "Avoid relying on unlimited ERC-20 approvals. Prefer allowances scoped to realistic amounts and reset approvals to 0 before changing spenders.",
    });
  }

  if (actions.some((action) => action.type === "erc20.approve")) {
    developerHints.push({
      type: "erc20.approvalUX",
      description:
        "In your dApp and wallet UI, clearly explain to users what an approval does, highlight who the spender is, and surface the potential impact of granting it.",
    });
  }

  if (actions.length === 0 && dataHex) {
    developerHints.push({
      type: "abiCoverage",
      description:
        "This calldata could not be decoded with the standard ERC-20 ABI. Provide the contract ABI or implement custom decoding so users see a clear description.",
    });
  }

  developerHints.push({
    type: "privacyDisclosure",
    description:
      "Consider showing users which parts of this transaction will be publicly visible on-chain (addresses, token amounts, called functions) and link to an explorer for transparency.",
  });

  return { actions, risks, privacy, developerHints, targetContract };
}
