import { ethers } from "hardhat";
import { Contract, ContractTransactionResponse } from "ethers";
import * as fs from "fs";
import * as path from "path";
import type { DAOMultiSigWallet, GasOptimizer } from "../typechain-types";

interface DeploymentOptions {
  gasLimit?: number;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

interface LibraryDependencies {
  needsLinking: boolean;
  placeholders: string[];
}

interface DeploymentResult {
  network: string;
  gasOptimizer: string;
  daoWallet: string;
  initialSigners: string[];
  requiredSignatures: number;
  deploymentMethod: string;
  libraryLinking: boolean;
}

interface DeploymentInfo {
  network: string;
  chainId?: number;
  deployedAt: string;
  deployer: string;
  deploymentMethod: string;
  libraryLinking: boolean;
  contracts: {
    GasOptimizer: {
      address: string;
      txHash?: string;
    };
    DAOMultiSigWallet: {
      address: string;
      txHash?: string;
      initialSigners: string[];
      requiredSignatures: number;
      walletName: string;
      walletVersion: string;
    };
  };
  gasUsage?: {
    gasOptimizer?: string;
    daoWallet?: string;
  };
}

/**
 * Detect if contract needs library linking by checking bytecode
 */
async function detectLibraryDependencies(contractName: string): Promise<LibraryDependencies> {
  try {
    const contractArtifact = await ethers.artifacts.readArtifact(contractName);
    const libraryPlaceholders = contractArtifact.bytecode.match(/__\$[a-f0-9]{34}\$__/g) || [];
    
    return {
      needsLinking: libraryPlaceholders.length > 0,
      placeholders: libraryPlaceholders
    };
  } catch (error: any) {
    console.log("⚠️ Could not detect library dependencies:", error.message);
    return { needsLinking: false, placeholders: [] };
  }
}

/**
 * Get network-specific deployment options
 */
function getDeploymentOptions(networkName: string): DeploymentOptions {
  const options: DeploymentOptions = {};
  
  switch (networkName) {
    case "sepolia":
      options.gasLimit = 5000000;
      options.gasPrice = ethers.parseUnits("10", "gwei");
      break;
    case "hardhat":
    case "localhost":
      options.gasLimit = 12000000;
      options.maxFeePerGas = ethers.parseUnits("100", "gwei");
      options.maxPriorityFeePerGas = ethers.parseUnits("2", "gwei");
      break;
    default:
      options.gasLimit = 3000000;
      break;
  }
  
  return options;
}

async function main(): Promise<DeploymentResult> {
  console.log("🚀 Starting DAO Multi-Signature Wallet deployment...");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name || "unknown";
  console.log("Network:", networkName);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // STEP 1: Deploy GasOptimizer library
  console.log("\n📦 Deploying GasOptimizer library...");
  
  const GasOptimizer = await ethers.getContractFactory("GasOptimizer");
  const deployOptions = getDeploymentOptions(networkName);
  
  const gasOptimizer: GasOptimizer = await GasOptimizer.deploy(deployOptions);
  await gasOptimizer.waitForDeployment();
  const gasOptimizerAddress = await gasOptimizer.getAddress();
  
  console.log("✅ GasOptimizer deployed to:", gasOptimizerAddress);
  
  const deployTx = gasOptimizer.deploymentTransaction();
  let gasOptimizerGas = "0";
  if (deployTx) {
    const receipt = await deployTx.wait();
    if (receipt) {
      gasOptimizerGas = receipt.gasUsed.toString();
      console.log("⛽ Gas used for GasOptimizer:", gasOptimizerGas);
    }
  }

  // STEP 2: Setup initial signers
  let initialSigners: string[];
  
  if (networkName === "sepolia") {
    initialSigners = [
      deployer.address,
      "0xDD593Be711edE50b1624289DD1eED67bF84Eb51d", // Replace with actual addresses
      "0x7131ddDbC0CE76E61Fce593c53CEdA99621a531D"  // Replace with actual addresses
    ];
  } else {
    const signers = await ethers.getSigners();
    if (signers.length >= 3) {
      initialSigners = [
        signers[0].address,
        signers[1].address,
        signers[2].address
      ];
    } else {
      // Fallback if not enough signers available
      initialSigners = [
        deployer.address,
        deployer.address, // Will need to be replaced in production
        deployer.address  // Will need to be replaced in production
      ];
      console.log("⚠️ Warning: Using deployer address as multiple signers for testing");
    }
  }
  
  const requiredSignatures = 2;
  const walletName = "DAO MultiSig Wallet";
  const walletVersion = "1.0.0";

  console.log("\n👥 Initial Signers:");
  initialSigners.forEach((signer, index) => {
    console.log(`   ${index + 1}. ${signer}`);
  });
  console.log("✏️  Required signatures:", requiredSignatures);

  // STEP 3: Smart contract deployment with automatic library detection
  console.log("\n📦 Deploying DAOMultiSigWallet...");
  
  // Detect if contract needs library linking
  const libraryInfo = await detectLibraryDependencies("DAOMultiSigWallet");
  console.log("🔍 Library analysis:", libraryInfo.needsLinking ? "Linking required" : "No linking needed");
  
  let daoWallet: DAOMultiSigWallet | undefined;
  let deploymentMethod: string = "";
  let daoWalletGas = "0";
  
  if (libraryInfo.needsLinking) {
    console.log("🔗 Deploying with library linking...");
    
    // Try different library linking approaches
    const libraryConfigs = [
      { "contracts/GasOptimizer.sol:GasOptimizer": gasOptimizerAddress },
      { "GasOptimizer": gasOptimizerAddress },
      { "./GasOptimizer.sol:GasOptimizer": gasOptimizerAddress }
    ];
    
    let deployed = false;
    for (let i = 0; i < libraryConfigs.length && !deployed; i++) {
      try {
        console.log(`   📝 Trying library config ${i + 1}...`);
        
        const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet", {
          libraries: libraryConfigs[i]
        });
        
        daoWallet = await DAOMultiSigWallet.deploy(
          initialSigners,
          requiredSignatures,
          walletName,
          walletVersion,
          deployOptions
        ) as DAOMultiSigWallet;
        
        await daoWallet.waitForDeployment();
        deployed = true;
        deploymentMethod = `Library linking (config ${i + 1})`;
        console.log("   ✅ Success with config", i + 1);
        
      } catch (error: any) {
        console.log(`   ⚠️ Config ${i + 1} failed:`, error.message.split('\n')[0]);
      }
    }
    
