// frontend/components/VoteOnTransaction.js - FIXED VERSION dengan contract reads yang benar
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

// Contract ABI - LENGKAP
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

export default function VoteOnTransaction({ contractAddress, transactionCount, isSigner }) {
  const { address } = useAccount()
  
  const [selectedTxIds, setSelectedTxIds] = useState([])
  const [batchVoteMode, setBatchVoteMode] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Contract reads - REAL DATA
  const { data: requiredSignatures } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'getRequiredSignatures',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x...',
    }
  })

  const { data: actualTransactionCount } = useReadContract({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'transactionCount',
    query: {
      enabled: !!contractAddress && contractAddress !== '0x...',
    }
  })

  // Contract writes
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

  // FIXED: Load REAL transactions data from contract
  const loadTransactions = async () => {
    if (!contractAddress || contractAddress === '0x...' || !actualTransactionCount) {
      setLoading(false)
      return
    }

    console.log('🔄 Loading transactions from contract...')
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
          
          // Get transaction details
          const txDetails = await (window.ethereum ? 
            // Use ethers if available
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
            // Fallback to wagmi (might not work for multiple calls)
            Promise.reject(new Error('Ethereum provider not available'))
          )

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
            userVote: txDetails.userVote
          }
          
          console.log(`✅ Transaction ${i} loaded:`, {
            executed: tx.executed,
            yesVotes: tx.yesVotes,
            noVotes: tx.noVotes,
            hasVoted: tx.hasVoted,
            canVote: tx.canVote
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

  // Handle single vote
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

  // Handle batch vote
  const handleBatchVote = async (support) => {
    if (!isSigner) {
      alert('Anda harus menjadi signer untuk voting')
      return
    }

    if (selectedTxIds.length === 0) {
      alert('Pilih minimal satu transaksi untuk batch vote')
      return
    }

    try {
      console.log('🗳️ Batch voting:', { selectedTxIds, support })
      
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

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (contractAddress && actualTransactionCount !== undefined) {
      loadTransactions()
    }
  }, [contractAddress, actualTransactionCount, address])

  // Handle success - RELOAD DATA
  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Vote transaction successful, reloading data...')
      setTimeout(() => {
        loadTransactions() // Reload from contract
        setSelectedTxIds([])
        setError(null)
        alert('Vote berhasil diberikan!')
      }, 2000) // Wait 2 seconds for blockchain to update
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
        <p className="text-gray-300">Loading transactions from blockchain...</p>
      </div>
    )
  }

  if (!actualTransactionCount || Number(actualTransactionCount) === 0) {
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
          Review and vote on pending transaction proposals (Total: {Number(actualTransactionCount)})
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
        <h4 className="text-blue-400 font-medium mb-2">Debug Info:</h4>
        <div className="text-blue-300 space-y-1">
          <div>Contract: {contractAddress}</div>
          <div>Transaction Count: {Number(actualTransactionCount || 0)}</div>
          <div>Connected Address: {address}</div>
          <div>Is Signer: {isSigner ? 'Yes' : 'No'}</div>
          <div>Loaded Transactions: {transactions.length}</div>
          <div>Required Signatures: {Number(requiredSignatures || 0)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/10 rounded-lg p-4 space-y-4">
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
                {filterType} ({transactions.filter(tx => {
                  switch (filterType) {
                    case 'pending': return !tx.executed && tx.canVote
                    case 'executable': return !tx.executed && tx.canExecute
                    case 'expired': return tx.isExpired
                    default: return true
                  }
                }).length})
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Data'}
          </button>
        </div>

        {/* Batch Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="batchMode"
              checked={batchVoteMode}
              onChange={(e) => setBatchVoteMode(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="batchMode" className="text-white text-sm">
              Batch Vote Mode
            </label>
          </div>

          {batchVoteMode && (
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">
                Selected: {selectedTxIds.length}
              </span>
              <button
                onClick={() => handleBatchVote(true)}
                disabled={selectedTxIds.length === 0 || isBatchVoteLoading || isWaitingForTx}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Batch YES
              </button>
              <button
                onClick={() => handleBatchVote(false)}
                disabled={selectedTxIds.length === 0 || isBatchVoteLoading || isWaitingForTx}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Batch NO
              </button>
            </div>
          )}
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
                    {parseFloat(formatEther(BigInt(tx.value))).toFixed(4)} ETH
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
                      / {Number(requiredSignatures || 2)} required
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (tx.yesVotes / Number(requiredSignatures || 2)) * 100)}%` 
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