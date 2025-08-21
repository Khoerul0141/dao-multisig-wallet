// frontend/utils/debugHelpers.js - Tools untuk troubleshooting
import { formatErrorMessage } from './contractUtils'

/**
 * Debug utilities untuk troubleshooting masalah dengan DAO MultiSig Wallet
 */

// Storage key untuk debug data
const DEBUG_STORAGE_KEY = 'dao_multisig_debug'

/**
 * Debug logger dengan timestamp dan categorization
 */
export class DebugLogger {
  constructor(enabled = true) {
    this.enabled = enabled
    this.logs = []
    this.maxLogs = 1000
  }

  log(level, category, message, data = null) {
    if (!this.enabled) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data, null, 2)) : null,
      id: Date.now() + Math.random()
    }

    this.logs.push(logEntry)

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with formatting
    const emoji = this.getEmojiForLevel(level)
    const timestamp = new Date().toLocaleTimeString()
    
    console.group(`${emoji} [${timestamp}] ${category.toUpperCase()}`)
    console.log(message)
    if (data) {
      console.log('Data:', data)
    }
    console.groupEnd()

    // Save to localStorage for persistence
    this.saveToStorage()
  }

  getEmojiForLevel(level) {
    const emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      success: '✅',
      debug: '🔍',
      transaction: '📤',
      vote: '🗳️',
      execution: '🚀',
      loading: '⏳'
    }
    return emojis[level] || '📝'
  }

  error(category, message, data) {
    this.log('error', category, message, data)
  }

  warn(category, message, data) {
    this.log('warn', category, message, data)
  }

  info(category, message, data) {
    this.log('info', category, message, data)
  }

  success(category, message, data) {
    this.log('success', category, message, data)
  }

  debug(category, message, data) {
    this.log('debug', category, message, data)
  }

  transaction(message, data) {
    this.log('transaction', 'transaction', message, data)
  }

  vote(message, data) {
    this.log('vote', 'vote', message, data)
  }

  execution(message, data) {
    this.log('execution', 'execution', message, data)
  }

  loading(message, data) {
    this.log('loading', 'loading', message, data)
  }

  saveToStorage() {
    try {
      const debugData = {
        logs: this.logs.slice(-100), // Save last 100 logs
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(debugData))
    } catch (error) {
      console.warn('Could not save debug data to localStorage:', error)
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(DEBUG_STORAGE_KEY)
      if (stored) {
        const debugData = JSON.parse(stored)
        this.logs = debugData.logs || []
        return debugData
      }
    } catch (error) {
      console.warn('Could not load debug data from localStorage:', error)
    }
    return null
  }

  exportLogs() {
    const exportData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.logs
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dao-multisig-debug-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.success('debug', 'Debug logs exported successfully')
  }

  clearLogs() {
    this.logs = []
    localStorage.removeItem(DEBUG_STORAGE_KEY)
    this.info('debug', 'Debug logs cleared')
  }

  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category)
  }

  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level)
  }

  getRecentErrors(limit = 10) {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-limit)
      .reverse()
  }
}

// Global debug logger instance
export const debugLogger = new DebugLogger()

/**
 * Contract state debugger
 */
export class ContractDebugger {
  constructor(contractAddress, logger = debugLogger) {
    this.contractAddress = contractAddress
    this.logger = logger
    this.snapshots = []
  }

  async captureSnapshot(label = 'snapshot') {
    try {
      this.logger.debug('debugger', `Capturing ${label}...`)

      if (!window.ethereum) {
        throw new Error('Ethereum provider not available')
      }

      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const blockNumber = await provider.getBlockNumber()

      // Get contract code
      const code = await provider.getCode(this.contractAddress)
      const hasContract = code !== '0x'

      let contractState = null
      if (hasContract) {
        try {
          const { loadWalletConfig } = await import('./contractUtils')
          contractState = await loadWalletConfig(this.contractAddress)
        } catch (error) {
          this.logger.warn('debugger', 'Could not load contract state', error.message)
        }
      }

      const snapshot = {
        timestamp: new Date().toISOString(),
        label,
        network: {
          name: network.name,
          chainId: Number(network.chainId),
          blockNumber: Number(blockNumber)
        },
        contract: {
          address: this.contractAddress,
          hasCode: hasContract,
          codeSize: hasContract ? (code.length - 2) / 2 : 0,
          state: contractState
        },
        wallet: {
          connected: !!window.ethereum,
          accounts: window.ethereum ? await window.ethereum.request({ method: 'eth_accounts' }) : []
        }
      }

      this.snapshots.push(snapshot)
      this.logger.success('debugger', `Snapshot "${label}" captured`, snapshot)

      return snapshot

    } catch (error) {
      this.logger.error('debugger', `Failed to capture snapshot "${label}"`, error.message)
      throw error
    }
  }

