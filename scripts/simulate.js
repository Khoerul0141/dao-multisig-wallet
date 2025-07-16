// FILE scripts/simulate.js
const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Starting simulation...");
    
    // Get signers
    const [signer1, signer2, signer3, recipient] = await ethers.getSigners();
    
    console.log("Signer 1:", signer1.address);
    console.log("Signer 2:", signer2.address);
    console.log("Signer 3:", signer3.address);
    console.log("Recipient:", recipient.address);
    
    // Deploy contract
    console.log("\n📦 Deploying contract...");
    const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
    
    const wallet = await DAOMultiSigWallet.deploy(
        [signer1.address, signer2.address, signer3.address],
        2, // 2 out of 3 signatures required
        "DAO MultiSig Wallet",
        "1.0.0"
    );
    
    await wallet.waitForDeployment();
    const walletAddress = await wallet.getAddress();
    console.log("✅ Contract deployed to:", walletAddress);
    
    // Fund the wallet
    console.log("\n💰 Funding the wallet...");
    await signer1.sendTransaction({
        to: walletAddress,
        value: ethers.parseEther("10.0")
    });
    
    const balance = await ethers.provider.getBalance(walletAddress);
    console.log("Wallet balance:", ethers.formatEther(balance), "ETH");
    
    // Simulate transaction workflow
    console.log("\n🔄 Simulating transaction workflow...");
    
    // Step 1: Submit transaction
    console.log("1. Submitting transaction...");
    const txData = "0x"; // Empty data for ETH transfer
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
    
    const submitTx = await wallet.connect(signer1).submitTransaction(
        recipient.address,
        ethers.parseEther("1.0"),
        txData,
        deadline
    );
    
    await submitTx.wait();
    console.log("✅ Transaction submitted with ID: 0");
    
    // Step 2: Vote on transaction
    console.log("2. Voting on transaction...");
    
    // Signer 1 votes yes
    const vote1Tx = await wallet.connect(signer1).voteOnTransaction(0, true);
    await vote1Tx.wait();
    console.log("✅ Signer 1 voted YES");
    
    // Signer 2 votes yes (this should trigger auto-execution)
    const vote2Tx = await wallet.connect(signer2).voteOnTransaction(0, true);
    const receipt = await vote2Tx.wait();
    console.log("✅ Signer 2 voted YES");
    
    // Check if transaction was executed
    const tx = await wallet.getTransaction(0);
    console.log("Transaction executed:", tx.executed);
    
    // Check recipient balance
    const recipientBalance = await ethers.provider.getBalance(recipient.address);
    console.log("Recipient balance:", ethers.formatEther(recipientBalance), "ETH");
    
    // Step 3: Test gas optimization with batch execution
    console.log("\n⚡ Testing batch execution...");
    
    // Submit multiple transactions
    for (let i = 0; i < 3; i++) {
        await wallet.connect(signer1).submitTransaction(
            recipient.address,
            ethers.parseEther("0.1"),
            txData,
            deadline
        );
    }
    
    // Vote on all transactions
    for (let i = 1; i <= 3; i++) {
        await wallet.connect(signer1).voteOnTransaction(i, true);
        await wallet.connect(signer2).voteOnTransaction(i, true);
    }
    
    console.log("✅ Multiple transactions submitted and voted");
    
    // Step 4: Test signer management
    console.log("\n👥 Testing signer management...");
    
    const newSigner = ethers.Wallet.createRandom();
    console.log("New signer address:", newSigner.address);
    
    // Submit transaction to add new signer
    const addSignerData = wallet.interface.encodeFunctionData("addSigner", [newSigner.address]);
    
    await wallet.connect(signer1).submitTransaction(
        walletAddress,
        0,
        addSignerData,
        deadline
    );
    
    // Vote on adding new signer
    await wallet.connect(signer1).voteOnTransaction(4, true);
    await wallet.connect(signer2).voteOnTransaction(4, true);
    
    console.log("✅ New signer management transaction completed");
    
    // Step 5: Display final statistics
    console.log("\n📊 Final Statistics:");
    const finalBalance = await ethers.provider.getBalance(walletAddress);
    console.log("Final wallet balance:", ethers.formatEther(finalBalance), "ETH");
    
    const signers = await wallet.getSigners();
    console.log("Total signers:", signers.length);
    
    const requiredSigs = await wallet.requiredSignatures();
    console.log("Required signatures:", requiredSigs.toString());
    
    const txCount = await wallet.transactionCount();
    console.log("Total transactions:", txCount.toString());
    
    console.log("\n🎉 Simulation completed successfully!");
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Simulation failed:", error);
        process.exit(1);
    });