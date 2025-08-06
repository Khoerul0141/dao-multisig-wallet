// FIXED VERSION - Compatible with Wagmi v2
import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultWallets,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia, hardhat, localhost } from 'wagmi/chains'
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Configure chains with Wagmi v2 syntax
const config = createConfig({
  chains: [mainnet, sepolia, hardhat, localhost],
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
})

// Configure wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'DAO MultiSig Wallet',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains: [mainnet, sepolia, hardhat, localhost],
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10, // Renamed from cacheTime
    },
  },
})

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7b3ff2',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          appInfo={{
            appName: 'DAO MultiSig Wallet',
            learnMoreUrl: 'https://github.com/your-username/dao-multisig-wallet',
          }}
          showRecentTransactions={true}
        >
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export default MyApp