// file frontend/pages/index.js - FIXED VERSION with Wagmi v2 hooks
import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import WalletInfo from '../components/WalletInfo'
import TransactionList from '../components/TransactionList'
import CreateTransaction from '../components/CreateTransaction'
import VoteOnTransaction from '../components/VoteOnTransaction'
import SignerManagement from '../components/SignerManagement'

// Contract ABI (lengkap dengan semua fungsi yang dibutuhkan)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "getSigners",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRequiredSignatures",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "transactionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isSigner",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isPaused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getProposalDuration",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "executionDelay",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_to", "type": "address"},
      {"internalType": "uint256", "name": "_value", "type": "uint256"},
      {"internalType": "bytes", "name": "_data", "type": "bytes"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"}
    ],
    "name": "submitTransaction",
    "outputs": [{"internalType": "uint256", "name": "txId", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_txId", "type": "uint256"},
      {"internalType": "bool", "name": "_support", "type": "bool"}
    ],
    "name": "voteOnTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
    "name": "executeTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
    "name": "getTransaction",
    "outputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"},
      {"internalType": "bool", "name": "executed", "type": "bool"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "yesVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "noVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "submissionTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Default contract address - Ganti dengan address hasil deployment Anda
const DEFAULT_CONTRACT_ADDRESS = '0x9Bb65b12162a51413272d10399282E730822Df44' // Dari deployment localhost

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')
  const [contractAddress, setContractAddress] = useState(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || DEFAULT_CONTRACT_ADDRESS
  )
  const [isValidAddress, setIsValidAddress] = useState(true)

  const { address, isConnected, isConnecting, isDisconnected } = useAccount()

  // Contract reads dengan Wagmi v2 - useReadContract
  const { 
    data: signers, 
    error: signersError, 
    isLoading: signersLoading,
    refetch: refetchSigners 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getSigners',
    query: {
      enabled: isConnected && isValidAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    }
  })

  const { 
    data: requiredSignatures, 
    error: requiredError,
    isLoading: requiredLoading 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRequiredSignatures',
    query: {
      enabled: isConnected && isValidAddress,
    }
  })

  const { 
    data: transactionCount, 
    error: transactionCountError,
    isLoading: transactionCountLoading,
    refetch: refetchTransactionCount 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'transactionCount',
    query: {
      enabled: isConnected && isValidAddress,
    }
  })

  const { 
    data: isSigner, 
    error: isSignerError,
    isLoading: isSignerLoading 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'isSigner',
    args: [address],
    query: {
      enabled: isConnected && address && isValidAddress,
    }
  })

  const { 
    data: isPaused 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'isPaused',
    query: {
      enabled: isConnected && isValidAddress,
    }
  })

  const { 
    data: proposalDuration 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getProposalDuration',
    query: {
      enabled: isConnected && isValidAddress,
    }
  })

  const { 
    data: executionDelay 
  } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'executionDelay',
    query: {
      enabled: isConnected && isValidAddress,
    }
  })

  // Validate contract address
  const validateContractAddress = (addr) => {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(addr)
    setIsValidAddress(isValid)
    return isValid
  }

  // Handle contract address change
  const handleContractAddressChange = (addr) => {
    setContractAddress(addr)
    validateContractAddress(addr)
  }

  // Auto-refresh data
  const refreshData = () => {
    refetchSigners()
    refetchTransactionCount()
  }

  // Check if there are any errors
  const hasErrors = signersError || requiredError || transactionCountError || isSignerError
  const isLoading = signersLoading || requiredLoading || transactionCountLoading || isSignerLoading

  // Tab configuration
  const tabs = [
    { 
      key: 'overview', 
      label: 'Overview', 
      icon: '📊',
      description: 'Wallet status and statistics'
    },
    { 
      key: 'transactions', 
      label: 'Transactions', 
      icon: '📋',
      description: 'View transaction history'
    },
    { 
      key: 'create', 
      label: 'Create Transaction', 
      icon: '✍️',
      description: 'Submit new transaction'
    },
    { 
      key: 'vote', 
      label: 'Vote', 
      icon: '🗳️',
      description: 'Vote on proposals'
    },
    { 
      key: 'signers', 
      label: 'Signers', 
      icon: '👥',
      description: 'Manage wallet signers'
    },
  ]

  // Get current tab info
  const currentTab = tabs.find(tab => tab.key === activeTab) || tabs[0]

  // Render tab content
  const renderTabContent = () => {
    const commonProps = {
      contractAddress,
      signers: signers || [],
      requiredSignatures: Number(requiredSignatures || 0),
      transactionCount: Number(transactionCount || 0),
      isSigner: Boolean(isSigner),
      isPaused: Boolean(isPaused),
      proposalDuration: Number(proposalDuration || 0),
      executionDelay: Number(executionDelay || 0)
    }

    switch (activeTab) {
      case 'overview':
        return <WalletInfo {...commonProps} />
      case 'transactions':
        return <TransactionList {...commonProps} />
      case 'create':
        return <CreateTransaction {...commonProps} />
      case 'vote':
        return <VoteOnTransaction {...commonProps} />
      case 'signers':
        return <SignerManagement {...commonProps} />
      default:
        return <WalletInfo {...commonProps} />
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    if (isConnected && isValidAddress) {
      const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isConnected, isValidAddress])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div className="animate-fade-in">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DAO MultiSig Wallet
            </h1>
            <p className="text-gray-300 text-lg">
              Secure multi-signature wallet with DAO governance and gas optimization
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
              {isPaused && (
                <div className="flex items-center text-sm text-yellow-400">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  Wallet Paused
                </div>
              )}
            </div>
          </div>
          <div className="animate-slide-in">
            <ConnectButton />
          </div>
        </header>

        {/* Contract Address Input */}
        <div className="card mb-8 animate-scale-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <label className="block text-white text-sm font-medium mb-2">
                Contract Address
              </label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => handleContractAddressChange(e.target.value)}
                className={`input ${!isValidAddress ? 'input-error' : ''}`}
                placeholder="0x..."
              />
              {!isValidAddress && (
                <p className="text-red-400 text-sm mt-1">Please enter a valid contract address</p>
              )}
            </div>
            <div className="flex items-center space-x-2 lg:mt-6">
              <button
                onClick={refreshData}
                disabled={!isConnected || !isValidAddress || isLoading}
                className="btn-secondary flex items-center space-x-2"
              >
                <span className={`${isLoading ? 'animate-spin' : ''}`}>🔄</span>
                <span>Refresh</span>
              </button>
              {hasErrors && (
                <div className="text-red-400 text-sm">
                  ⚠️ Connection Error
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        {isConnected && isValidAddress ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="card sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <span className="mr-2">🧭</span>
                  Navigation
                </h2>
                <ul className="space-y-2">
                  {tabs.map((tab) => (
                    <li key={tab.key}>
                      <button
                        onClick={() => setActiveTab(tab.key)}
                        className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-all duration-200 group ${
                          activeTab === tab.key
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium">{tab.label}</div>
                          <div className="text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                            {tab.description}
                          </div>
                        </div>
                        {activeTab === tab.key && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Signers</span>
                      <span className="text-white font-medium">
                        {signers?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Required</span>
                      <span className="text-white font-medium">
                        {Number(requiredSignatures || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Transactions</span>
                      <span className="text-white font-medium">
                        {Number(transactionCount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Your Role</span>
                      <span className={`text-sm font-medium ${isSigner ? 'text-green-400' : 'text-gray-400'}`}>
                        {isSigner ? 'Signer' : 'Observer'}
                      </span>
                    </div>
                  </div>
                </div>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="card">
                {/* Tab Header */}
                <div className="mb-6 pb-4 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{currentTab.icon}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentTab.label}
                      </h2>
                      <p className="text-gray-300">
                        {currentTab.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading wallet data...</p>
                  </div>
                ) : hasErrors ? (
                  <div className="text-center py-12">
                    <div className="text-red-400 text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Connection Error
                    </h3>
                    <p className="text-gray-300 mb-4">
                      Unable to connect to the smart contract. Please check:
                    </p>
                    <ul className="text-gray-400 text-left max-w-md mx-auto space-y-1">
                      <li>• Contract address is correct</li>
                      <li>• You're connected to the right network</li>
                      <li>• Contract is deployed and accessible</li>
                    </ul>
                    <button
                      onClick={refreshData}
                      className="btn-primary mt-4"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  /* Tab Content */
                  <div className="animate-fade-in">
                    {renderTabContent()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !isConnected ? (
          /* Not Connected State */
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto animate-bounce-in">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-300 mb-6">
                Please connect your wallet to access the DAO MultiSig Wallet interface and start managing your funds securely.
              </p>
              <ConnectButton />
              
              {/* Features Preview */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">🛡️</div>
                    <div className="text-gray-300">Multi-Signature Security</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">🗳️</div>
                    <div className="text-gray-300">DAO Governance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">⛽</div>
                    <div className="text-gray-300">Gas Optimization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-gray-300">Real-time Analytics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Invalid Address State */
          <div className="text-center py-16">
            <div className="card max-w-md mx-auto">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Invalid Contract Address
              </h2>
              <p className="text-gray-300 mb-6">
                Please enter a valid contract address to continue.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400">
          <div className="card">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  DAO MultiSig Wallet
                </h3>
                <p className="text-sm">
                  Tugas Akhir: Implementasi Multi-Signature Web3 Wallet untuk DAO dengan Optimisasi Gas berbasis Solidity
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <div className="text-white font-medium">Built with</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span>Next.js</span>
                    <span>•</span>
                    <span>Solidity</span>
                    <span>•</span>
                    <span>Hardhat</span>
                    <span>•</span>
                    <span>Wagmi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}