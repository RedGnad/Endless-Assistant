import { NextRequest, NextResponse } from "next/server";
import { analyzeRawInput } from "@/lib/transactionAnalysis";
import { generateExplanation } from "@/lib/aiExplanation";
import { fetchOnchainRisk } from "@/lib/onchainRisk";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const raw =
    body && typeof body === "object" && "raw" in body && typeof (body as any).raw === "string"
      ? (body as any).raw
      : "";

  const analysis = analyzeRawInput(raw);
  const onchainRisk = await fetchOnchainRisk(analysis.targetContract);
  try {
    const explanation = await generateExplanation(raw, analysis);

    console.log("[api/analyze-tx] Explanation source", explanation.source);

    return NextResponse.json({
      input: raw,
      actions: analysis.actions,
      risks: analysis.risks,
      privacy: analysis.privacy,
      developerHints: analysis.developerHints,
      onchainRisk,
      explanation,
      // Compatibilité avec le front existant : champ string simple basé sur l’explication structurée.
      aiSummary: explanation.userBody,
    });
  } catch (err) {
    console.error("[api/analyze-tx] Failed to generate AI explanation", err);
    return NextResponse.json(
      { error: "Failed to generate AI explanation. Check server logs." },
      { status: 500 },
    );
  }
}
