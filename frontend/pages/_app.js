// frontend/pages/_app.js - FIXED VERSION without Safe connectors
import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect } from 'react'
import {
  RainbowKitProvider,
  darkTheme,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia, hardhat, localhost } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Configure chains
const chains = [mainnet, sepolia, hardhat, localhost]

// Configure connectors (WITHOUT Safe connector to avoid the error)
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        injectedWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
    {
      groupName: 'Other',
      wallets: [
        coinbaseWallet,
        trustWallet,
      ],
    },
  ],
  {
    appName: 'DAO MultiSig Wallet',
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id',
  }
)

// Create wagmi config
const config = createConfig({
  connectors,
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
  ssr: false,
})

function MyApp({ Component, pageProps }) {
  // Create QueryClient inside component with proper configuration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        retry: 1,
        retryDelay: 1000,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  // Add client-side only rendering
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent SSR rendering to avoid hydration issues
  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px', fontSize: '24px' }}>🔄</div>
          <div>Loading DAO MultiSig Wallet...</div>
        </div>
      </div>
    )
  }

  return (
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