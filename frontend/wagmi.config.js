// frontend/wagmi.config.js - Separate wagmi configuration
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, hardhat, localhost } from 'wagmi/chains'
import { injected, walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors'

// Configure chains
const chains = [localhost, hardhat, sepolia, mainnet]

// Create wagmi config
export const config = createConfig({
  chains,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
    }),
    coinbaseWallet({
      appName: 'DAO MultiSig Wallet',
      appLogoUrl: 'https://example.com/logo.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY 
      ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : undefined
    ),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
      : undefined
    ),
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
  ssr: false, // FIXED: Disable SSR to prevent hydration issues
})