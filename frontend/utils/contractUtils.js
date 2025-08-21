// frontend/utils/contractUtils.js - Enhanced utilities untuk contract interaction
import { ethers } from 'ethers'

/**
 * Enhanced contract utilities untuk mengatasi masalah dengan data loading dan BigInt
 */

// Contract ABI lengkap untuk semua operasi
export const FULL_CONTRACT_ABI = [
  // Read functions
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
    "name": "isPaused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Write functions
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
    "name": "executeTransaction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "txId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "submitter", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"},
      {"indexed": false, "internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "TransactionSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "txId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "voter", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "support", "type": "bool"}
    ],
    "name": "TransactionVoted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "txId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "executor", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "success", "type": "bool"}
    ],
    "name": "TransactionExecuted",
    "type": "event"
  }
]

/**
 * Create contract instance with proper error handling
 */
export async function createContractInstance(contractAddress, abi = FULL_CONTRACT_ABI) {
  if (!window.ethereum) {
    throw new Error('Ethereum provider not available')
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const contract = new ethers.Contract(contractAddress, abi, provider)
  
  return { provider, contract }
}

/**
 * Safely convert BigInt values to numbers
 */
export function safeBigIntToNumber(value, defaultValue = 0) {
  try {
    if (typeof value === 'bigint') {
      if (value <= Number.MAX_SAFE_INTEGER) {
        return Number(value)
      }
      console.warn('BigInt value too large, precision may be lost:', value)
      return Number(value)
    }
    if (typeof value === 'string') {
      return parseInt(value, 10) || defaultValue
    }
    if (typeof value === 'number') {
      return value
    }
    return defaultValue
  } catch (error) {
    console.error('Error converting BigInt to number:', error)
    return defaultValue
  }
}

/**
 * Format timestamp from contract (seconds) to JavaScript Date
 */
export function formatContractTimestamp(timestamp) {
  try {
    const ts = safeBigIntToNumber(timestamp)
    return new Date(ts * 1000)
  } catch (error) {
    console.error('Error formatting timestamp:', error)
    return new Date()
  }
}

/**
 * Load single transaction with full details
 */
export async function loadSingleTransaction(contractAddress, txId, userAddress = null) {
  try {
    console.log(`📋 Loading transaction ${txId} details...`)
    
    const { contract } = await createContractInstance(contractAddress)
    
    // Load all data in parallel
    const [txData, statusData, hasVotedData, voteData] = await Promise.all([
      contract.getTransaction(txId),
      contract.getTransactionStatus(txId),
      userAddress ? contract.hasVoted(txId, userAddress) : Promise.resolve(false),
      userAddress ? contract.getVote(txId, userAddress).catch(() => false) : Promise.resolve(false)
    ])
    
    // Convert to safe format
    const transaction = {
      id: txId,
      to: txData.to,
      value: txData.value.toString(),
      data: txData.data,
      executed: txData.executed,
      deadline: safeBigIntToNumber(txData.deadline) * 1000, // Convert to milliseconds
      yesVotes: safeBigIntToNumber(txData.yesVotes),
      noVotes: safeBigIntToNumber(txData.noVotes),
      submissionTime: safeBigIntToNumber(txData.submissionTime) * 1000,
      canVote: statusData.canVote,
      canExecute: statusData.canExecute,
      isExpired: statusData.isExpired,
      votingTimeLeft: safeBigIntToNumber(statusData.votingTimeLeft),
      hasVoted: hasVotedData,
      userVote: voteData
    }
    
    console.log(`✅ Transaction ${txId} loaded successfully`)
    return transaction
    
  } catch (error) {
    console.error(`❌ Error loading transaction ${txId}:`, error)
    throw error
  }
}

/**
 * Load multiple transactions with proper error handling
 */
export async function loadAllTransactions(contractAddress, userAddress = null, maxRetries = 3) {
  try {
    console.log('🔄 Loading all transactions from contract...')
    
    const { contract } = await createContractInstance(contractAddress)
    
    // Get transaction count
    const txCount = await contract.transactionCount()
    const totalTxs = safeBigIntToNumber(txCount)
    
    console.log(`📊 Total transactions: ${totalTxs}`)
    
    if (totalTxs === 0) {
      return []
    }

    const transactions = []
    const errors = []

    // Load transactions with retry logic
    for (let i = 0; i < totalTxs; i++) {
      let success = false
      let attempts = 0
      
      while (!success && attempts < maxRetries) {
        try {
          const transaction = await loadSingleTransaction(contractAddress, i, userAddress)
          transactions.push(transaction)
          success = true
        } catch (error) {
          attempts++
          console.log(`⚠️ Attempt ${attempts} failed for transaction ${i}:`, error.message)
          
          if (attempts >= maxRetries) {
            errors.push({ txId: i, error: error.message })
            console.error(`❌ Failed to load transaction ${i} after ${maxRetries} attempts`)
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
          }
        }
      }
    }
    
    console.log(`✅ Loaded ${transactions.length}/${totalTxs} transactions`)
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} transactions failed to load:`, errors)
    }
    
    return transactions
    
  } catch (error) {
    console.error('❌ Error loading transactions:', error)
    throw error
  }
}

/**
 * Load wallet configuration and state
 */
export async function loadWalletConfig(contractAddress, userAddress = null) {
  try {
    console.log('📊 Loading wallet configuration...')
    
    const { contract } = await createContractInstance(contractAddress)
    
    const [
      signers,
      requiredSignatures,
      transactionCount,
      isPaused,
      isSigner
    ] = await Promise.all([
      contract.getSigners(),
      contract.getRequiredSignatures(),
      contract.transactionCount(),
      contract.isPaused(),
      userAddress ? contract.isSigner(userAddress) : Promise.resolve(false)
    ])
    
    const config = {
      signers: signers || [],
      requiredSignatures: safeBigIntToNumber(requiredSignatures),
      transactionCount: safeBigIntToNumber(transactionCount),
      isPaused: isPaused || false,
      isSigner: isSigner || false,
      userAddress: userAddress || null
    }
    
    console.log('✅ Wallet configuration loaded:', config)
    return config
    
  } catch (error) {
    console.error('❌ Error loading wallet config:', error)
    throw error
  }
}

/**
 * Enhanced error handler for contract operations
 */
export function handleContractError(error, operation = 'operation') {
  console.error(`❌ Contract ${operation} failed:`, error)
  
  let userMessage = `Failed to ${operation}`
  
  if (error.message) {
    if (error.message.includes('user rejected')) {
      userMessage = 'Transaction was rejected by user'
    } else if (error.message.includes('insufficient funds')) {
      userMessage = 'Insufficient funds for transaction'
    } else if (error.message.includes('gas')) {
      userMessage = 'Gas estimation failed - check transaction parameters'
    } else if (error.message.includes('revert')) {
      userMessage = 'Transaction reverted - check contract conditions'
    } else if (error.message.includes('Not a signer')) {
      userMessage = 'You must be a signer to perform this action'
    } else if (error.message.includes('Already voted')) {
      userMessage = 'You have already voted on this transaction'
    } else if (error.message.includes('Voting ended')) {
      userMessage = 'Voting period has ended for this transaction'
    } else if (error.message.includes('Contract is paused')) {
      userMessage = 'Contract is currently paused'
    } else if (error.message.includes('Invalid deadline')) {
      userMessage = 'Transaction deadline must be in the future'
    } else if (error.message.includes('Transaction expired')) {
      userMessage = 'Transaction has expired and cannot be executed'
    } else if (error.message.includes('Insufficient votes')) {
      userMessage = 'Transaction does not have enough votes to execute'
    } else {
      userMessage = `${operation} failed: ${error.message.split('\n')[0]}`
    }
  }
  
  return {
    error: error,
    userMessage: userMessage,
    technical: error.message || 'Unknown error'
  }
}

/**
 * Validate contract address
 */
export function validateContractAddress(address) {
  if (!address) {
    return { valid: false, error: 'Contract address is required' }
  }
  
  if (address === '0x...' || address === '0x') {
    return { valid: false, error: 'Please enter a valid contract address' }
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: false, error: 'Invalid Ethereum address format' }
  }
  
  return { valid: true, error: null }
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransaction(provider, txHash, timeout = 60000) {
  try {
    console.log(`⏳ Waiting for transaction: ${txHash}`)
    
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash)
        
        if (receipt) {
          if (receipt.status === 1) {
            console.log(`✅ Transaction confirmed: ${txHash}`)
            return { success: true, receipt }
          } else {
            console.log(`❌ Transaction failed: ${txHash}`)
            return { success: false, receipt, error: 'Transaction failed' }
          }
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        if (error.message.includes('not found')) {
          // Transaction not yet mined, continue waiting
          continue
        }
        throw error
      }
    }
    
    throw new Error('Transaction confirmation timeout')
    
  } catch (error) {
    console.error('❌ Error waiting for transaction:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction events for better tracking
 */
export async function getTransactionEvents(contractAddress, txId, eventName = null) {
  try {
    const { contract, provider } = await createContractInstance(contractAddress)
    
    // Get current block for search range
    const currentBlock = await provider.getBlockNumber()
    const fromBlock = Math.max(0, currentBlock - 100000) // Search last 100k blocks
    
    let events = []
    
    if (eventName) {
      // Get specific events
      const filter = contract.filters[eventName](txId)
      events = await contract.queryFilter(filter, fromBlock, currentBlock)
    } else {
      // Get all events related to transaction
      const filters = [
        contract.filters.TransactionSubmitted(txId),
        contract.filters.TransactionVoted(txId),
        contract.filters.TransactionExecuted(txId)
      ]
      
      for (const filter of filters) {
        const filterEvents = await contract.queryFilter(filter, fromBlock, currentBlock)
        events.push(...filterEvents)
      }
    }
    
    // Sort by block number
    events.sort((a, b) => a.blockNumber - b.blockNumber)
    
    console.log(`📋 Found ${events.length} events for transaction ${txId}`)
    return events
    
  } catch (error) {
    console.error('❌ Error getting transaction events:', error)
    return []
  }
}

/**
 * Enhanced transaction submission with validation
 */
export async function submitTransactionSafe(contractAddress, to, value, data, deadline, userAddress) {
  try {
    console.log('📝 Submitting transaction with validation...')
    
    // Validate inputs
    const addressValidation = validateContractAddress(to)
    if (!addressValidation.valid) {
      throw new Error(`Invalid recipient address: ${addressValidation.error}`)
    }
    
    if (new Date(deadline * 1000) <= new Date()) {
      throw new Error('Deadline must be in the future')
    }
    
    const { contract, provider } = await createContractInstance(contractAddress)
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    
    // Check if user is a signer
    const isSigner = await contract.isSigner(userAddress)
    if (!isSigner) {
      throw new Error('You must be a signer to submit transactions')
    }
    
    // Check if contract is paused
    const isPaused = await contract.isPaused()
    if (isPaused) {
      throw new Error('Contract is currently paused')
    }
    
    // Estimate gas
    try {
      const gasEstimate = await connectedContract.submitTransaction.estimateGas(
        to, value, data, deadline
      )
      console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`)
    } catch (gasError) {
      console.warn('⚠️ Gas estimation failed:', gasError.message)
    }
    
    // Submit transaction
    const tx = await connectedContract.submitTransaction(to, value, data, deadline)
    console.log(`📤 Transaction submitted: ${tx.hash}`)
    
    return {
      success: true,
      txHash: tx.hash,
      transaction: tx
    }
    
  } catch (error) {
    const errorInfo = handleContractError(error, 'submit transaction')
    throw new Error(errorInfo.userMessage)
  }
}

