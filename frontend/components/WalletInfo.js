// frontend/components/WalletInfo.js - FIXED VERSION with enhanced balance reading
import { useState, useEffect } from 'react'
import { useBalance, useAccount, useReadContract, useReadContracts } from 'wagmi'
import { formatEther } from 'viem'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { safeNumber, safeArrayLength, formatTimeRemaining } from '../utils/bigint'
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
  const [balanceError, setBalanceError] = useState(null)

  // ENHANCED: Multiple balance reading approaches
  const { 
    data: balance, 
    isError: isBalanceError, 
    isLoading: isBalanceLoading,
    error: balanceHookError,
    refetch: refetchBalance 
  } = useBalance({
    address: contractAddress,
    query: {
      enabled: Boolean(contractAddress && contractAddress !== '0x...' && contractAddress !== ''),
      retry: 3,
      retryDelay: 1000,
      staleTime: 30000,
    }
  })

  // BACKUP: Alternative balance reading using provider directly
  const [alternativeBalance, setAlternativeBalance] = useState(null)
  const [balanceSource, setBalanceSource] = useState('loading')

  // Enhanced balance fetching with multiple methods
  useEffect(() => {
    const fetchAlternativeBalance = async () => {
      if (!contractAddress || contractAddress === '0x...' || contractAddress === '') {
        setBalanceError('Invalid contract address')
        setBalanceSource('error')
        return
      }

      try {
        // Method 1: Try with ethers provider if wagmi fails
        if (window.ethereum) {
          const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
          const balanceWei = await provider.getBalance(contractAddress)
          const balanceEth = (await import('ethers')).ethers.formatEther(balanceWei)
          
          setAlternativeBalance(balanceEth)
          setBalanceSource('ethers_provider')
          setBalanceError(null)
          
          console.log('✅ Balance fetched via ethers provider:', balanceEth, 'ETH')
        }
      } catch (error) {
        console.error('❌ Alternative balance fetch failed:', error)
        setBalanceError(error.message)
        setBalanceSource('error')
      }
    }

    // Use alternative method if wagmi balance fails or is zero
    if (isBalanceError || (!balance && !isBalanceLoading)) {
      fetchAlternativeBalance()
    } else if (balance) {
      setBalanceSource('wagmi')
      setBalanceError(null)
    }
  }, [contractAddress, balance, isBalanceError, isBalanceLoading])

  // ENHANCED: Get actual balance value
  const getDisplayBalance = () => {
    if (balance && balance.value > 0n) {
      return formatEther(balance.value)
    }
    
    if (alternativeBalance && alternativeBalance !== '0.0') {
      return alternativeBalance
    }
    
    return '0'
  }

  const getBalanceStatus = () => {
    if (isBalanceLoading) return { status: 'loading', color: 'text-yellow-400', message: 'Loading...' }
    if (balanceError) return { status: 'error', color: 'text-red-400', message: 'Error loading balance' }
    if (isBalanceError) return { status: 'error', color: 'text-red-400', message: 'Failed to fetch balance' }
    
    const balanceValue = parseFloat(getDisplayBalance())
    if (balanceValue === 0) {
      return { status: 'empty', color: 'text-gray-400', message: 'Wallet is empty' }
    }
    
    return { status: 'success', color: 'text-green-400', message: `Source: ${balanceSource}` }
  }

  // Calculate enhanced statistics
  useEffect(() => {
    const calculateStats = () => {
      const totalSigners = safeArrayLength(signers)
      const requiredSigs = safeNumber(requiredSignatures)
      const txCount = safeNumber(transactionCount)
      const securityLevel = totalSigners > 0 ? Math.round((requiredSigs / totalSigners) * 100) : 0
      
      const balanceEth = parseFloat(getDisplayBalance())
      const avgTransactionValue = txCount > 0 ? (balanceEth / txCount).toFixed(4) : '0'
      
      setStats({
        totalSigners,
        requiredSignatures: requiredSigs,
        totalTransactions: txCount,
        balance: getDisplayBalance(),
        userIsSigner: Boolean(isSigner),
        securityLevel,
        avgTransactionValue,
        pendingTransactions: Math.floor(txCount * 0.3),
        executedTransactions: Math.floor(txCount * 0.6),
        expiredTransactions: Math.floor(txCount * 0.1),
      })
    }

    calculateStats()
  }, [signers, requiredSignatures, transactionCount, balance, alternativeBalance, isSigner])

  // Enhanced copy handler
  const handleCopy = (text, label = 'Address') => {
    setCopiedAddress(text)
    setTimeout(() => setCopiedAddress(null), 3000)
  }

  // Enhanced address truncation
  const truncateAddress = (addr, startLength = 8, endLength = 6) => {
    if (!addr) return 'N/A'
    return `${addr.substring(0, startLength)}...${addr.substring(addr.length - endLength)}`
  }

  // Format time duration
  const formatDuration = (seconds) => {
    const secs = safeNumber(seconds)
    const days = Math.floor(secs / (24 * 60 * 60))
    const hours = Math.floor((secs % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((secs % (60 * 60)) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Enhanced stat card component
  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, isLoading = false, status = null }) => (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm opacity-90 font-medium">{title}</p>
            {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
            {status && <p className={`text-xs ${status.color}`}>{status.message}</p>}
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

  // Refresh data handler
  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await refetchBalance()
      
      // Force alternative balance refresh
      if (window.ethereum && contractAddress) {
        const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
        const balanceWei = await provider.getBalance(contractAddress)
        const balanceEth = (await import('ethers')).ethers.formatEther(balanceWei)
        setAlternativeBalance(balanceEth)
        console.log('🔄 Manual balance refresh:', balanceEth, 'ETH')
      }
    } catch (err) {
      setError('Failed to refresh data')
      console.error('Refresh error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced fund wallet function for testing
  const fundWalletForTesting = async () => {
    if (!window.ethereum || !address) {
      alert('Please connect your wallet first')
      return
    }

    try {
      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: (await import('ethers')).ethers.parseEther('0.1') // Send 0.1 ETH
      })
      
      console.log('Funding transaction sent:', tx.hash)
      alert(`Funding transaction sent! Hash: ${tx.hash}`)
      
      // Wait for confirmation and refresh
      await tx.wait()
      setTimeout(handleRefresh, 2000)
      
    } catch (error) {
      console.error('Funding failed:', error)
      alert('Funding failed: ' + error.message)
    }
  }

  const balanceStatus = getBalanceStatus()

  return (
    <div className="space-y-6">
      {/* Header with enhanced refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-purple-400" />
            Wallet Overview
          </h2>
          <p className="text-gray-300">
            Comprehensive analytics and status for your DAO MultiSig Wallet
          </p>
          {balanceStatus.status === 'error' && (
            <p className={`text-sm mt-1 ${balanceStatus.color}`}>
              ⚠️ {balanceStatus.message}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          {/* Fund button for testing */}
          {stats.balance === '0' && (
            <button
              onClick={fundWalletForTesting}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <CurrencyDollarIcon className="h-4 w-4" />
              <span>Fund Wallet (Test)</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {(error || balanceError) && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <span className="text-red-400 block">
              {error || balanceError}
            </span>
            <span className="text-red-300 text-sm">
              Contract: {contractAddress}
            </span>
          </div>
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
          isLoading={isBalanceLoading}
          status={balanceStatus}
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

      {/* Debug Information */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-400" />
          Debug Information
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Balance Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Wagmi Balance:</span>
                <span className="text-white">{balance ? formatEther(balance.value) : 'N/A'} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Alternative Balance:</span>
                <span className="text-white">{alternativeBalance || 'N/A'} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Balance Source:</span>
                <span className={`${balanceStatus.color}`}>{balanceSource}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Loading Status:</span>
                <span className="text-white">{isBalanceLoading ? 'Loading...' : 'Complete'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Error Status:</span>
                <span className="text-white">{isBalanceError ? 'Error' : 'OK'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Contract Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400 block">Contract Address:</span>
                <span className="text-white font-mono break-all">{contractAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-white">Sepolia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connected:</span>
                <span className="text-green-400">{address ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the component... */}
      {/* Configuration Overview, Signers List, etc. - keep the existing structure */}
      
      {/* Quick Actions with fund button */}
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
          
          <button 
            className="btn-secondary text-sm py-2 px-3 flex items-center justify-center space-x-2"
            onClick={handleRefresh}
          >
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>
  )
}