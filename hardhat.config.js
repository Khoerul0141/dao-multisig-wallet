require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
require("@typechain/ethers-v6");
require("dotenv").config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      },
      viaIR: false, // Changed from true to false for better compatibility
      metadata: {
        bytecodeHash: "none"
      },
      outputSelection: {
        "*": {
          "*": ["*"]
        }
      }
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    discriminateTypes: false,
    tsNoCheck: false,
  },
  networks: {
    hardhat: {
      forking: ALCHEMY_API_KEY ? {
        url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 18900000,
      } : undefined,
      accounts: {
        count: 20, // Increased for testing
        accountsBalance: "10000000000000000000000",
      },
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      chainId: 31337,
      loggingEnabled: false,
      mining: {
        auto: true,
        interval: 0
      }
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: 6000000,
      gasPrice: 8000000000,
      timeout: 100000,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      chainId: 31337,
      timeout: 60000,
      accounts: "remote"
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 20,
    showTimeSpent: true,
    showMethodSig: true,
    excludeContracts: ["Migrations"],
    src: "./contracts",
    outputFile: process.env.CI ? "gas-report.txt" : undefined
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 120000, // Increased timeout for complex tests
    bail: false,
    allowUncaught: false,
    reporter: process.env.CI ? 'spec' : 'spec',
    grep: process.env.TEST_GREP || undefined
  },
  // Additional configuration for better testing
  defaultNetwork: "hardhat",
};