/**
 * Enhanced voting with validation
 */
export async function voteOnTransactionSafe(contractAddress, txId, support, userAddress) {
  try {
    console.log(`🗳️ Voting on transaction ${txId}: ${support ? 'YES' : 'NO'}`)
    
    const { contract, provider } = await createContractInstance(contractAddress)
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    
    // Validate user can vote
    const isSigner = await contract.isSigner(userAddress)
    if (!isSigner) {
      throw new Error('You must be a signer to vote')
    }
    
    // Check if already voted
    const hasVoted = await contract.hasVoted(txId, userAddress)
    if (hasVoted) {
      throw new Error('You have already voted on this transaction')
    }
    
    // Check transaction status
    const status = await contract.getTransactionStatus(txId)
    if (!status.canVote) {
      throw new Error('Voting is not available for this transaction')
    }
    
    // Check if contract is paused
    const isPaused = await contract.isPaused()
    if (isPaused) {
      throw new Error('Contract is currently paused')
    }
    
    // Submit vote
    const tx = await connectedContract.voteOnTransaction(txId, support)
    console.log(`📤 Vote submitted: ${tx.hash}`)
    
    return {
      success: true,
      txHash: tx.hash,
      transaction: tx
    }
    
  } catch (error) {
    const errorInfo = handleContractError(error, 'vote')
    throw new Error(errorInfo.userMessage)
  }
}

