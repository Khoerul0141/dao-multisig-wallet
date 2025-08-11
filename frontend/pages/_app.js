// FIXED VERSION - Correct provider order and Wagmi v2 compatibility
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

// Create QueryClient FIRST
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime)
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Configure chains with Wagmi v2 syntax
const chains = [mainnet, sepolia, hardhat, localhost]

// Create wagmi config
const config = createConfig({
  chains,
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
  ssr: true, // Enable SSR support
})

// Configure wallet connectors with correct chains reference
const { connectors } = getDefaultWallets({
  appName: 'DAO MultiSig Wallet',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo',
  chains, // Use the chains array directly
})

function MyApp({ Component, pageProps }) {
  return (
    // CORRECT ORDER: QueryClientProvider MUST be the outermost provider
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider
          chains={chains}
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
          modalSize="compact"
        >
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}

export default MyApp