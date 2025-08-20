// scripts/verify-all.ts
import { run } from "hardhat";

async function main() {
  // Verify GasOptimizer
  await run("verify:verify", {
    address: "0xEd85aC04944CAC0bBB8488658Bb32264814FDb34",
    contract: "contracts/GasOptimizer.sol:GasOptimizer",
    constructorArguments: [],
  });

  // Verify DAOMultiSigWallet
  await run("verify:verify", {
    address: "0xffB3fB252fb7D97a467Cbc85a977581044bdB0a1",
    contract: "contracts/DAOMultiSigWallet.sol:DAOMultiSigWallet",
    constructorArguments: [
      [
        "0x965D76AB62767C2246c96D741c57f202E8d40000",
        "0xDD593Be711edE50b1624289DD1eED67bF84Eb51d",
        "0x7131ddDbC0CE76E61Fce593c53CEdA99621a531D",
      ],
      2,
      "DAO MultiSig Wallet",
      "1.0.0",
    ],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