/**
 * Enhanced transaction execution with validation
 */
export async function executeTransactionSafe(contractAddress, txId, userAddress) {
  try {
    console.log(`🚀 Executing transaction ${txId}`)
    
    const { contract, provider } = await createContractInstance(contractAddress)
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    
    // Validate user can execute
    const isSigner = await contract.isSigner(userAddress)
    if (!isSigner) {
      throw new Error('You must be a signer to execute transactions')
    }
    
    // Check transaction status
    const status = await contract.getTransactionStatus(txId)
    if (!status.canExecute) {
      throw new Error('Transaction is not ready for execution')
    }
    
    // Check if contract is paused
    const isPaused = await contract.isPaused()
    if (isPaused) {
      throw new Error('Contract is currently paused')
    }
    
    // Execute transaction
    const tx = await connectedContract.executeTransaction(txId)
    console.log(`📤 Execution submitted: ${tx.hash}`)
    
    return {
      success: true,
      txHash: tx.hash,
      transaction: tx
    }
    
  } catch (error) {
    const errorInfo = handleContractError(error, 'execute transaction')
    throw new Error(errorInfo.userMessage)
  }
}

/**
 * Enhanced batch voting with validation
 */
export async function batchVoteSafe(contractAddress, txIds, supports, userAddress) {
  try {
    console.log(`🗳️ Batch voting on ${txIds.length} transactions`)
    
    if (txIds.length !== supports.length) {
      throw new Error('Transaction IDs and supports arrays must have the same length')
    }
    
    if (txIds.length === 0) {
      throw new Error('No transactions selected for batch voting')
    }
    
    if (txIds.length > 20) {
      throw new Error('Batch size too large (max 20 transactions)')
    }
    
    const { contract, provider } = await createContractInstance(contractAddress)
    const signer = await provider.getSigner()
    const connectedContract = contract.connect(signer)
    
    // Validate user can vote
    const isSigner = await contract.isSigner(userAddress)
    if (!isSigner) {
      throw new Error('You must be a signer to vote')
    }
    
    // Check if contract is paused
    const isPaused = await contract.isPaused()
    if (isPaused) {
      throw new Error('Contract is currently paused')
    }
    
    // Validate each transaction
    for (const txId of txIds) {
      const hasVoted = await contract.hasVoted(txId, userAddress)
      if (hasVoted) {
        throw new Error(`You have already voted on transaction ${txId}`)
      }
      
      const status = await contract.getTransactionStatus(txId)
      if (!status.canVote) {
        throw new Error(`Voting is not available for transaction ${txId}`)
      }
    }
    
    // Submit batch vote
    const tx = await connectedContract.batchVote(txIds, supports)
    console.log(`📤 Batch vote submitted: ${tx.hash}`)
    
    return {
      success: true,
      txHash: tx.hash,
      transaction: tx
    }
    
  } catch (error) {
    const errorInfo = handleContractError(error, 'batch vote')
    throw new Error(errorInfo.userMessage)
  }
}

