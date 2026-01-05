const hre = require("hardhat");

async function main() {
  const RiskTagRegistry = await hre.ethers.getContractFactory("RiskTagRegistry");
  const registry = await RiskTagRegistry.deploy();

  await registry.waitForDeployment();

  console.log("RiskTagRegistry deployed to:", await registry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