  compareSnapshots(snapshot1, snapshot2) {
    const differences = []

    // Compare network
    if (snapshot1.network.blockNumber !== snapshot2.network.blockNumber) {
      differences.push({
        type: 'network',
        field: 'blockNumber',
        before: snapshot1.network.blockNumber,
        after: snapshot2.network.blockNumber
      })
    }

    // Compare contract state
    if (snapshot1.contract.state && snapshot2.contract.state) {
      const state1 = snapshot1.contract.state
      const state2 = snapshot2.contract.state

      const fields = ['transactionCount', 'requiredSignatures', 'isPaused', 'isSigner']
      for (const field of fields) {
        if (state1[field] !== state2[field]) {
          differences.push({
            type: 'contract',
            field,
            before: state1[field],
            after: state2[field]
          })
        }
      }

      // Compare signers array
      if (JSON.stringify(state1.signers) !== JSON.stringify(state2.signers)) {
        differences.push({
          type: 'contract',
          field: 'signers',
          before: state1.signers,
          after: state2.signers
        })
      }
    }

    return differences
  }

  analyzeTransaction(txHash, expectedChanges = {}) {
    this.logger.info('debugger', `Analyzing transaction: ${txHash}`, expectedChanges)
    
    return {
      hash: txHash,
      expectedChanges,
      timestamp: new Date().toISOString()
    }
  }

  exportSnapshots() {
    const exportData = {
      timestamp: new Date().toISOString(),
      contractAddress: this.contractAddress,
      snapshots: this.snapshots
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contract-snapshots-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    this.logger.success('debugger', 'Contract snapshots exported')
  }
}

/**
 * Transaction flow tracker
 */
export class TransactionFlowTracker {
  constructor(logger = debugLogger) {
    this.logger = logger
    this.flows = new Map()
  }

  startFlow(flowId, description) {
    const flow = {
      id: flowId,
      description,
      startTime: Date.now(),
      steps: [],
      status: 'running'
    }

    this.flows.set(flowId, flow)
    this.logger.info('flow', `Started flow: ${description}`, { flowId })

    return flow
  }

  addStep(flowId, stepName, data = null) {
    const flow = this.flows.get(flowId)
    if (!flow) {
      this.logger.warn('flow', `Flow ${flowId} not found`)
      return
    }

    const step = {
      name: stepName,
      timestamp: Date.now(),
      duration: Date.now() - (flow.steps.length > 0 ? 
        flow.steps[flow.steps.length - 1].timestamp : 
        flow.startTime),
      data
    }

    flow.steps.push(step)
    this.logger.debug('flow', `Step "${stepName}" in flow ${flowId}`, step)
  }

  completeFlow(flowId, result = null) {
    const flow = this.flows.get(flowId)
    if (!flow) {
      this.logger.warn('flow', `Flow ${flowId} not found`)
      return
    }

    flow.endTime = Date.now()
    flow.totalDuration = flow.endTime - flow.startTime
    flow.status = 'completed'
    flow.result = result

    this.logger.success('flow', `Completed flow: ${flow.description}`, {
      flowId,
      duration: flow.totalDuration,
      steps: flow.steps.length,
      result
    })

    return flow
  }

  failFlow(flowId, error) {
    const flow = this.flows.get(flowId)
    if (!flow) {
      this.logger.warn('flow', `Flow ${flowId} not found`)
      return
    }

    flow.endTime = Date.now()
    flow.totalDuration = flow.endTime - flow.startTime
    flow.status = 'failed'
    flow.error = formatErrorMessage(error)

    this.logger.error('flow', `Failed flow: ${flow.description}`, {
      flowId,
      duration: flow.totalDuration,
      steps: flow.steps.length,
      error: flow.error
    })

    return flow
  }

  getFlow(flowId) {
    return this.flows.get(flowId)
  }

  getAllFlows() {
    return Array.from(this.flows.values())
  }

  getFlowStatistics() {
    const flows = this.getAllFlows()
    
    return {
      total: flows.length,
      completed: flows.filter(f => f.status === 'completed').length,
      failed: flows.filter(f => f.status === 'failed').length,
      running: flows.filter(f => f.status === 'running').length,
      averageDuration: flows.filter(f => f.totalDuration).reduce((sum, f) => sum + f.totalDuration, 0) / flows.filter(f => f.totalDuration).length || 0
    }
  }
}

/**
 * Error pattern analyzer
 */
export class ErrorAnalyzer {
  constructor(logger = debugLogger) {
    this.logger = logger
    this.patterns = new Map()
  }

