// scripts/verify-gasoptimizer.ts
import { run } from "hardhat";

async function main() {
  await run("verify:verify", {
    address: "0xEd85aC04944CAC0bBB8488658Bb32264814FDb34", // ganti dengan alamat GasOptimizer di Sepolia
    contract: "contracts/GasOptimizer.sol:GasOptimizer",
    constructorArguments: [],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