    if (!deployed || !daoWallet) {
      throw new Error("All library linking methods failed");
    }
  } else {
    console.log("🔗 Deploying without library linking...");
    
    const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
    
    daoWallet = await DAOMultiSigWallet.deploy(
      initialSigners,
      requiredSignatures,
      walletName,
      walletVersion,
      deployOptions
    ) as DAOMultiSigWallet;
    
    await daoWallet.waitForDeployment();
    deploymentMethod = "Standard deployment (no linking needed)";
    console.log("✅ Standard deployment successful");
  }

  // Ensure daoWallet is properly initialized
  if (!daoWallet) {
    throw new Error("Failed to deploy DAOMultiSigWallet contract");
  }

  // Ensure deploymentMethod is set
  if (!deploymentMethod) {
    deploymentMethod = "Unknown deployment method";
  }

  const daoWalletAddress = await daoWallet.getAddress();
  
  console.log("✅ DAOMultiSigWallet deployed to:", daoWalletAddress);
  console.log("🔧 Deployment method:", deploymentMethod);

  const walletDeployTx = daoWallet.deploymentTransaction();
  if (walletDeployTx) {
    const receipt = await walletDeployTx.wait();
    if (receipt) {
      daoWalletGas = receipt.gasUsed.toString();
      console.log("⛽ Gas used for DAOMultiSigWallet:", daoWalletGas);
    }
  }

  // STEP 4: Verification
  console.log("\n🔍 Verifying deployment...");
  try {
    const signerCount = await daoWallet.getSignerCount();
    const requiredSigs = await daoWallet.getRequiredSignatures();
    const proposalDuration = await daoWallet.getProposalDuration();
    const isPaused = await daoWallet.isPaused();
    const transactionCount = await daoWallet.transactionCount();
    const owner = await daoWallet.owner();
    
    console.log("✅ Contract verification successful:");
    console.log("   👥 Total signers:", signerCount.toString());
    console.log("   ✏️  Required signatures:", requiredSigs.toString());
    console.log("   ⏰ Proposal duration:", proposalDuration.toString(), "seconds");
    console.log("   🔒 Is paused:", isPaused);
    console.log("   📝 Transaction count:", transactionCount.toString());
    console.log("   👤 Contract owner:", owner);
    
  } catch (error: any) {
    console.log("⚠️ Verification failed:", error.message);
    throw error;
  }

  // STEP 5: Test library functions (if available)
  console.log("\n🧪 Testing library functionality...");
  try {
    // Submit a test transaction
    const testTx = await daoWallet.submitTransaction(
      deployer.address,
      ethers.parseEther("0.1"),
      "0x",
      Math.floor(Date.now() / 1000) + 3600
    );
    await testTx.wait();
    console.log("   ✅ Test transaction submitted");
    
    // Test gas estimation functions
    try {
      const gasEstimate = await daoWallet.estimateExecutionGas(0);
      console.log("   ✅ Gas estimation:", gasEstimate.toString());
      
      const batchGasEstimate = await daoWallet.estimateBatchExecutionGas([0]);
      console.log("   ✅ Batch gas estimation:", batchGasEstimate.toString());
      
      console.log("🎯 All library functions working correctly!");
    } catch (libError: any) {
      console.log("   ⚠️ Gas estimation not available:", libError.message);
      console.log("   📝 Contract deployed but gas optimization functions may not work");
    }
    
  } catch (error: any) {
    console.log("⚠️ Library function test failed:", error.message);
    console.log("   Contract deployed but may not have full library functionality");
  }

  // STEP 6: Fund wallet (local networks only)
  if (networkName === "hardhat" || networkName === "localhost") {
    console.log("\n💸 Funding wallet for testing...");
    try {
      const fundTx = await deployer.sendTransaction({
        to: daoWalletAddress,
        value: ethers.parseEther("5.0")
      });
      await fundTx.wait();
      
      const walletBalance = await ethers.provider.getBalance(daoWalletAddress);
      console.log("✅ Wallet funded with:", ethers.formatEther(walletBalance), "ETH");
    } catch (error: any) {
      console.log("⚠️ Funding failed:", error.message);
    }
  }

  // STEP 7: Save deployment info
  console.log("\n📄 Saving deployment information...");
  const chainId = network.chainId;
  const deploymentInfo: DeploymentInfo = {
    network: networkName,
    chainId: Number(chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    deploymentMethod: deploymentMethod,
    libraryLinking: libraryInfo.needsLinking,
    contracts: {
      GasOptimizer: {
        address: gasOptimizerAddress,
        txHash: gasOptimizer.deploymentTransaction()?.hash
      },
      DAOMultiSigWallet: {
        address: daoWalletAddress,
        txHash: daoWallet.deploymentTransaction()?.hash,
        initialSigners: initialSigners,
        requiredSignatures: requiredSignatures,
        walletName: walletName,
        walletVersion: walletVersion
      }
    },
    gasUsage: {
      gasOptimizer: gasOptimizerGas,
      daoWallet: daoWalletGas
    }
  };

  try {
    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filename = `${networkName}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentPath, filename),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("✅ Deployment info saved to:", `deployments/${filename}`);
  } catch (error: any) {
    console.log("⚠️ Could not save deployment info:", error.message);
  }

  console.log("\n🎉 Deployment completed successfully!");
  
  // Verification command for testnets
  if (networkName === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("\n🔐 Etherscan verification commands:");
    console.log(`npx hardhat verify --network ${networkName} ${gasOptimizerAddress}`);
    
    if (libraryInfo.needsLinking) {
      console.log(`npx hardhat verify --network ${networkName} ${daoWalletAddress} --libraries GasOptimizer:${gasOptimizerAddress} '[${initialSigners.map(s => `"${s}"`).join(',')}]' ${requiredSignatures} "${walletName}" "${walletVersion}"`);
    } else {
      console.log(`npx hardhat verify --network ${networkName} ${daoWalletAddress} '[${initialSigners.map(s => `"${s}"`).join(',')}]' ${requiredSignatures} "${walletName}" "${walletVersion}"`);
    }
  }

  return {
    network: networkName,
    gasOptimizer: gasOptimizerAddress,
    daoWallet: daoWalletAddress,
    initialSigners,
    requiredSignatures,
    deploymentMethod,
    libraryLinking: libraryInfo.needsLinking
  };
}

// Execute if script is run directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log("\n📋 Final Deployment Summary:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🌐 Network:", result.network);
      console.log("📦 GasOptimizer:", result.gasOptimizer);
      console.log("🏛️  DAOMultiSigWallet:", result.daoWallet);
      console.log("👥 Initial Signers:", result.initialSigners.length);
      console.log("✏️  Required Signatures:", result.requiredSignatures);
      console.log("🔧 Method Used:", result.deploymentMethod);
      console.log("🔗 Library Linking:", result.libraryLinking ? "✅ Required & Applied" : "❌ Not Required");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      if (result.libraryLinking) {
        console.log("🎯 Library linking successful! All GasOptimizer functions available.");
      } else {
        console.log("📝 Contract deployed without library linking (not required).");
      }
      
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed:");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("Error:", error.message);
      if (error.reason) console.error("Reason:", error.reason);
      if (error.code) console.error("Code:", error.code);
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      console.log("\n💡 Troubleshooting:");
      console.log("1. Run: npx hardhat clean && npx hardhat compile");
      console.log("2. Check if contract files are in correct location");
      console.log("3. Verify library usage in contract code");
      console.log("4. Check network configuration in hardhat.config.ts");
      
      process.exit(1);
    });
}

export default main;