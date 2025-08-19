// frontend/utils/bigint.js - Utility functions untuk menangani BigInt conversion

/**
 * Safely convert BigInt to Number
 * @param {bigint|number|string} value - Value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number}
 */
export function safeNumber(value, defaultValue = 0) {
  try {
    if (typeof value === 'bigint') {
      // Check if BigInt is within safe integer range
      if (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER) {
        return Number(value)
      }
      // For very large BigInt, we might lose precision but still convert
      return Number(value)
    }
    
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? defaultValue : parsed
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value
    }
    
    return defaultValue
  } catch (error) {
    console.warn('Error converting to number:', error)
    return defaultValue
  }
}

/**
 * Convert value to BigInt safely
 * @param {bigint|number|string} value - Value to convert
 * @param {bigint} defaultValue - Default value if conversion fails
 * @returns {bigint}
 */
export function safeBigInt(value, defaultValue = 0n) {
  try {
    if (typeof value === 'bigint') {
      return value
    }
    
    if (typeof value === 'number') {
      return BigInt(Math.floor(value))
    }
    
    if (typeof value === 'string') {
      // Remove decimal places if present
      const cleanValue = value.split('.')[0]
      return BigInt(cleanValue)
    }
    
    return defaultValue
  } catch (error) {
    console.warn('Error converting to BigInt:', error)
    return defaultValue
  }
}

/**
 * Calculate percentage safely
 * @param {bigint|number} numerator 
 * @param {bigint|number} denominator 
 * @param {number} precision - Decimal places
 * @returns {number}
 */
export function safePercentage(numerator, denominator, precision = 2) {
  try {
    const num = safeNumber(numerator)
    const denom = safeNumber(denominator)
    
    if (denom === 0) return 0
    
    const percentage = (num / denom) * 100
    return parseFloat(percentage.toFixed(precision))
  } catch (error) {
    console.warn('Error calculating percentage:', error)
    return 0
  }
}

/**
 * Format voting progress for display
 * @param {bigint|number} yesVotes 
 * @param {bigint|number} noVotes 
 * @param {bigint|number} required 
 * @returns {object}
 */
export function formatVotingProgress(yesVotes, noVotes, required) {
  const yes = safeNumber(yesVotes)
  const no = safeNumber(noVotes)
  const req = safeNumber(required, 1)
  
  const total = yes + no
  const yesPercentage = safePercentage(yes, req)
  const noPercentage = safePercentage(no, req)
  const totalPercentage = safePercentage(total, req)
  
  return {
    yesVotes: yes,
    noVotes: no,
    totalVotes: total,
    required: req,
    yesPercentage: Math.min(100, yesPercentage),
    noPercentage: Math.min(100, noPercentage),
    totalPercentage: Math.min(100, totalPercentage),
    hasQuorum: yes >= req,
    canExecute: yes >= req && total > 0
  }
}

/**
 * Format timestamp safely
 * @param {bigint|number} timestamp 
 * @returns {Date}
 */
export function safeTimestamp(timestamp) {
  try {
    const num = safeNumber(timestamp)
    // If timestamp is in seconds, convert to milliseconds
    const ms = num < 1e12 ? num * 1000 : num
    return new Date(ms)
  } catch (error) {
    console.warn('Error converting timestamp:', error)
    return new Date()
  }
}

/**
 * Format time remaining
 * @param {bigint|number} endTimestamp 
 * @returns {string}
 */
export function formatTimeRemaining(endTimestamp) {
  try {
    const end = safeTimestamp(endTimestamp)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m`
    return `${seconds}s`
  } catch (error) {
    console.warn('Error formatting time:', error)
    return 'Unknown'
  }
}

/**
 * Safe array length
 * @param {Array|undefined|null} array 
 * @returns {number}
 */
export function safeArrayLength(array) {
  return Array.isArray(array) ? array.length : 0
}

/**
 * Convert contract read results to safe numbers
 * @param {object} contractData 
 * @returns {object}
 */
export function sanitizeContractData(contractData) {
  if (!contractData || typeof contractData !== 'object') {
    return {}
  }
  
  const sanitized = {}
  
  Object.entries(contractData).forEach(([key, value]) => {
    if (typeof value === 'bigint') {
      sanitized[key] = safeNumber(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'bigint' ? safeNumber(item) : item
      )
    } else {
      sanitized[key] = value
    }
  })
  
  return sanitized
}

// Default export dengan semua utilities
export default {
  safeNumber,
  safeBigInt,
  safePercentage,
  formatVotingProgress,
  safeTimestamp,
  formatTimeRemaining,
  safeArrayLength,
  sanitizeContractData
}