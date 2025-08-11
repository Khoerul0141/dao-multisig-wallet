// file frontend/components/CreateTransaction.js - COMPLETE VERSION with Wagmi v2 hooks
import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { 
  PlusIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Contract ABI - hanya fungsi yang dibutuhkan
const CONTRACT_ABI = [
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
      {"internalType": "address[]", "name": "_targets", "type": "address[]"},
      {"internalType": "uint256[]", "name": "_values", "type": "uint256[]"},
      {"internalType": "bytes[]", "name": "_data", "type": "bytes[]"},
      {"internalType": "uint256[]", "name": "_deadlines", "type": "uint256[]"}
    ],
    "name": "submitBatchTransactions",
    "outputs": [{"internalType": "uint256[]", "name": "txIds", "type": "uint256[]"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export default function CreateTransaction({ contractAddress, isSigner }) {
  const { address } = useAccount()
  
  // State untuk form single transaction
  const [formData, setFormData] = useState({
    to: '',
    value: '',
    data: '0x',
    deadline: ''
  })

  // State untuk batch transactions
  const [batchMode, setBatchMode] = useState(false)
  const [batchTransactions, setBatchTransactions] = useState([
    { to: '', value: '', data: '0x', deadline: '' }
  ])

  // State untuk UI
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [presetTemplate, setPresetTemplate] = useState('')

  // Contract write hooks - Updated for Wagmi v2
  const { 
    data: submitTxHash, 
    writeContract: submitTransaction, 
    isPending: isSubmitLoading,
    error: submitError
  } = useWriteContract()

  const { 
    data: batchSubmitTxHash, 
    writeContract: submitBatchTransactions, 
    isPending: isBatchSubmitLoading,
    error: batchSubmitError
  } = useWriteContract()

  // Wait for transaction - Updated for Wagmi v2
  const { 
    isLoading: isWaitingForTx, 
    isSuccess,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash: submitTxHash || batchSubmitTxHash,
  })

  // Preset templates untuk transaksi umum
  const transactionTemplates = {
    'eth-transfer': {
      name: 'ETH Transfer',
      description: 'Transfer ETH ke alamat lain',
      data: '0x'
    },
    'add-signer': {
      name: 'Add Signer',
      description: 'Menambah signer baru ke wallet',
      data: '0x'
    },
    'remove-signer': {
      name: 'Remove Signer',
      description: 'Menghapus signer dari wallet',
      data: '0x'
    },
    'change-requirement': {
      name: 'Change Requirement',
      description: 'Mengubah jumlah signature yang diperlukan',
      data: '0x'
    }
  }

  // Validasi form
  const validateForm = (data) => {
    const newErrors = {}
    
    if (!data.to || data.to === '') {
      newErrors.to = 'Alamat tujuan harus diisi'
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(data.to)) {
      newErrors.to = 'Format alamat tidak valid'
    }

    if (!data.value || data.value === '') {
      newErrors.value = 'Jumlah ETH harus diisi'
    } else if (isNaN(parseFloat(data.value)) || parseFloat(data.value) < 0) {
      newErrors.value = 'Jumlah ETH harus berupa angka positif'
    }

    if (!data.deadline || data.deadline === '') {
      newErrors.deadline = 'Deadline harus diisi'
    } else {
      const deadlineDate = new Date(data.deadline)
      const now = new Date()
      if (deadlineDate <= now) {
        newErrors.deadline = 'Deadline harus di masa depan'
      }
    }

    return newErrors
  }

  // Handle form change
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error saat user mengetik
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  // Handle batch transaction change
  const handleBatchChange = (index, field, value) => {
    setBatchTransactions(prev => {
      const newBatch = [...prev]
      newBatch[index] = {
        ...newBatch[index],
        [field]: value
      }
      return newBatch
    })
  }

  // Add batch transaction
  const addBatchTransaction = () => {
    setBatchTransactions(prev => [
      ...prev,
      { to: '', value: '', data: '0x', deadline: '' }
    ])
  }

  // Remove batch transaction
  const removeBatchTransaction = (index) => {
    setBatchTransactions(prev => prev.filter((_, i) => i !== index))
  }

  // Apply template
  const applyTemplate = (templateKey) => {
    const template = transactionTemplates[templateKey]
    if (!template) return

    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 7) // 7 hari dari sekarang

    setFormData(prev => ({
      ...prev,
      data: template.data,
      deadline: defaultDeadline.toISOString().slice(0, 16)
    }))
    setPresetTemplate(templateKey)
  }

  // Handle submit single transaction - Updated for Wagmi v2
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isSigner) {
      alert('Anda harus menjadi signer untuk membuat transaksi')
      return
    }

    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    
    try {
      const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000)
      const value = parseEther(formData.value)
      
      await submitTransaction({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'submitTransaction',
        args: [formData.to, value, formData.data, deadline]
      })
    } catch (error) {
      console.error('Error submitting transaction:', error)
      alert('Gagal mengirim transaksi: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle submit batch transactions - Updated for Wagmi v2
  const handleBatchSubmit = async (e) => {
    e.preventDefault()
    
    if (!isSigner) {
      alert('Anda harus menjadi signer untuk membuat transaksi')
      return
    }

    // Validasi semua batch transactions
    let hasErrors = false
    for (let i = 0; i < batchTransactions.length; i++) {
      const validationErrors = validateForm(batchTransactions[i])
      if (Object.keys(validationErrors).length > 0) {
        hasErrors = true
        break
      }
    }

    if (hasErrors) {
      alert('Harap periksa semua field dalam batch transactions')
      return
    }

    setIsSubmitting(true)
    
    try {
      const targets = batchTransactions.map(tx => tx.to)
      const values = batchTransactions.map(tx => parseEther(tx.value))
      const dataArray = batchTransactions.map(tx => tx.data)
      const deadlines = batchTransactions.map(tx => Math.floor(new Date(tx.deadline).getTime() / 1000))
      
      await submitBatchTransactions({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'submitBatchTransactions',
        args: [targets, values, dataArray, deadlines]
      })
    } catch (error) {
      console.error('Error submitting batch transactions:', error)
      alert('Gagal mengirim batch transaksi: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form setelah sukses
  useEffect(() => {
    if (isSuccess) {
      setFormData({
        to: '',
        value: '',
        data: '0x',
        deadline: ''
      })
      setBatchTransactions([
        { to: '', value: '', data: '0x', deadline: '' }
      ])
      setErrors({})
      setPresetTemplate('')
      alert('Transaksi berhasil dibuat!')
    }
  }, [isSuccess])

  // Set default deadline
  useEffect(() => {
    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 7)
    setFormData(prev => ({
      ...prev,
      deadline: defaultDeadline.toISOString().slice(0, 16)
    }))
  }, [])

  // Handle errors
  useEffect(() => {
    if (submitError || batchSubmitError || receiptError) {
      const error = submitError || batchSubmitError || receiptError
      console.error('Transaction error:', error)
      alert('Error: ' + (error?.message || 'Transaction failed'))
    }
  }, [submitError, batchSubmitError, receiptError])

  if (!isSigner) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Akses Ditolak
        </h3>
        <p className="text-gray-300">
          Anda harus menjadi signer yang terauthorisasi untuk membuat transaksi.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Create New Transaction
        </h2>
        <p className="text-gray-300">
          Submit a new transaction proposal for multi-signature approval
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center space-x-4 bg-white/10 rounded-lg p-4">
        <button
          onClick={() => setBatchMode(false)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            !batchMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Single Transaction
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            batchMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Batch Transactions
        </button>
      </div>

      {!batchMode ? (
        // Single Transaction Form
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Templates */}
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              Quick Templates
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(transactionTemplates).map(([key, template]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyTemplate(key)}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    presetTemplate === key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs opacity-75">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Address */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Recipient Address
            </label>
            <input
              type="text"
              value={formData.to}
              onChange={(e) => handleFormChange('to', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.to ? 'border-red-500' : 'border-white/30'
              }`}
              placeholder="0x..."
            />
            {errors.to && (
              <p className="text-red-400 text-sm mt-1">{errors.to}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Amount (ETH)
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.value}
              onChange={(e) => handleFormChange('value', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.value ? 'border-red-500' : 'border-white/30'
              }`}
              placeholder="0.0"
            />
            {errors.value && (
              <p className="text-red-400 text-sm mt-1">{errors.value}</p>
            )}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              Execution Deadline
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) => handleFormChange('deadline', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.deadline ? 'border-red-500' : 'border-white/30'
              }`}
            />
            {errors.deadline && (
              <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>
            )}
          </div>

          {/* Advanced Options */}
          <div className="bg-white/5 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-white hover:text-purple-300 transition-colors"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Advanced Options
              <span className="ml-auto">{showAdvanced ? '▼' : '▶'}</span>
            </button>
            
            {showAdvanced && (
              <div className="mt-4">
                <label className="block text-white text-sm font-medium mb-2">
                  Transaction Data (Hex)
                </label>
                <textarea
                  value={formData.data}
                  onChange={(e) => handleFormChange('data', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0x"
                  rows={3}
                />
                <p className="text-gray-400 text-xs mt-1">
                  Optional: Contract call data in hexadecimal format
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isSubmitLoading || isWaitingForTx}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isWaitingForTx ? 'Confirming...' : 'Submitting...'}
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5 mr-2" />
                Submit Transaction
              </>
            )}
          </button>
        </form>
      ) : (
        // Batch Transactions Form
        <form onSubmit={handleBatchSubmit} className="space-y-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Batch Transactions ({batchTransactions.length})
              </h3>
              <button
                type="button"
                onClick={addBatchTransaction}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                Add Transaction
              </button>
            </div>

            <div className="space-y-4">
              {batchTransactions.map((tx, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Transaction {index + 1}</h4>
                    {batchTransactions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBatchTransaction(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Recipient
                      </label>
                      <input
                        type="text"
                        value={tx.to}
                        onChange={(e) => handleBatchChange(index, 'to', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="0x..."
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Amount (ETH)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={tx.value}
                        onChange={(e) => handleBatchChange(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="0.0"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Deadline
                      </label>
                      <input
                        type="datetime-local"
                        value={tx.deadline}
                        onChange={(e) => handleBatchChange(index, 'deadline', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-1">
                        Data (Optional)
                      </label>
                      <input
                        type="text"
                        value={tx.data}
                        onChange={(e) => handleBatchChange(index, 'data', e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="0x"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Batch Button */}
          <button
            type="submit"
            disabled={isSubmitting || isBatchSubmitLoading || isWaitingForTx}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {(isSubmitting || isBatchSubmitLoading || isWaitingForTx) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isWaitingForTx ? 'Confirming...' : 'Submitting Batch...'}
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5 mr-2" />
                Submit Batch Transactions ({batchTransactions.length})
              </>
            )}
          </button>
        </form>
      )}

      {/* Status Messages */}
      {isSuccess && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
          <span className="text-green-400">
            Transaction{batchMode ? 's' : ''} successfully submitted!
          </span>
        </div>
      )}
    </div>
  )
}