  analyzeError(error, context = {}) {
    const errorString = formatErrorMessage(error)
    const pattern = this.identifyPattern(errorString)
    
    const analysis = {
      timestamp: new Date().toISOString(),
      originalError: error,
      formattedError: errorString,
      pattern,
      context,
      suggestions: this.getSuggestions(pattern, context)
    }

    // Track pattern frequency
    const count = this.patterns.get(pattern) || 0
    this.patterns.set(pattern, count + 1)

    this.logger.error('analyzer', `Error analyzed: ${pattern}`, analysis)

    return analysis
  }

  identifyPattern(errorString) {
    const patterns = {
      'USER_REJECTION': /user rejected|denied by user/i,
      'INSUFFICIENT_FUNDS': /insufficient funds|insufficient balance/i,
      'GAS_ESTIMATION': /gas|out of gas|gas estimation/i,
      'NETWORK_ERROR': /network|connection|timeout/i,
      'CONTRACT_REVERT': /revert|execution reverted/i,
      'NOT_SIGNER': /not a signer|not authorized/i,
      'ALREADY_VOTED': /already voted/i,
      'VOTING_ENDED': /voting ended|voting period/i,
      'CONTRACT_PAUSED': /contract.*paused|paused/i,
      'INVALID_DEADLINE': /invalid deadline|deadline/i,
      'TRANSACTION_EXPIRED': /expired|transaction expired/i,
      'INSUFFICIENT_VOTES': /insufficient votes|not enough votes/i,
      'INVALID_ADDRESS': /invalid.*address|address.*invalid/i,
      'PROVIDER_ERROR': /provider|ethereum.*not.*available/i
    }

    for (const [pattern, regex] of Object.entries(patterns)) {
      if (regex.test(errorString)) {
        return pattern
      }
    }

    return 'UNKNOWN_ERROR'
  }

  getSuggestions(pattern, context) {
    const suggestions = {
      'USER_REJECTION': [
        'User rejected the transaction',
        'Try the operation again if it was accidental',
        'Check wallet popup/notification'
      ],
      'INSUFFICIENT_FUNDS': [
        'Wallet does not have enough ETH for transaction',
        'Check your wallet balance',
        'Consider reducing transaction amount or getting more ETH'
      ],
      'GAS_ESTIMATION': [
        'Gas estimation failed - transaction may revert',
        'Check transaction parameters',
        'Try increasing gas limit manually',
        'Verify contract state allows this operation'
      ],
      'NETWORK_ERROR': [
        'Network connection issue',
        'Check internet connection',
        'Try switching networks and back',
        'Wait and retry the operation'
      ],
      'CONTRACT_REVERT': [
        'Contract rejected the transaction',
        'Check if you meet all requirements (signer status, voting period, etc.)',
        'Verify contract is not paused',
        'Check transaction parameters'
      ],
      'NOT_SIGNER': [
        'You are not authorized as a signer',
        'Connect with a signer wallet',
        'Request to be added as a signer'
      ],
      'ALREADY_VOTED': [
        'You have already voted on this transaction',
        'Check transaction status',
        'Wait for other signers to vote'
      ],
      'VOTING_ENDED': [
        'Voting period has ended for this transaction',
        'Check if transaction can be executed',
        'Look for newer transactions to vote on'
      ],
      'CONTRACT_PAUSED': [
        'Contract is currently paused',
        'Wait for contract to be unpaused',
        'Contact contract administrators'
      ],
      'INVALID_DEADLINE': [
        'Transaction deadline must be in the future',
        'Set a deadline at least 1 hour from now',
        'Check your system clock'
      ],
      'TRANSACTION_EXPIRED': [
        'Transaction deadline has passed',
        'Create a new transaction with future deadline',
        'Check transaction history for status'
      ],
      'INSUFFICIENT_VOTES': [
        'Not enough votes to execute transaction',
        'Wait for more signers to vote',
        'Check voting progress'
      ],
      'INVALID_ADDRESS': [
        'Invalid Ethereum address format',
        'Check address starts with 0x and has 40 characters',
        'Copy address from a trusted source'
      ],
      'PROVIDER_ERROR': [
        'Ethereum provider not available',
        'Install MetaMask or compatible wallet',
        'Check wallet connection',
        'Refresh the page'
      ],
      'UNKNOWN_ERROR': [
        'Unexpected error occurred',
        'Check browser console for more details',
        'Try refreshing the page',
        'Contact support if issue persists'
      ]
    }

    return suggestions[pattern] || suggestions['UNKNOWN_ERROR']
  }

