import type { TransactionAnalysis } from "@/lib/transactionAnalysis";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export type ExplanationViewModel = {
  userHeadline: string;
  userBody: string;
  userPrivacyNote: string;
  devNotes: string;
};

export type ExplanationSource = "openai" | "rule-based";

export type ExplanationWithSource = ExplanationViewModel & {
  source: ExplanationSource;
};

function buildRuleBasedSummary(raw: string, analysis: TransactionAnalysis): string {
  if (!raw.trim()) {
    return "No input was provided. To analyze a transaction, please paste calldata or a JSON object containing a `data` field.";
  }

  const parts: string[] = [];

  if (analysis.actions.length === 0) {
    parts.push(
      "No specific ERC-20 function (transfer, approve, transferFrom) could be decoded from this input. It may be a different contract interface or malformed calldata.",
    );
  } else {
    const actionSummaries = analysis.actions.map((action) => action.description).join(" ");
    parts.push(`Detected ERC-20-related activity: ${actionSummaries}`);
  }

  if (analysis.risks.length > 0) {
    const riskSummaries = analysis.risks
      .map((risk) => `${risk.type} (level: ${risk.level}) – ${risk.description}`)
      .join(" ");
    parts.push(`Risk assessment: ${riskSummaries}`);
  }

  const privacyNote = analysis.privacy
    .map((item) => `${item.type}: ${item.description}`)
    .join(" ");

  parts.push(`Privacy note: ${privacyNote}`);

  return parts.join(" ");
}

function buildRuleBasedExplanation(
  raw: string,
  analysis: TransactionAnalysis,
): ExplanationWithSource {
  const summary = buildRuleBasedSummary(raw, analysis);

  // Découper grossièrement en titre + corps en se basant sur le premier point.
  const [firstSentence, ...rest] = summary.split(/(?<=[.!?])\s+/);
  const userHeadline = firstSentence?.trim() || "Transaction summary";
  const userBody = rest.join(" ").trim() || summary;

  const privacyNote = analysis.privacy
    .map((item) => `${item.type}: ${item.description}`)
    .join(" ")
    .trim();

  return {
    userHeadline,
    userBody,
    userPrivacyNote:
      privacyNote ||
      "This transaction will be recorded on-chain. Anyone can see the addresses involved, amounts, and function called.",
    devNotes: summary,
    source: "rule-based",
  };
}

export async function generateExplanation(
  raw: string,
  analysis: TransactionAnalysis,
): Promise<ExplanationWithSource> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error(
      "[aiExplanation] Missing OPENAI_API_KEY – strict mode, refusing to fallback.",
    );
    throw new Error("Missing OPENAI_API_KEY for AI explanation.");
  }

  const systemPrompt =
    "You are an assistant that explains Web3 transactions for end users and developers. " +
    "Respond ONLY with minified JSON, no markdown, following this TypeScript type strictly: " +
    "{ userHeadline: string; userBody: string; userPrivacyNote: string; devNotes: string }. " +
    "userHeadline: one short sentence summary for beginners. userBody: 2-4 short sentences explaining what will happen and key risks. " +
    "userPrivacyNote: 1 short sentence about privacy implications. devNotes: a longer paragraph for developers and advanced users.";

  const userDescription = {
    rawInput: raw,
    actions: analysis.actions,
    risks: analysis.risks,
    privacy: analysis.privacy,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Explain the following transaction analysis to an end user. " +
              "Input is a JSON object with raw calldata and a decoded analysis. " +
              "Focus on what will happen, the main risks and privacy implications.\n\n" +
              JSON.stringify(userDescription, null, 2),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        "[aiExplanation] OpenAI HTTP error",
        response.status,
        errorText,
      );
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.error(
        "[aiExplanation] Invalid OpenAI response, missing content",
        JSON.stringify(data),
      );
      throw new Error("Invalid OpenAI response content.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error(
        "[aiExplanation] Failed to parse OpenAI JSON content",
        err,
        content,
      );
      throw new Error("Failed to parse OpenAI explanation JSON.");
    }

    const obj = parsed as Partial<{
      userHeadline: string;
      userBody: string;
      userPrivacyNote: string;
      devNotes: string;
    }>;

    if (
      !obj ||
      typeof obj !== "object" ||
      typeof obj.userHeadline !== "string" ||
      typeof obj.userBody !== "string" ||
      typeof obj.userPrivacyNote !== "string" ||
      typeof obj.devNotes !== "string"
    ) {
      console.error(
        "[aiExplanation] OpenAI JSON missing required fields",
        obj,
      );
      throw new Error("OpenAI explanation JSON missing required fields.");
    }

    const explanation: ExplanationWithSource = {
      userHeadline: obj.userHeadline.trim(),
      userBody: obj.userBody.trim(),
      userPrivacyNote: obj.userPrivacyNote.trim(),
      devNotes: obj.devNotes.trim(),
      source: "openai",
    };

    console.log(
      "[aiExplanation] Generated explanation via OpenAI",
      explanation.userHeadline,
    );

    return explanation;
  } catch (err) {
    console.error("[aiExplanation] Unexpected error in generateExplanation", err);
    throw err instanceof Error
      ? err
      : new Error("Unknown AI explanation error");
  }
}

// Compatibilité avec l’existant : générer encore un simple string si besoin.
export async function generateAiSummary(
  raw: string,
  analysis: TransactionAnalysis,
): Promise<string> {
  const explanation = await generateExplanation(raw, analysis);
  return explanation.userBody;
}
