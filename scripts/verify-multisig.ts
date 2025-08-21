// scripts/verify-dao.ts
import { run } from "hardhat";

async function main() {
  await run("verify:verify", {
    address: "0x785003257d808B76702c5072AAAd6Bd432D64a23",
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
