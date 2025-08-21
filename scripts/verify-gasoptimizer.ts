// scripts/verify-gasoptimizer.ts
import { run } from "hardhat";

async function main() {
  await run("verify:verify", {
    address: "0xB3aE9e5d6409Dd4C41370dcB5290f303cE312588", // ganti dengan alamat GasOptimizer di Sepolia
    contract: "contracts/GasOptimizer.sol:GasOptimizer",
    constructorArguments: [],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

