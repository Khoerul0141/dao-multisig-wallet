// file frontend/pages/index.js
import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import WalletInfo from '../components/WalletInfo'
import TransactionList from '../components/TransactionList'
import CreateTransaction from '../components/CreateTransaction'
import VoteOnTransaction from '../components/VoteOnTransaction'
import SignerManagement from '../components/SignerManagement'

// Contract ABI (simplified for demo)
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
    "name": "requiredSignatures",
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
    "name": "getTransaction",
    "outputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"},
      {"internalType": "bool", "name": "executed", "type": "bool"},
      {"internalType": "uint256", "name": "deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "yesVotes", "type": "uint256"},
      {"internalType": "uint256", "name": "noVotes", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// Replace with your deployed contract address
const CONTRACT_ADDRESS = '0x...' // Your deployed contract address

export default function Home() {
  const [activeTab, setActiveTab] = useState('overview')
  const [contractAddress, setContractAddress] = useState(CONTRACT_ADDRESS)
  const { address, isConnected } = useAccount()

  // Contract reads
  const { data: signers } = useContractRead({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getSigners',
    enabled: isConnected && contractAddress !== '0x...',
  })

  const { data: requiredSignatures } = useContractRead({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'requiredSignatures',
    enabled: isConnected && contractAddress !== '0x...',
  })

  const { data: transactionCount } = useContractRead({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'transactionCount',
    enabled: isConnected && contractAddress !== '0x...',
  })

  const { data: isSigner } = useContractRead({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'isSigner',
    args: [address],
    enabled: isConnected && address && contractAddress !== '0x...',
  })

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <WalletInfo 
            contractAddress={contractAddress}
            signers={signers || []}
            requiredSignatures={requiredSignatures || 0}
            transactionCount={transactionCount || 0}
            isSigner={isSigner || false}
          />
        )
      case 'transactions':
        return (
          <TransactionList 
            contractAddress={contractAddress}
            transactionCount={transactionCount || 0}
          />
        )
      case 'create':
        return (
          <CreateTransaction 
            contractAddress={contractAddress}
            isSigner={isSigner || false}
          />
        )
      case 'vote':
        return (
          <VoteOnTransaction 
            contractAddress={contractAddress}
            transactionCount={transactionCount || 0}
            isSigner={isSigner || false}
          />
        )
      case 'signers':
        return (
          <SignerManagement 
            contractAddress={contractAddress}
            signers={signers || []}
            isSigner={isSigner || false}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              DAO MultiSig Wallet
            </h1>
            <p className="text-gray-300">
              Secure multi-signature wallet with DAO governance
            </p>
          </div>
          <ConnectButton />
        </header>

        {/* Contract Address Input */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <label className="block text-white text-sm font-medium mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="0x..."
          />
        </div>

        {isConnected ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Navigation</h2>
                <ul className="space-y-2">
                  {[
                    { key: 'overview', label: 'Overview', icon: '📊' },
                    { key: 'transactions', label: 'Transactions', icon: '📋' },
                    { key: 'create', label: 'Create Transaction', icon: '✍️' },
                    { key: 'vote', label: 'Vote', icon: '🗳️' },
                    { key: 'signers', label: 'Signers', icon: '👥' },
                  ].map((tab) => (
                    <li key={tab.key}>
                      <button
                        onClick={() => setActiveTab(tab.key)}
                        className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors ${
                          activeTab === tab.key
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-300 mb-6">
                Please connect your wallet to access the DAO MultiSig Wallet interface.
              </p>
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}