/**
 * Format error for user display
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') {
    return error
  }
  
  if (error.userMessage) {
    return error.userMessage
  }
  
  if (error.message) {
    // Clean up common error patterns
    let message = error.message
    
    // Remove technical stack traces
    if (message.includes('\n')) {
      message = message.split('\n')[0]
    }
    
    // Remove function call details
    if (message.includes('(')) {
      const cleanMessage = message.substring(0, message.indexOf('('))
      if (cleanMessage.length > 10) {
        message = cleanMessage
      }
    }
    
    return message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Retry wrapper for contract operations
 */
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`)
      const result = await operation()
      console.log(`✅ Operation succeeded on attempt ${attempt}`)
      return result
    } catch (error) {
      lastError = error
      console.log(`❌ Attempt ${attempt} failed:`, error.message)
      
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} attempts failed`)
  throw lastError
}

/**
 * Check network and contract compatibility
 */
export async function checkContractCompatibility(contractAddress) {
  try {
    console.log('🔍 Checking contract compatibility...')
    
    const { contract, provider } = await createContractInstance(contractAddress)
    
    // Check network
    const network = await provider.getNetwork()
    console.log(`🌐 Connected to network: ${network.name} (${network.chainId})`)
    
    // Check if contract exists
    const code = await provider.getCode(contractAddress)
    if (code === '0x') {
      throw new Error('No contract found at this address')
    }
    
    // Test basic contract functions
    try {
      await contract.getRequiredSignatures()
      await contract.transactionCount()
      console.log('✅ Contract interface compatible')
    } catch (error) {
      throw new Error('Contract interface not compatible: ' + error.message)
    }
    
    return {
      compatible: true,
      network: network.name,
      chainId: Number(network.chainId),
      hasCode: code !== '0x'
    }
    
  } catch (error) {
    console.error('❌ Contract compatibility check failed:', error)
    return {
      compatible: false,
      error: error.message,
      network: null,
      chainId: null,
      hasCode: false
    }
  }
}

// Export all utilities as default object
export default {
  FULL_CONTRACT_ABI,
  createContractInstance,
  safeBigIntToNumber,
  formatContractTimestamp,
  loadSingleTransaction,
  loadAllTransactions,
  loadWalletConfig,
  handleContractError,
  validateContractAddress,
  waitForTransaction,
  getTransactionEvents,
  submitTransactionSafe,
  voteOnTransactionSafe,
  executeTransactionSafe,
  batchVoteSafe,
  formatErrorMessage,
  retryOperation,
  checkContractCompatibility
}