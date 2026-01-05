import { Contract, JsonRpcProvider } from "ethers";

export type OnchainRiskLevel = "unknown" | "low" | "medium" | "high";

export type OnchainRiskSignal = {
  source: "onchainRegistry";
  contract: string;
  level: OnchainRiskLevel;
  label: string;
  uri?: string;
};

const RISK_REGISTRY_ABI = [
  "function getRisk(address target) view returns (tuple(uint8 level, string label, string uri))",
];

function mapLevel(rawLevel: number | bigint): OnchainRiskLevel {
  const n = typeof rawLevel === "bigint" ? Number(rawLevel) : rawLevel;
  if (n === 1) return "low";
  if (n === 2) return "medium";
  if (n === 3) return "high";
  return "unknown";
}

export async function fetchOnchainRisk(
  targetContract: string | null | undefined,
): Promise<OnchainRiskSignal | null> {
  if (!targetContract) return null;

  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const registryAddress = process.env.RISK_REGISTRY_ADDRESS;

  if (!rpcUrl || !registryAddress) {
    return null;
  }

  if (!targetContract.startsWith("0x") || targetContract.length !== 42) {
    return null;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(registryAddress, RISK_REGISTRY_ABI, provider);

    const risk = await contract.getRisk(targetContract);

    const levelValue = (risk as any).level ?? (Array.isArray(risk) ? risk[0] : 0);
    const labelValue = (risk as any).label ?? (Array.isArray(risk) ? risk[1] : "");
    const uriValue = (risk as any).uri ?? (Array.isArray(risk) ? risk[2] : "");

    const level = mapLevel(levelValue);

    if (level === "unknown" && !labelValue && !uriValue) {
      return null;
    }

    return {
      source: "onchainRegistry",
      contract: targetContract,
      level,
      label: String(labelValue ?? ""),
      uri: uriValue ? String(uriValue) : undefined,
    };
  } catch {
    return null;
  }
}