  getPatternStatistics() {
    const total = Array.from(this.patterns.values()).reduce((sum, count) => sum + count, 0)
    const stats = {}

    for (const [pattern, count] of this.patterns.entries()) {
      stats[pattern] = {
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }
    }

    return {
      total,
      patterns: stats,
      mostCommon: this.getMostCommonPattern()
    }
  }

  getMostCommonPattern() {
    let maxCount = 0
    let mostCommon = null

    for (const [pattern, count] of this.patterns.entries()) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = pattern
      }
    }

    return mostCommon
  }
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  constructor(logger = debugLogger) {
    this.logger = logger
    this.metrics = new Map()
    this.timers = new Map()
  }

  startTiming(label) {
    this.timers.set(label, {
      start: performance.now(),
      label
    })
    this.logger.debug('performance', `Started timing: ${label}`)
  }

  endTiming(label) {
    const timer = this.timers.get(label)
    if (!timer) {
      this.logger.warn('performance', `Timer ${label} not found`)
      return null
    }

    const duration = performance.now() - timer.start
    this.timers.delete(label)

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label).push({
      duration,
      timestamp: Date.now()
    })

    this.logger.debug('performance', `Timing completed: ${label}`, { duration: `${duration.toFixed(2)}ms` })

    return duration
  }

  getMetrics(label) {
    const measurements = this.metrics.get(label) || []
    if (measurements.length === 0) {
      return null
    }

    const durations = measurements.map(m => m.duration)
    return {
      count: measurements.length,
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      latest: durations[durations.length - 1]
    }
  }

  getAllMetrics() {
    const result = {}
    for (const [label, measurements] of this.metrics.entries()) {
      result[label] = this.getMetrics(label)
    }
    return result
  }

  clearMetrics() {
    this.metrics.clear()
    this.timers.clear()
    this.logger.info('performance', 'Performance metrics cleared')
  }
}

/**
 * System diagnostics
 */
export async function runSystemDiagnostics(contractAddress) {
  const logger = debugLogger
  logger.info('diagnostics', 'Running system diagnostics...')

  const diagnostics = {
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    wallet: await getWalletInfo(),
    contract: await getContractInfo(contractAddress),
    network: await getNetworkInfo(),
    localStorage: getLocalStorageInfo(),
    errors: logger.getRecentErrors(5)
  }

  logger.success('diagnostics', 'System diagnostics completed', diagnostics)
  return diagnostics
}

function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }
}

async function getWalletInfo() {
  try {
    if (!window.ethereum) {
      return { available: false, error: 'No Ethereum provider found' }
    }

    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    const chainId = await window.ethereum.request({ method: 'eth_chainId' })

    return {
      available: true,
      connected: accounts.length > 0,
      accounts: accounts.length,
      currentAccount: accounts[0] || null,
      chainId: parseInt(chainId, 16),
      provider: window.ethereum.constructor.name || 'Unknown'
    }
  } catch (error) {
    return {
      available: true,
      error: error.message
    }
  }
}

async function getContractInfo(contractAddress) {
  try {
    if (!contractAddress || contractAddress === '0x...') {
      return { valid: false, error: 'Invalid contract address' }
    }

    const { checkContractCompatibility } = await import('./contractUtils')
    const compatibility = await checkContractCompatibility(contractAddress)

    return {
      address: contractAddress,
      ...compatibility
    }
  } catch (error) {
    return {
      address: contractAddress,
      valid: false,
      error: error.message
    }
  }
}

async function getNetworkInfo() {
  try {
    if (!window.ethereum) {
      return { available: false }
    }

    const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    const gasPrice = await provider.getFeeData()

    return {
      available: true,
      name: network.name,
      chainId: Number(network.chainId),
      blockNumber: Number(blockNumber),
      gasPrice: gasPrice.gasPrice ? gasPrice.gasPrice.toString() : null,
      maxFeePerGas: gasPrice.maxFeePerGas ? gasPrice.maxFeePerGas.toString() : null
    }
  } catch (error) {
    return {
      available: false,
      error: error.message
    }
  }
}

function getLocalStorageInfo() {
  try {
    const storageKeys = Object.keys(localStorage)
    const daoKeys = storageKeys.filter(key => key.includes('dao') || key.includes('multisig'))
    
    return {
      available: true,
      totalKeys: storageKeys.length,
      daoRelatedKeys: daoKeys,
      usage: JSON.stringify(localStorage).length,
      hasDebugData: localStorage.getItem(DEBUG_STORAGE_KEY) !== null
    }
  } catch (error) {
    return {
      available: false,
      error: error.message
    }
  }
}

