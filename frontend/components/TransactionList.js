// file frontend/components/TransactionList.js
import { useState, useEffect } from 'react'
import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
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
  InformationCircleIcon
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
    "inputs": [{"internalType": "uint256", "name": "_txId", "type": "uint256"}],
    "name": "executeTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export default function TransactionList({ contractAddress, transactionCount, requiredSignatures, isSigner }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, executable, executed, expired
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, amount
  const [selectedTx, setSelectedTx] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  // Contract write untuk execute transaction
  const { 
    data: executeData, 
    write: executeTransaction, 
    isLoading: isExecuteLoading 
  } = useContractWrite({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'executeTransaction',
  })

  // Wait for transaction
  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransaction({
    hash: executeData?.hash,
  })

  // Load semua data transaksi
  const loadTransactions = async () => {
    if (!contractAddress || transactionCount === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    const txData = []

    try {
      // Dalam implementasi nyata, Anda akan menggunakan useContractRead untuk setiap transaksi
      // Untuk demo ini, kita akan menggunakan data simulasi
      for (let i = 0; i < transactionCount; i++) {
        // Simulasi data transaksi - ganti dengan pembacaan contract yang sebenarnya
        const tx = {
          id: i,
          to: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
          value: (Math.random() * 10).toFixed(4),
          data: '0x',
          executed: Math.random() > 0.7,
          deadline: Date.now() + (Math.random() * 7 * 24 * 60 * 60 * 1000), // Random dalam 7 hari
          yesVotes: Math.floor(Math.random() * 5),
          noVotes: Math.floor(Math.random() * 2),
          submissionTime: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000),
          canVote: Math.random() > 0.5,
          canExecute: Math.random() > 0.8,
          isExpired: Math.random() > 0.9,
          votingTimeLeft: Math.random() * 7 * 24 * 60 * 60,
          submitter: `0x${Math.random().toString(16).slice(2, 42).padStart(40, '0')}`,
          txHash: Math.random() > 0.5 ? `0x${Math.random().toString(16).slice(2).padStart(64, '0')}` : null
        }
        txData.push(tx)
      }

      setTransactions(txData)
    } catch (error) {
      console.error('Error loading transactions:', error)
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
        filtered.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
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
      await executeTransaction({
        args: [txId]
      })
    } catch (error) {
      console.error('Error executing transaction:', error)
      alert('Failed to execute transaction: ' + error.message)
    }
  }

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadTransactions()
  }, [contractAddress, transactionCount])

  // Refresh after successful execution
  useEffect(() => {
    if (isSuccess) {
      loadTransactions()
      alert('Transaction executed successfully!')
    }
  }, [isSuccess])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading transactions...</p>
      </div>
    )
  }

  if (transactionCount === 0) {
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
          View and manage all wallet transactions ({transactionCount} total)
        </p>
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

          {/* Sort */}
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
                          <div className="text-white font-bold">{tx.value} ETH</div>
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
                      {formatEther(tx.value)} ETH
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
                      {tx.yesVotes + tx.noVotes} / {requiredSignatures} votes
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
                      ({requiredSignatures} required)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-green-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, (tx.yesVotes / requiredSignatures) * 100)}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-300"
                        style={{ width: `${Math.min(100 - (tx.yesVotes / requiredSignatures) * 100, (tx.noVotes / requiredSignatures) * 100)}%` }}
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
                        href={`https://etherscan.io/tx/${tx.txHash}`}
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
                        <span className="text-white font-bold">{selectedTx.value} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={getTransactionStatusInfo(selectedTx).color}>
                          {getTransactionStatusInfo(selectedTx).status}
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
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Voting Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{selectedTx.yesVotes}</div>
                      <div className="text-gray-400 text-sm">Yes Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">{selectedTx.noVotes}</div>
                      <div className="text-gray-400 text-sm">No Votes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{requiredSignatures}</div>
                      <div className="text-gray-400 text-sm">Required</div>
                    </div>
                  </div>
                </div>

                {selectedTx.data && selectedTx.data !== '0x' && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Transaction Data</h4>
                    <div className="bg-gray-900 rounded p-3 font-mono text-sm text-green-400 break-all">
                      {selectedTx.data}
                    </div>
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
                    href={`https://etherscan.io/tx/${selectedTx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}