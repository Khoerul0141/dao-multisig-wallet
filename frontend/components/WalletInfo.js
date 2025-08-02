// file frontend/components/WalletInfo.js
import { useState, useEffect } from 'react'
import { useBalance, useAccount, useContractRead } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { 
  CheckIcon, 
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  BoltIcon,
  LockClosedIcon,
  ArrowPathIcon,
  CalendarIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

// Enhanced Contract ABI for additional reads
const EXTENDED_CONTRACT_ABI = [
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
    "inputs": [],
    "name": "transactionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
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
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export default function WalletInfo({ 
  contractAddress, 
  signers = [], 
  requiredSignatures = 0, 
  transactionCount = 0, 
  isSigner = false,
  isPaused = false, 
  proposalDuration = 0, 
  executionDelay = 0 
}) {
  const { address } = useAccount()
  
  // Enhanced state management
  const [stats, setStats] = useState({
    totalSigners: 0,
    requiredSignatures: 0,
    totalTransactions: 0,
    balance: '0',
    userIsSigner: false,
    securityLevel: 0,
    avgTransactionValue: '0',
    pendingTransactions: 0,
    executedTransactions: 0,
    expiredTransactions: 0
  })

  const [copiedAddress, setCopiedAddress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [additionalData, setAdditionalData] = useState({
    gasOptimizationEnabled: false,
    emergencyPauseEnabled: false,
    daoGovernanceActive: false
  })

  // Enhanced balance reading with error handling
  const { 
    data: balance, 
    isError: balanceError, 
    isLoading: balanceLoading,
    refetch: refetchBalance 
  } = useBalance({
    address: contractAddress,
    enabled: contractAddress !== '0x...' && contractAddress !== '',
    watch: true,
    cacheTime: 30000, // 30 seconds cache
  })

  // Additional contract reads for enhanced information
  const { data: contractOwner } = useContractRead({
    address: contractAddress,
    abi: EXTENDED_CONTRACT_ABI,
    functionName: 'owner',
    enabled: contractAddress !== '0x...' && contractAddress !== '',
  })

  // Calculate enhanced statistics
  useEffect(() => {
    const calculateStats = () => {
      const totalSigners = signers.length
      const securityLevel = totalSigners > 0 ? Math.round((requiredSignatures / totalSigners) * 100) : 0
      
      // Mock calculations for transaction analytics (in real app, you'd read from contract)
      const avgTransactionValue = transactionCount > 0 ? 
        (parseFloat(formatEther(balance?.value || 0)) / transactionCount).toFixed(4) : '0'
      
      setStats({
        totalSigners,
        requiredSignatures,
        totalTransactions: transactionCount,
        balance: balance ? formatEther(balance.value) : '0',
        userIsSigner: isSigner,
        securityLevel,
        avgTransactionValue,
        pendingTransactions: Math.floor(transactionCount * 0.3), // Mock data
        executedTransactions: Math.floor(transactionCount * 0.6), // Mock data
        expiredTransactions: Math.floor(transactionCount * 0.1), // Mock data
      })

      // Set additional capabilities based on contract features
      setAdditionalData({
        gasOptimizationEnabled: true, // Your contract has GasOptimizer library
        emergencyPauseEnabled: true, // Your contract has pause functionality
        daoGovernanceActive: true // Your contract has DAO governance features
      })
    }

    calculateStats()
  }, [signers, requiredSignatures, transactionCount, balance, isSigner])

  // Enhanced copy handler with feedback
  const handleCopy = (text, label = 'Address') => {
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 3000)
    
    // Optional: Show toast notification
    console.log(`${label} copied to clipboard: ${text}`)
  }

  // Enhanced address truncation
  const truncateAddress = (addr, startLength = 8, endLength = 6) => {
    if (!addr) return 'N/A'
    return `${addr.substring(0, startLength)}...${addr.substring(addr.length - endLength)}`
  }

  // Format time duration
  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Enhanced stat card component
  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, isLoading = false }) => (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm opacity-90 font-medium">{title}</p>
            {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
          </div>
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full bg-white/20 ${
            trend.startsWith('+') ? 'text-green-200' : trend.startsWith('-') ? 'text-red-200' : 'text-gray-200'
          }`}>
            {trend}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        {isLoading ? (
          <div className="animate-pulse bg-white/30 h-8 w-24 rounded"></div>
        ) : (
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        )}
        <div className="opacity-60">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  )

  // Security indicator component
  const SecurityIndicator = ({ level }) => {
    const getSecurityColor = (level) => {
      if (level >= 70) return { color: 'text-green-400', bg: 'bg-green-500', label: 'High Security' }
      if (level >= 50) return { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Medium Security' }
      return { color: 'text-red-400', bg: 'bg-red-500', label: 'Low Security' }
    }

    const security = getSecurityColor(level)

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 ${security.bg} rounded-full animate-pulse`}></div>
        <span className={`${security.color} font-medium`}>{security.label}</span>
        <span className="text-gray-400">({level}%)</span>
      </div>
    )
  }

  // Features showcase component
  const FeatureShowcase = () => (
    <div className="bg-white/5 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <SparklesIcon className="h-5 w-5 mr-2 text-purple-400" />
        Advanced Features
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border-2 transition-all ${
          additionalData.gasOptimizationEnabled 
            ? 'bg-green-500/10 border-green-500 text-green-400' 
            : 'bg-gray-500/10 border-gray-500 text-gray-400'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <BoltIcon className="h-5 w-5" />
            <span className="font-medium">Gas Optimization</span>
          </div>
          <p className="text-xs opacity-75">
            {additionalData.gasOptimizationEnabled 
              ? 'Library-based gas optimization active' 
              : 'Standard gas usage'
            }
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 transition-all ${
          additionalData.emergencyPauseEnabled 
            ? 'bg-orange-500/10 border-orange-500 text-orange-400' 
            : 'bg-gray-500/10 border-gray-500 text-gray-400'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <LockClosedIcon className="h-5 w-5" />
            <span className="font-medium">Emergency Controls</span>
          </div>
          <p className="text-xs opacity-75">
            {additionalData.emergencyPauseEnabled 
              ? 'Pause/unpause functionality available' 
              : 'No emergency controls'
            }
          </p>
        </div>

        <div className={`p-4 rounded-lg border-2 transition-all ${
          additionalData.daoGovernanceActive 
            ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
            : 'bg-gray-500/10 border-gray-500 text-gray-400'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <UserGroupIcon className="h-5 w-5" />
            <span className="font-medium">DAO Governance</span>
          </div>
          <p className="text-xs opacity-75">
            {additionalData.daoGovernanceActive 
              ? 'Time-locked voting and proposals' 
              : 'Basic multisig only'
            }
          </p>
        </div>
      </div>
    </div>
  )

  // Refresh data handler
  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refetchBalance()
      // Add other refresh logic here if needed
    } catch (err) {
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-purple-400" />
            Wallet Overview
          </h2>
          <p className="text-gray-300">
            Comprehensive analytics and status for your DAO MultiSig Wallet
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-secondary flex items-center space-x-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Display */}
      {(error || balanceError) && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-400">
            {error || 'Failed to load wallet balance'}
          </span>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Balance"
          value={`${parseFloat(stats.balance).toFixed(4)} ETH`}
          subtitle={`~$${(parseFloat(stats.balance) * 2500).toLocaleString()}`}
          icon={CurrencyDollarIcon}
          color="from-green-500 to-emerald-600"
          trend={balance ? "+0.5%" : ""}
          isLoading={balanceLoading}
        />
        
        <StatCard
          title="Active Signers"
          value={`${stats.totalSigners}`}
          subtitle={`${stats.requiredSignatures} required to execute`}
          icon={UserGroupIcon}
          color="from-blue-500 to-cyan-600"
        />
        
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          subtitle={`${stats.executedTransactions} executed`}
          icon={DocumentDuplicateIcon}
          color="from-purple-500 to-violet-600"
          trend={`+${stats.pendingTransactions} pending`}
        />
        
        <StatCard
          title="Security Level"
          value={`${stats.securityLevel}%`}
          subtitle="Multi-signature protection"
          icon={ShieldCheckIcon}
          color={stats.securityLevel >= 70 ? "from-emerald-500 to-green-600" : 
                stats.securityLevel >= 50 ? "from-yellow-500 to-orange-600" : 
                "from-red-500 to-pink-600"}
        />
      </div>

      {/* Configuration Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Configuration */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CogIcon className="h-5 w-5 mr-2 text-blue-400" />
            Wallet Configuration
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-300">Required Signatures</span>
              <span className="text-white font-medium">{stats.requiredSignatures} of {stats.totalSigners}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-300">Proposal Duration</span>
              <span className="text-white font-medium">{formatDuration(proposalDuration)}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-300">Execution Delay</span>
              <span className="text-white font-medium">{formatDuration(executionDelay)}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-gray-300">Contract Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className={`font-medium ${isPaused ? 'text-red-400' : 'text-green-400'}`}>
                  {isPaused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-300">Your Role</span>
              <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                stats.userIsSigner 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {stats.userIsSigner ? 'Authorized Signer' : 'Observer'}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Analytics */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-green-400" />
            Transaction Analytics
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.executedTransactions}</div>
                <div className="text-gray-400 text-sm">Executed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.pendingTransactions}</div>
                <div className="text-gray-400 text-sm">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{stats.expiredTransactions}</div>
                <div className="text-gray-400 text-sm">Expired</div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Average Transaction Value</span>
                <span className="text-white font-medium">{stats.avgTransactionValue} ETH</span>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-300 text-sm">Success Rate</span>
                <span className="text-green-400 font-medium">
                  {stats.totalTransactions > 0 ? 
                    Math.round((stats.executedTransactions / stats.totalTransactions) * 100) : 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Security Score</span>
                <SecurityIndicator level={stats.securityLevel} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <FeatureShowcase />

      {/* Signers List */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-purple-400" />
            Authorized Signers ({signers.length})
          </h3>
          
          {contractOwner && (
            <div className="text-sm text-gray-400">
              Owner: {truncateAddress(contractOwner)}
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          {signers.length > 0 ? signers.map((signer, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-4 rounded-lg transition-all hover:bg-white/10 ${
                signer.toLowerCase() === address?.toLowerCase() 
                  ? 'bg-purple-500/20 border border-purple-500' 
                  : 'bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  signer.toLowerCase() === address?.toLowerCase() 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {index + 1}
                </div>
                
                <div>
                  <div className="text-white font-mono text-sm">
                    {truncateAddress(signer, 10, 8)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {signer.toLowerCase() === address?.toLowerCase() && (
                      <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                    {signer.toLowerCase() === contractOwner?.toLowerCase() && (
                      <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CopyToClipboard text={signer} onCopy={() => handleCopy(signer, `Signer ${index + 1}`)}>
                  <button className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
                    {copiedAddress === signer ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    )}
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-400">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No signers loaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Contract Information */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
          Contract Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Contract Address
            </label>
            <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
              <span className="font-mono text-white text-sm">
                {truncateAddress(contractAddress, 12, 10)}
              </span>
              <CopyToClipboard text={contractAddress} onCopy={() => handleCopy(contractAddress, 'Contract Address')}>
                <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
                  {copiedAddress === contractAddress ? (
                    <>
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </CopyToClipboard>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Deployment Information
            </label>
            <div className="bg-white/10 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">DAO MultiSig Wallet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Version:</span>
                <span className="text-white">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gas Optimization:</span>
                <span className={`${additionalData.gasOptimizationEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                  {additionalData.gasOptimizationEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            className="btn-secondary text-sm py-2 px-3 flex items-center justify-center space-x-2"
            onClick={() => window.location.hash = '#create'}
          >
            <span>Create Transaction</span>
          </button>
          
          <button 
            className="btn-secondary text-sm py-2 px-3 flex items-center justify-center space-x-2"
            onClick={() => window.location.hash = '#vote'}
          >
            <span>Vote on Proposals</span>
          </button>
          
          <button 
            className="btn-secondary text-sm py-2 px-3 flex items-center justify-center space-x-2"
            onClick={() => window.location.hash = '#transactions'}
          >
            <span>View History</span>
          </button>
          
          {stats.userIsSigner && (
            <button 
              className="btn-secondary text-sm py-2 px-3 flex items-center justify-center space-x-2"
              onClick={() => window.location.hash = '#signers'}
            >
              <span>Manage Signers</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}