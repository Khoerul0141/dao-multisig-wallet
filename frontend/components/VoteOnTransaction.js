// file frontend/components/VoteOnTransaction.js - FIXED VERSION untuk Wagmi v2
import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { 
  HandThumbUpIcon, 
  HandThumbDownIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

// Contract ABI
const CONTRACT_ABI = [
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
    "inputs": [
      {"internalType": "uint256[]", "name": "_txIds", "type": "uint256[]"},
      {"internalType": "bool[]", "name": "_supports", "type": "bool[]"}
    ],
    "name": "batchVote",
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
    "inputs": [],
    "name": "getRequiredSignatures",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export default function VoteOnTransaction({ contractAddress, transactionCount, isSigner }) {
  const { address } = useAccount()
  
  const [selectedTxIds, setSelectedTxIds] = useState([])
  const [batchVoteMode, setBatchVoteMode] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all') // all, pending, executable, expired
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Contract reads
  const { data: requiredSignatures } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRequiredSignatures',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x...',
    }
  })

  // Contract writes - FIXED for Wagmi v2
  const { 
    data: voteData, 
    writeContract: writeVoteContract, 
    isPending: isVoteLoading,
    error: voteError 
  } = useWriteContract()

  const { 
    data: batchVoteData, 
    writeContract: writeBatchVoteContract, 
    isPending: isBatchVoteLoading,
    error: batchVoteError 
  } = useWriteContract()

  // Wait for transaction
  const { 
    isLoading: isWaitingForTx, 
    isSuccess,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash: voteData || batchVoteData,
  })

  // Load transactions data
  const loadTransactions = async () => {
    if (!contractAddress || contractAddress === '0x...' || transactionCount === 0) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const txData = []

      for (let i = 0; i < Math.min(transactionCount, 20); i++) { // Limit to 20 for performance
        // Simulate transaction data - in real app, use useReadContract for each transaction
        const tx = {
          id: i,
          to: `0x${'0'.repeat(40)}`,
          value: '1.0',
          data: '0x',
          executed: Math.random() > 0.8,
          deadline: Date.now() + 86400000 * (1 + Math.random() * 7), // 1-8 days
          yesVotes: Math.floor(Math.random() * 3),
          noVotes: Math.floor(Math.random() * 2),
          submissionTime: Date.now() - Math.random() * 86400000 * 3, // Last 3 days
          canVote: Math.random() > 0.3,
          canExecute: Math.random() > 0.7,
          isExpired: Math.random() > 0.9,
          votingTimeLeft: Math.random() * 86400 * 7, // Up to 7 days
          hasVoted: Math.random() > 0.6,
          userVote: Math.random() > 0.5
        }
        txData.push(tx)
      }
      
      setTransactions(txData)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    switch (filter) {
      case 'pending':
        return !tx.executed && tx.canVote
      case 'executable':
        return !tx.executed && tx.canExecute
      case 'expired':
        return tx.isExpired
      default:
        return true
    }
  })

  // Handle single vote - FIXED for Wagmi v2
  const handleVote = async (txId, support) => {
    if (!isSigner) {
      alert('Anda harus menjadi signer untuk voting')
      return
    }

    if (!contractAddress || contractAddress === '0x...') {
      alert('Invalid contract address')
      return
    }

    try {
      console.log('🗳️ Voting on transaction:', { txId, support, contractAddress })
      
      await writeVoteContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'voteOnTransaction',
        args: [BigInt(txId), support]
      })
    } catch (error) {
      console.error('Error voting:', error)
      setError(`Failed to vote: ${error.message}`)
    }
  }

  // Handle batch vote - FIXED for Wagmi v2
  const handleBatchVote = async (support) => {
    if (!isSigner) {
      alert('Anda harus menjadi signer untuk voting')
      return
    }

    if (selectedTxIds.length === 0) {
      alert('Pilih minimal satu transaksi untuk batch vote')
      return
    }

    if (!contractAddress || contractAddress === '0x...') {
      alert('Invalid contract address')
      return
    }

    try {
      console.log('🗳️ Batch voting:', { selectedTxIds, support, contractAddress })
      
      const txIdsBigInt = selectedTxIds.map(id => BigInt(id))
      const supports = Array(selectedTxIds.length).fill(support)
      
      await writeBatchVoteContract({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'batchVote',
        args: [txIdsBigInt, supports]
      })
    } catch (error) {
      console.error('Error batch voting:', error)
      setError(`Failed to batch vote: ${error.message}`)
    }
  }

  // Toggle transaction selection
  const toggleTxSelection = (txId) => {
    setSelectedTxIds(prev => 
      prev.includes(txId) 
        ? prev.filter(id => id !== txId)
        : [...prev, txId]
    )
  }

  // Select all filtered transactions
  const selectAllFiltered = () => {
    const eligibleTxIds = filteredTransactions
      .filter(tx => tx.canVote && !tx.hasVoted)
      .map(tx => tx.id)
    setSelectedTxIds(eligibleTxIds)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedTxIds([])
  }

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Expired'
    
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Get vote status color
  const getVoteStatusColor = (tx) => {
    if (tx.executed) return 'text-green-400'
    if (tx.isExpired) return 'text-red-400'
    if (tx.canExecute) return 'text-blue-400'
    return 'text-yellow-400'
  }

  // Get vote status text
  const getVoteStatusText = (tx) => {
    if (tx.executed) return 'Executed'
    if (tx.isExpired) return 'Expired'
    if (tx.canExecute) return 'Ready to Execute'
    return 'Voting Active'
  }

  // Load data on mount
  useEffect(() => {
    loadTransactions()
  }, [contractAddress, transactionCount])

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      loadTransactions() // Reload data after successful vote
      setSelectedTxIds([])
      setError(null)
      alert('Vote berhasil diberikan!')
    }
  }, [isSuccess])

  // Handle errors
  useEffect(() => {
    if (voteError || batchVoteError || receiptError) {
      const error = voteError || batchVoteError || receiptError
      console.error('Transaction error:', error)
      setError(`Error: ${error.message}`)
    }
  }, [voteError, batchVoteError, receiptError])

  if (!isSigner) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Akses Ditolak
        </h3>
        <p className="text-gray-300">
          Anda harus menjadi signer yang terauthorisasi untuk memberikan vote.
        </p>
      </div>
    )
  }

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
      <div className="text-center py-8">
        <DocumentTextIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No Transactions
        </h3>
        <p className="text-gray-300">
          Belum ada transaksi yang dibuat. Buat transaksi baru untuk mulai voting.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Vote on Transactions
        </h2>
        <p className="text-gray-300">
          Review and vote on pending transaction proposals
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

      {/* Controls */}
      <div className="bg-white/10 rounded-lg p-4 space-y-4">
        {/* Filter & Mode Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">Filter:</span>
            {['all', 'pending', 'executable', 'expired'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors capitalize ${
                  filter === filterType
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setBatchVoteMode(!batchVoteMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                batchVoteMode
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {batchVoteMode ? 'Batch Mode ON' : 'Single Vote Mode'}
            </button>
          </div>
        </div>

        {/* Batch Controls */}
        {batchVoteMode && (
          <div className="border-t border-white/20 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  Selected: {selectedTxIds.length} transaction(s)
                </span>
                <button
                  onClick={selectAllFiltered}
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Select All Eligible
                </button>
                <button
                  onClick={clearSelection}
                  className="text-red-400 hover:text-red-300 text-sm underline"
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBatchVote(true)}
                  disabled={selectedTxIds.length === 0 || isBatchVoteLoading || isWaitingForTx}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {(isBatchVoteLoading || isWaitingForTx) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                  )}
                  Batch YES
                </button>
                <button
                  onClick={() => handleBatchVote(false)}
                  disabled={selectedTxIds.length === 0 || isBatchVoteLoading || isWaitingForTx}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {(isBatchVoteLoading || isWaitingForTx) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                  ) : (
                    <HandThumbDownIcon className="h-4 w-4 mr-1" />
                  )}
                  Batch NO
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-lg">
            <InformationCircleIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-300">No transactions match the current filter</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`bg-white/10 rounded-lg p-6 border-2 transition-all ${
                batchVoteMode && selectedTxIds.includes(tx.id)
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-transparent hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  {/* Batch Mode Checkbox */}
                  {batchVoteMode && tx.canVote && !tx.hasVoted && (
                    <input
                      type="checkbox"
                      checked={selectedTxIds.includes(tx.id)}
                      onChange={() => toggleTxSelection(tx.id)}
                      className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Transaction #{tx.id}
                    </h3>
                    <div className={`text-sm ${getVoteStatusColor(tx)}`}>
                      {getVoteStatusText(tx)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-semibold">
                    {tx.value} ETH
                  </div>
                  <div className="text-gray-400 text-sm">
                    To: {tx.to.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-300 text-sm">Voting Progress</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <HandThumbUpIcon className="h-4 w-4 text-green-400 mr-1" />
                      <span className="text-white font-medium">{tx.yesVotes}</span>
                    </div>
                    <div className="flex items-center">
                      <HandThumbDownIcon className="h-4 w-4 text-red-400 mr-1" />
                      <span className="text-white font-medium">{tx.noVotes}</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                      / {requiredSignatures || 2} required
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (Number(tx.yesVotes) / Number(requiredSignatures || 2)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-300 text-sm">Time Remaining</span>
                  </div>
                  <div className="text-white font-medium">
                    {formatTimeRemaining(tx.votingTimeLeft)}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Deadline: {new Date(tx.deadline).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-300 text-sm">Your Vote</span>
                  </div>
                  {tx.hasVoted ? (
                    <div className={`flex items-center ${
                      tx.userVote ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.userVote ? (
                        <HandThumbUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <HandThumbDownIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="font-medium">
                        {tx.userVote ? 'YES' : 'NO'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Not voted</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!batchVoteMode && tx.canVote && !tx.hasVoted && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleVote(tx.id, true)}
                    disabled={isVoteLoading || isWaitingForTx}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {(isVoteLoading || isWaitingForTx) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <HandThumbUpIcon className="h-4 w-4 mr-2" />
                    )}
                    Vote YES
                  </button>
                  
                  <button
                    onClick={() => handleVote(tx.id, false)}
                    disabled={isVoteLoading || isWaitingForTx}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {(isVoteLoading || isWaitingForTx) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <HandThumbDownIcon className="h-4 w-4 mr-2" />
                    )}
                    Vote NO
                  </button>
                </div>
              )}

              {/* Status Messages */}
              {tx.hasVoted && (
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-3 flex items-center mt-4">
                  <CheckCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-blue-400">
                    You have already voted {tx.userVote ? 'YES' : 'NO'} on this transaction
                  </span>
                </div>
              )}

              {tx.isExpired && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-center mt-4">
                  <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-400">
                    This transaction has expired and can no longer be voted on
                  </span>
                </div>
              )}

              {tx.canExecute && (
                <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 flex items-center mt-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-400">
                    This transaction has sufficient votes and can be executed
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Voting Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {transactions.filter(tx => !tx.executed && tx.canVote).length}
            </div>
            <div className="text-gray-300 text-sm">Pending Votes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {transactions.filter(tx => tx.canExecute).length}
            </div>
            <div className="text-gray-300 text-sm">Ready to Execute</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
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

      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
          <span className="text-green-400">
            Vote submitted successfully!
          </span>
        </div>
      )}
    </div>
  )
}