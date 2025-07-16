// FILE scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🚀 Starting deployment...");
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    
    // Check balance
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Configuration for multisig wallet
    const config = {
        name: "DAO MultiSig Wallet",
        version: "1.0.0",
        signers: [
            deployer.address,
            "0x2546BcD3c84621e976D8185a91A922aE77ECEc30", // Example address
            "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", // Example address
        ],
        requiredSignatures: 2, // 2 out of 3 signatures required
    };
    
    console.log("📋 Configuration:");
    console.log("- Name:", config.name);
    console.log("- Version:", config.version);
    console.log("- Signers:", config.signers.length);
    console.log("- Required Signatures:", config.requiredSignatures);
    
    try {
        // Deploy the contract
        console.log("\n📦 Deploying DAOMultiSigWallet...");
        const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
        
        const wallet = await DAOMultiSigWallet.deploy(
            config.signers,
            config.requiredSignatures,
            config.name,
            config.version
        );
        
        await wallet.waitForDeployment();
        const walletAddress = await wallet.getAddress();
        
        console.log("✅ DAOMultiSigWallet deployed to:", walletAddress);
        
        // Save deployment information
        const deploymentInfo = {
            contractAddress: walletAddress,
            deployer: deployer.address,
            network: await ethers.provider.getNetwork(),
            timestamp: new Date().toISOString(),
            config: config,
            transactionHash: wallet.deploymentTransaction().hash
        };
        
        // Create deployments directory if it doesn't exist
        if (!fs.existsSync("./deployments")) {
            fs.mkdirSync("./deployments");
        }
        
        // Save deployment info to file
        fs.writeFileSync(
            "./deployments/deployment.json",
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log("📄 Deployment info saved to ./deployments/deployment.json");
        
        // Verify contract on Etherscan (if not on localhost)
        if (network.name !== "hardhat" && network.name !== "localhost") {
            console.log("\n🔍 Verifying contract on Etherscan...");
            await run("verify:verify", {
                address: walletAddress,
                constructorArguments: [
                    config.signers,
                    config.requiredSignatures,
                    config.name,
                    config.version
                ],
            });
        }
        
        console.log("\n🎉 Deployment completed successfully!");
        console.log("Contract Address:", walletAddress);
        
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });