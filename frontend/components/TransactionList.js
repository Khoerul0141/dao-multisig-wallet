// frontend/components/TransactionList.js - FIXED VERSION dengan contract reads yang benar
import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  PlayIcon,
  PauseIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

// Contract ABI untuk membaca transaksi
const CONTRACT_ABI = [
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
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
    "name": "getTransactionStatus",
    "outputs": [
      {"internalType": "bool", "name": "canVote", "type": "bool"},
      {"internalType": "bool", "name": "canExecute", "type": "bool"},
      {"internalType": "bool", "name": "isExpired", "type": "bool"},
      {"internalType": "uint256", "name": "votingTimeLeft", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_txId", "type": "uint256"},
      {"internalType": "address", "name": "_voter", "type": "address"}
    ],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_txId", "type": "uint256"},
      {"internalType": "address", "name": "_voter", "type": "address"}
    ],
    "name": "getVote",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
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
    "inputs": [],
    "name": "transactionCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRequiredSignatures",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export default function TransactionList({ contractAddress, transactionCount, requiredSignatures, isSigner }) {
  const { address } = useAccount()
  
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, executable, executed, expired
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, amount
  const [selectedTx, setSelectedTx] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [error, setError] = useState(null)

  // Contract reads untuk data yang akurat
  const { data: actualTransactionCount, refetch: refetchTxCount } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'transactionCount',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x...',
    }
  })

  const { data: actualRequiredSignatures } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRequiredSignatures',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x...',
    }
  })

  // Contract write untuk execute transaction
  const { 
    data: executeData, 
    writeContract: executeTransaction, 
    isPending: isExecuteLoading 
  } = useWriteContract()

  // Wait for transaction
  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransactionReceipt({
    hash: executeData,
  })

  // FIXED: Load REAL transactions data from contract
  const loadTransactions = async () => {
    if (!contractAddress || contractAddress === '0x...' || !actualTransactionCount) {
      setLoading(false)
      return
    }

    console.log('🔄 Loading transaction list from contract...')
    setLoading(true)
    setError(null)
    
    try {
      const txCount = Number(actualTransactionCount)
      console.log(`📊 Total transactions: ${txCount}`)
      
      if (txCount === 0) {
        setTransactions([])
        setLoading(false)
        return
      }

      const txData = []

      // Load real transaction data from contract
      for (let i = 0; i < txCount; i++) {
        try {
          console.log(`📋 Loading transaction ${i}...`)
          
          // Get transaction details menggunakan ethers
          const txDetails = await (window.ethereum ? 
            (async () => {
              const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
              const contract = new (await import('ethers')).ethers.Contract(contractAddress, CONTRACT_ABI, provider)
              
              const [txData, statusData, hasVotedData, voteData] = await Promise.all([
                contract.getTransaction(i),
                contract.getTransactionStatus(i),
                contract.hasVoted(i, address || '0x0000000000000000000000000000000000000000'),
                address ? contract.getVote(i, address).catch(() => false) : Promise.resolve(false)
              ])
              
              return {
                transaction: txData,
                status: statusData,
                hasVoted: hasVotedData,
                userVote: voteData
              }
            })() :
            Promise.reject(new Error('Ethereum provider not available'))
          )

          // Get block info untuk mendapatkan timestamp yang lebih akurat
          let submitter = 'Unknown'
          let txHash = null
          
          try {
            // Coba ambil event submission untuk mendapatkan submitter
            const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
            const contract = new (await import('ethers')).ethers.Contract(contractAddress, CONTRACT_ABI, provider)
            
            // Get events dari block tertentu (simplified)
            const currentBlock = await provider.getBlockNumber()
            const fromBlock = Math.max(0, currentBlock - 10000) // Last 10k blocks
            
            const filter = contract.filters.TransactionSubmitted(i)
            const events = await contract.queryFilter(filter, fromBlock, currentBlock)
            
            if (events.length > 0) {
              submitter = events[0].args[1] // submitter address
              txHash = events[0].transactionHash
            }
          } catch (eventError) {
            console.log('Could not fetch submission event for tx', i)
          }

          const tx = {
            id: i,
            to: txDetails.transaction.to,
            value: txDetails.transaction.value.toString(),
            data: txDetails.transaction.data,
            executed: txDetails.transaction.executed,
            deadline: Number(txDetails.transaction.deadline) * 1000, // Convert to milliseconds
            yesVotes: Number(txDetails.transaction.yesVotes),
            noVotes: Number(txDetails.transaction.noVotes),
            submissionTime: Number(txDetails.transaction.submissionTime) * 1000,
            canVote: txDetails.status.canVote,
            canExecute: txDetails.status.canExecute,
            isExpired: txDetails.status.isExpired,
            votingTimeLeft: Number(txDetails.status.votingTimeLeft),
            hasVoted: txDetails.hasVoted,
            userVote: txDetails.userVote,
            submitter: submitter,
            txHash: txHash
          }
          
          console.log(`✅ Transaction ${i} loaded:`, {
            executed: tx.executed,
            yesVotes: tx.yesVotes,
            noVotes: tx.noVotes,
            canExecute: tx.canExecute,
            isExpired: tx.isExpired
          })
          
          txData.push(tx)
        } catch (error) {
          console.error(`❌ Error loading transaction ${i}:`, error)
          // Continue with next transaction
        }
      }
      
      console.log(`✅ Loaded ${txData.length} transactions from contract`)
      setTransactions(txData)
    } catch (error) {
      console.error('❌ Error loading transactions:', error)
      setError('Failed to load transactions from contract: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter dan sort transaksi
  const filteredAndSortedTransactions = () => {
    let filtered = transactions

    // Apply filter
    switch (filter) {
      case 'pending':
        filtered = transactions.filter(tx => !tx.executed && tx.canVote)
        break
      case 'executable':
        filtered = transactions.filter(tx => !tx.executed && tx.canExecute)
        break
      case 'executed':
        filtered = transactions.filter(tx => tx.executed)
        break
      case 'expired':
        filtered = transactions.filter(tx => tx.isExpired)
        break
      default:
        filtered = transactions
    }

    // Apply sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.submissionTime - b.submissionTime)
        break
      case 'amount':
        filtered.sort((a, b) => parseFloat(formatEther(BigInt(b.value))) - parseFloat(formatEther(BigInt(a.value))))
        break
      default: // newest
        filtered.sort((a, b) => b.submissionTime - a.submissionTime)
    }

    return filtered
  }

  // Get transaction status info
  const getTransactionStatusInfo = (tx) => {
    if (tx.executed) {
      return {
        status: 'Executed',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500',
        icon: CheckCircleIcon
      }
    }
    if (tx.isExpired) {
      return {
        status: 'Expired',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500',
        icon: XCircleIcon
      }
    }
    if (tx.canExecute) {
      return {
        status: 'Ready to Execute',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500',
        icon: PlayIcon
      }
    }
    if (tx.canVote) {
      return {
        status: 'Voting Active',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500',
        icon: ClockIcon
      }
    }
    return {
      status: 'Pending',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500',
      icon: PauseIcon
    }
  }

  // Format time
  const formatTimeRemaining = (timestamp) => {
    const now = Date.now()
    const diff = timestamp - now

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Truncate address
  const truncateAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Handle execute transaction
  const handleExecuteTransaction = async (txId) => {
    if (!isSigner) {
      alert('You must be a signer to execute transactions')
      return
    }

    try {
      console.log('🚀 Executing transaction:', txId)
      await executeTransaction({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'executeTransaction',
        args: [BigInt(txId)]
      })
    } catch (error) {
      console.error('Error executing transaction:', error)
      alert('Failed to execute transaction: ' + error.message)
    }
  }

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (contractAddress && actualTransactionCount !== undefined) {
      loadTransactions()
    }
  }, [contractAddress, actualTransactionCount, address])

  // Refresh after successful execution
  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Transaction executed successfully, reloading data...')
      setTimeout(() => {
        loadTransactions()
        refetchTxCount()
        alert('Transaction executed successfully!')
      }, 2000)
    }
  }, [isSuccess])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading transactions from blockchain...</p>
      </div>
    )
  }

  if (!actualTransactionCount || Number(actualTransactionCount) === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Transactions Yet
        </h3>
        <p className="text-gray-300 mb-6">
          No transactions have been created for this wallet. Create your first transaction to get started.
        </p>
        <button 
          onClick={() => window.location.hash = '#create'}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Create First Transaction
        </button>
      </div>
    )
  }

  const filteredTransactions = filteredAndSortedTransactions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Transaction History
        </h2>
        <p className="text-gray-300">
          View and manage all wallet transactions ({Number(actualTransactionCount)} total)
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-400">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 text-sm">
        <h4 className="text-blue-400 font-medium mb-2">Transaction List Debug:</h4>
        <div className="text-blue-300 space-y-1">
          <div>Contract: {contractAddress}</div>
          <div>Actual Transaction Count: {Number(actualTransactionCount || 0)}</div>
          <div>Loaded Transactions: {transactions.length}</div>
          <div>Filtered Transactions: {filteredTransactions.length}</div>
          <div>Required Signatures: {Number(actualRequiredSignatures || requiredSignatures || 0)}</div>
          <div>User Address: {address}</div>
          <div>Is Signer: {isSigner ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/10 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium">Filter:</span>
            {[
              { key: 'all', label: 'All', count: transactions.length },
              { key: 'pending', label: 'Pending', count: transactions.filter(tx => !tx.executed && tx.canVote).length },
              { key: 'executable', label: 'Executable', count: transactions.filter(tx => !tx.executed && tx.canExecute).length },
              { key: 'executed', label: 'Executed', count: transactions.filter(tx => tx.executed).length },
              { key: 'expired', label: 'Expired', count: transactions.filter(tx => tx.isExpired).length }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === filterOption.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>

          {/* Sort & Refresh */}
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest" className="bg-gray-800">Newest First</option>
              <option value="oldest" className="bg-gray-800">Oldest First</option>
              <option value="amount" className="bg-gray-800">Highest Amount</option>
            </select>
            
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{transactions.length}</div>
            <div className="text-gray-300 text-sm">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {transactions.filter(tx => !tx.executed && tx.canVote).length}
            </div>
            <div className="text-gray-300 text-sm">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {transactions.filter(tx => !tx.executed && tx.canExecute).length}
            </div>
            <div className="text-gray-300 text-sm">Executable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {transactions.filter(tx => tx.executed).length}
            </div>
            <div className="text-gray-300 text-sm">Executed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {transactions.filter(tx => tx.isExpired).length}
            </div>
            <div className="text-gray-300 text-sm">Expired</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-lg">
            <InformationCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-300">No transactions match the current filter</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const statusInfo = getTransactionStatusInfo(tx)
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={tx.id}
                className="bg-white/10 rounded-lg p-6 border-2 border-transparent hover:border-white/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        #{tx.id}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          Transaction #{tx.id}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} border flex items-center space-x-1`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{statusInfo.status}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">To:</span>
                          <div className="text-white font-mono">{truncateAddress(tx.to)}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <div className="text-white font-bold">{parseFloat(formatEther(BigInt(tx.value))).toFixed(4)} ETH</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Submitted:</span>
                          <div className="text-white">{new Date(tx.submissionTime).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white mb-1">
                      {parseFloat(formatEther(BigInt(tx.value))).toFixed(4)} ETH
                    </div>
                    {tx.deadline && (
                      <div className="text-gray-400 text-sm">
                        Expires: {formatTimeRemaining(tx.deadline)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm font-medium">Voting Progress</span>
                    <span className="text-gray-400 text-sm">
                      {tx.yesVotes + tx.noVotes} / {Number(actualRequiredSignatures || requiredSignatures || 2)} votes
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium">{tx.yesVotes} Yes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-400 font-medium">{tx.noVotes} No</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      ({Number(actualRequiredSignatures || requiredSignatures || 2)} required)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (tx.yesVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100)}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${Math.min(100 - (tx.yesVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100, (tx.noVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setSelectedTx(tx)
                        setShowDetails(true)
                      }}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors flex items-center space-x-1"
                    >
                      <InformationCircleIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {tx.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                        <span>View on Explorer</span>
                      </a>
                    )}
                  </div>

                  {/* Execute Button */}
                  {isSigner && tx.canExecute && !tx.executed && (
                    <button
                      onClick={() => handleExecuteTransaction(tx.id)}
                      disabled={isExecuteLoading || isWaitingForTx}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {(isExecuteLoading || isWaitingForTx) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4" />
                          <span>Execute</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Transaction #{selectedTx.id} Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-white">#{selectedTx.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">To:</span>
                        <span className="text-white font-mono">{truncateAddress(selectedTx.to)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span className="text-white font-bold">{parseFloat(formatEther(BigInt(selectedTx.value))).toFixed(4)} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={getTransactionStatusInfo(selectedTx).color}>
                          {getTransactionStatusInfo(selectedTx).status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitter:</span>
                        <span className="text-white font-mono text-xs">
                          {selectedTx.submitter !== 'Unknown' ? truncateAddress(selectedTx.submitter) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Timing</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Submitted:</span>
                        <span className="text-white">{new Date(selectedTx.submissionTime).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Deadline:</span>
                        <span className="text-white">{new Date(selectedTx.deadline).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Time Left:</span>
                        <span className="text-white">{formatTimeRemaining(selectedTx.deadline)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Voting Time Left:</span>
                        <span className="text-white">{formatTimeRemaining(Date.now() + selectedTx.votingTimeLeft * 1000)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Voting Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{selectedTx.yesVotes}</div>
                      <div className="text-gray-400 text-sm">Yes Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">{selectedTx.noVotes}</div>
                      <div className="text-gray-400 text-sm">No Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{Number(actualRequiredSignatures || requiredSignatures || 2)}</div>
                      <div className="text-gray-400 text-sm">Required</div>
                    </div>
                  </div>
                  
                  {/* Detailed Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${Math.min(100, (selectedTx.yesVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100)}%` }}
                      >
                        {selectedTx.yesVotes > 0 && selectedTx.yesVotes}
                      </div>
                      <div 
                        className="bg-red-500 transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${Math.min(100 - (selectedTx.yesVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100, (selectedTx.noVotes / Number(actualRequiredSignatures || requiredSignatures || 2)) * 100)}%` }}
                      >
                        {selectedTx.noVotes > 0 && selectedTx.noVotes}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Execution Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Can Vote:</span>
                      <span className={selectedTx.canVote ? 'text-green-400' : 'text-red-400'}>
                        {selectedTx.canVote ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Can Execute:</span>
                      <span className={selectedTx.canExecute ? 'text-green-400' : 'text-red-400'}>
                        {selectedTx.canExecute ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Is Expired:</span>
                      <span className={selectedTx.isExpired ? 'text-red-400' : 'text-green-400'}>
                        {selectedTx.isExpired ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Executed:</span>
                      <span className={selectedTx.executed ? 'text-green-400' : 'text-yellow-400'}>
                        {selectedTx.executed ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTx.hasVoted && (
                  <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium mb-2">Your Vote</h4>
                    <div className={`flex items-center text-lg font-bold ${
                      selectedTx.userVote ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedTx.userVote ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span>YES</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          <span>NO</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedTx.data && selectedTx.data !== '0x' && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Transaction Data</h4>
                    <div className="bg-gray-900 rounded p-3 font-mono text-sm text-green-400 break-all max-h-32 overflow-y-auto">
                      {selectedTx.data}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      Contract call data (if any)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedTx.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${selectedTx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View on Etherscan
                  </a>
                )}
                {isSigner && selectedTx.canExecute && !selectedTx.executed && (
                  <button
                    onClick={() => {
                      setShowDetails(false)
                      handleExecuteTransaction(selectedTx.id)
                    }}
                    disabled={isExecuteLoading || isWaitingForTx}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <PlayIcon className="h-4 w-4" />
                    <span>Execute Transaction</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}