/**
 * Debug panel component data
 */
export function createDebugPanelData() {
  const logger = debugLogger
  const errorAnalyzer = new ErrorAnalyzer(logger)
  const performanceMonitor = new PerformanceMonitor(logger)

  return {
    logs: logger.logs.slice(-50), // Last 50 logs
    errors: logger.getRecentErrors(10),
    errorPatterns: errorAnalyzer.getPatternStatistics(),
    performance: performanceMonitor.getAllMetrics(),
    storage: logger.loadFromStorage(),
    actions: {
      exportLogs: () => logger.exportLogs(),
      clearLogs: () => logger.clearLogs(),
      runDiagnostics: (contractAddress) => runSystemDiagnostics(contractAddress)
    }
  }
}

/**
 * Helper untuk debugging specific issues
 */
export const debugHelpers = {
  // Check if transaction is stuck
  async checkTransactionStuck(txHash) {
    try {
      debugLogger.info('helper', `Checking if transaction ${txHash} is stuck...`)
      
      const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum)
      const tx = await provider.getTransaction(txHash)
      const receipt = await provider.getTransactionReceipt(txHash)
      const currentBlock = await provider.getBlockNumber()

      const result = {
        hash: txHash,
        found: !!tx,
        mined: !!receipt,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        blockNumber: receipt ? receipt.blockNumber : null,
        blocksWaiting: tx && !receipt ? currentBlock - tx.blockNumber : 0,
        gasPrice: tx ? tx.gasPrice.toString() : null,
        nonce: tx ? tx.nonce : null
      }

      debugLogger.success('helper', 'Transaction status checked', result)
      return result

    } catch (error) {
      debugLogger.error('helper', 'Failed to check transaction status', error.message)
      throw error
    }
  },

  // Check if wallet has enough gas
  async checkGasEstimation(contractAddress, functionName, args) {
    try {
      debugLogger.info('helper', `Estimating gas for ${functionName}...`)

      const { createContractInstance } = await import('./contractUtils')
      const { contract, provider } = await createContractInstance(contractAddress)
      const signer = await provider.getSigner()
      const connectedContract = contract.connect(signer)

      const gasEstimate = await connectedContract[functionName].estimateGas(...args)
      const gasPrice = await provider.getFeeData()
      const balance = await provider.getBalance(await signer.getAddress())

      const totalCost = gasEstimate * (gasPrice.gasPrice || gasPrice.maxFeePerGas)

      const result = {
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        totalCost: totalCost.toString(),
        balance: balance.toString(),
        sufficient: balance >= totalCost
      }

      debugLogger.success('helper', 'Gas estimation completed', result)
      return result

    } catch (error) {
      debugLogger.error('helper', 'Gas estimation failed', error.message)
      throw error
    }
  },

  // Validate contract state
  async validateContractState(contractAddress, expectedState = {}) {
    try {
      debugLogger.info('helper', 'Validating contract state...')

      const { loadWalletConfig } = await import('./contractUtils')
      const actualState = await loadWalletConfig(contractAddress)

      const validation = {
        valid: true,
        mismatches: [],
        actual: actualState,
        expected: expectedState
      }

      for (const [key, expectedValue] of Object.entries(expectedState)) {
        if (actualState[key] !== expectedValue) {
          validation.valid = false
          validation.mismatches.push({
            field: key,
            expected: expectedValue,
            actual: actualState[key]
          })
        }
      }

      debugLogger.success('helper', 'Contract state validation completed', validation)
      return validation

    } catch (error) {
      debugLogger.error('helper', 'Contract state validation failed', error.message)
      throw error
    }
  }
}

// Global instances
export const contractDebugger = new ContractDebugger()
export const transactionFlowTracker = new TransactionFlowTracker()
export const errorAnalyzer = new ErrorAnalyzer()
export const performanceMonitor = new PerformanceMonitor()

// Auto-load previous debug data
debugLogger.loadFromStorage()

// Export everything
export default {
  DebugLogger,
  ContractDebugger,
  TransactionFlowTracker,
  ErrorAnalyzer,
  PerformanceMonitor,
  debugLogger,
  contractDebugger,
  transactionFlowTracker,
  errorAnalyzer,
  performanceMonitor,
  runSystemDiagnostics,
  createDebugPanelData,
  debugHelpers
}