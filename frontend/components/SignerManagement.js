// file frontend/components/SignerManagement.js
import { useState, useEffect } from 'react'
import { useContractWrite, useWaitForTransaction, useAccount } from 'wagmi'
import { 
  UserPlusIcon, 
  UserMinusIcon, 
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  KeyIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { CopyToClipboard } from 'react-copy-to-clipboard'

// Contract ABI
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
    "inputs": [{"internalType": "address", "name": "_signer", "type": "address"}],
    "name": "addSigner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_signer", "type": "address"}],
    "name": "removeSigner",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_required", "type": "uint256"}],
    "name": "changeRequiredSignatures",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_duration", "type": "uint256"}],
    "name": "changeProposalDuration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_delay", "type": "uint256"}],
    "name": "changeExecutionDelay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export default function SignerManagement({ contractAddress, signers, isSigner }) {
  const { address } = useAccount()
  
  // State untuk different management modes
  const [activeTab, setActiveTab] = useState('signers') // signers, settings, security
  const [actionType, setActionType] = useState('add') // add, remove
  
  // Form states
  const [newSignerAddress, setNewSignerAddress] = useState('')
  const [removeSignerAddress, setRemoveSignerAddress] = useState('')
  const [newRequiredSignatures, setNewRequiredSignatures] = useState('')
  const [newProposalDuration, setNewProposalDuration] = useState('')
  const [newExecutionDelay, setNewExecutionDelay] = useState('')
  
  // UI states
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Contract write hook
  const { 
    data: submitData, 
    write: submitTransaction, 
    isLoading: isSubmitLoading 
  } = useContractWrite({
    address: contractAddress,
    abi: CONTRACT_ABI,
    functionName: 'submitTransaction',
  })

  // Wait for transaction
  const { isLoading: isWaitingForTx, isSuccess } = useWaitForTransaction({
    hash: submitData?.hash,
  })

  // Management action configurations
  const managementActions = {
    addSigner: {
      title: 'Add New Signer',
      description: 'Add a new authorized signer to the wallet',
      icon: UserPlusIcon,
      color: 'green',
      encodeFunction: (address) => {
        // In real implementation, use contract.interface.encodeFunctionData
        return `0x12345678${address.slice(2)}` // Mock encoded data
      }
    },
    removeSigner: {
      title: 'Remove Signer',
      description: 'Remove an existing signer from the wallet',
      icon: UserMinusIcon,
      color: 'red',
      encodeFunction: (address) => {
        return `0x87654321${address.slice(2)}` // Mock encoded data
      }
    },
    changeRequired: {
      title: 'Change Required Signatures',
      description: 'Modify the number of signatures needed for execution',
      icon: ShieldCheckIcon,
      color: 'blue',
      encodeFunction: (amount) => {
        return `0xabcdef00${amount.toString(16).padStart(64, '0')}` // Mock encoded data
      }
    },
    changeProposalDuration: {
      title: 'Change Proposal Duration',
      description: 'Modify how long voting periods last',
      icon: ClockIcon,
      color: 'yellow',
      encodeFunction: (duration) => {
        return `0xfedcba00${duration.toString(16).padStart(64, '0')}` // Mock encoded data
      }
    },
    changeExecutionDelay: {
      title: 'Change Execution Delay',
      description: 'Modify the delay before execution after voting',
      icon: CogIcon,
      color: 'purple',
      encodeFunction: (delay) => {
        return `0x11223344${delay.toString(16).padStart(64, '0')}` // Mock encoded data
      }
    }
  }

  // Validation functions
  const validateAddress = (addr) => {
    if (!addr || addr === '') {
      return 'Address is required'
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      return 'Invalid address format'
    }
    return null
  }

  const validateRequiredSignatures = (required) => {
    const num = parseInt(required)
    if (isNaN(num) || num < 1) {
      return 'Must be at least 1'
    }
    if (num > signers.length) {
      return 'Cannot exceed current signer count'
    }
    return null
  }

  const validateDuration = (duration) => {
    const num = parseInt(duration)
    if (isNaN(num) || num < 3600) { // 1 hour minimum
      return 'Must be at least 1 hour (3600 seconds)'
    }
    if (num > 30 * 24 * 3600) { // 30 days maximum
      return 'Cannot exceed 30 days'
    }
    return null
  }

  // Handle copy to clipboard
  const handleCopy = (address) => {
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // Truncate address for display
  const truncateAddress = (addr) => {
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`
  }

  // Create proposal for signer management
  const createSignerProposal = async (action, targetAddress) => {
    if (!isSigner) {
      alert('You must be a signer to create proposals')
      return
    }

    const addressError = validateAddress(targetAddress)
    if (addressError) {
      setErrors({ address: addressError })
      return
    }

    if (action === 'add' && signers.includes(targetAddress.toLowerCase())) {
      setErrors({ address: 'Address is already a signer' })
      return
    }

    if (action === 'remove' && !signers.includes(targetAddress.toLowerCase())) {
      setErrors({ address: 'Address is not a current signer' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      const actionKey = action === 'add' ? 'addSigner' : 'removeSigner'
      const encodedData = managementActions[actionKey].encodeFunction(targetAddress)

      await submitTransaction({
        args: [contractAddress, 0, encodedData, deadline]
      })

      setPendingAction({ action, address: targetAddress })
    } catch (error) {
      console.error('Error creating proposal:', error)
      alert('Failed to create proposal: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create settings proposal
  const createSettingsProposal = async (settingType, value) => {
    if (!isSigner) {
      alert('You must be a signer to create proposals')
      return
    }

    let error = null
    if (settingType === 'changeRequired') {
      error = validateRequiredSignatures(value)
    } else if (settingType === 'changeProposalDuration' || settingType === 'changeExecutionDelay') {
      error = validateDuration(value)
    }

    if (error) {
      setErrors({ [settingType]: error })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const deadline = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      const encodedData = managementActions[settingType].encodeFunction(value)

      await submitTransaction({
        args: [contractAddress, 0, encodedData, deadline]
      })

      setPendingAction({ action: settingType, value })
    } catch (error) {
      console.error('Error creating settings proposal:', error)
      alert('Failed to create settings proposal: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form submissions
  const handleAddSigner = (e) => {
    e.preventDefault()
    createSignerProposal('add', newSignerAddress)
  }

  const handleRemoveSigner = (e) => {
    e.preventDefault()
    createSignerProposal('remove', removeSignerAddress)
  }

  const handleRequiredSignaturesChange = (e) => {
    e.preventDefault()
    createSettingsProposal('changeRequired', newRequiredSignatures)
  }

  const handleProposalDurationChange = (e) => {
    e.preventDefault()
    createSettingsProposal('changeProposalDuration', newProposalDuration * 24 * 3600) // Convert days to seconds
  }

  const handleExecutionDelayChange = (e) => {
    e.preventDefault()
    createSettingsProposal('changeExecutionDelay', newExecutionDelay * 3600) // Convert hours to seconds
  }

  // Reset forms after success
  useEffect(() => {
    if (isSuccess) {
      setNewSignerAddress('')
      setRemoveSignerAddress('')
      setNewRequiredSignatures('')
      setNewProposalDuration('')
      setNewExecutionDelay('')
      setErrors({})
      
      if (pendingAction) {
        alert(`Proposal created successfully! Action: ${pendingAction.action}`)
        setPendingAction(null)
      }
    }
  }, [isSuccess, pendingAction])

  if (!isSigner) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Access Denied
        </h3>
        <p className="text-gray-300">
          You must be an authorized signer to access signer management.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Signer Management
        </h2>
        <p className="text-gray-300">
          Manage wallet signers and configuration settings through multi-signature proposals
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/10 rounded-lg p-1 flex space-x-1">
        {[
          { key: 'signers', label: 'Signer Management', icon: KeyIcon },
          { key: 'settings', label: 'Wallet Settings', icon: CogIcon },
          { key: 'security', label: 'Security Overview', icon: ShieldCheckIcon }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'signers' && (
        <div className="space-y-6">
          {/* Current Signers */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Current Signers ({signers.length})
            </h3>
            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    signer.toLowerCase() === address?.toLowerCase()
                      ? 'bg-purple-500/20 border border-purple-500'
                      : 'bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      signer.toLowerCase() === address?.toLowerCase()
                        ? 'bg-purple-500'
                        : 'bg-blue-500'
                    }`}>
                      <span className="text-white text-sm font-medium">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-white font-mono text-sm">
                        {signer}
                      </div>
                      {signer.toLowerCase() === address?.toLowerCase() && (
                        <div className="text-purple-400 text-xs">You</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CopyToClipboard text={signer} onCopy={() => handleCopy(signer)}>
                      <button className="text-gray-400 hover:text-white transition-colors p-1">
                        {copiedAddress === signer ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <DocumentTextIcon className="h-4 w-4" />
                        )}
                      </button>
                    </CopyToClipboard>
                    
                    {signers.length > 3 && signer.toLowerCase() !== address?.toLowerCase() && (
                      <button
                        onClick={() => setRemoveSignerAddress(signer)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Propose removal"
                      >
                        <UserMinusIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Signer */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2 text-green-400" />
              Add New Signer
            </h3>
            <form onSubmit={handleAddSigner} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  New Signer Address
                </label>
                <input
                  type="text"
                  value={newSignerAddress}
                  onChange={(e) => setNewSignerAddress(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.address ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="0x..."
                />
                {errors.address && (
                  <p className="text-red-400 text-sm mt-1">{errors.address}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || isSubmitLoading || isWaitingForTx}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Propose Add Signer
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Remove Signer */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <UserMinusIcon className="h-5 w-5 mr-2 text-red-400" />
              Remove Signer
            </h3>
            <form onSubmit={handleRemoveSigner} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Signer to Remove
                </label>
                <select
                  value={removeSignerAddress}
                  onChange={(e) => setRemoveSignerAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select signer to remove...</option>
                  {signers
                    .filter(signer => signer.toLowerCase() !== address?.toLowerCase() && signers.length > 3)
                    .map((signer, index) => (
                      <option key={index} value={signer} className="bg-gray-800">
                        {truncateAddress(signer)}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-yellow-400 text-sm">
                    Warning: Removing signers requires careful consideration and will require multi-signature approval.
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!removeSignerAddress || isSubmitting || isSubmitLoading || isWaitingForTx || signers.length <= 3}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <UserMinusIcon className="h-4 w-4 mr-2" />
                    Propose Remove Signer
                  </>
                )}
              </button>
              
              {signers.length <= 3 && (
                <p className="text-gray-400 text-sm text-center">
                  Cannot remove signers: Minimum 3 signers required
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Required Signatures */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-400" />
              Required Signatures
            </h3>
            <form onSubmit={handleRequiredSignaturesChange} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  New Required Signatures Count
                </label>
                <input
                  type="number"
                  min="1"
                  max={signers.length}
                  value={newRequiredSignatures}
                  onChange={(e) => setNewRequiredSignatures(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.changeRequired ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter number of required signatures"
                />
                {errors.changeRequired && (
                  <p className="text-red-400 text-sm mt-1">{errors.changeRequired}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Current: 2 signatures required (out of {signers.length} signers)
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!newRequiredSignatures || isSubmitting || isSubmitLoading || isWaitingForTx}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Propose Change Required Signatures
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Proposal Duration */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-yellow-400" />
              Proposal Duration
            </h3>
            <form onSubmit={handleProposalDurationChange} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  New Proposal Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newProposalDuration}
                  onChange={(e) => setNewProposalDuration(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.changeProposalDuration ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter days (1-30)"
                />
                {errors.changeProposalDuration && (
                  <p className="text-red-400 text-sm mt-1">{errors.changeProposalDuration}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Current: 7 days voting period
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!newProposalDuration || isSubmitting || isSubmitLoading || isWaitingForTx}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Propose Change Proposal Duration
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Execution Delay */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CogIcon className="h-5 w-5 mr-2 text-purple-400" />
              Execution Delay
            </h3>
            <form onSubmit={handleExecutionDelayChange} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  New Execution Delay (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168" // 7 days max
                  value={newExecutionDelay}
                  onChange={(e) => setNewExecutionDelay(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.changeExecutionDelay ? 'border-red-500' : 'border-white/30'
                  }`}
                  placeholder="Enter hours (1-168)"
                />
                {errors.changeExecutionDelay && (
                  <p className="text-red-400 text-sm mt-1">{errors.changeExecutionDelay}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  Current: 24 hours delay before execution
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!newExecutionDelay || isSubmitting || isSubmitLoading || isWaitingForTx}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isSubmitting || isSubmitLoading || isWaitingForTx) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <CogIcon className="h-4 w-4 mr-2" />
                    Propose Change Execution Delay
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-400" />
              Security Overview
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Metrics */}
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Signature Requirement</span>
                    <span className="text-white font-bold">2 / {signers.length}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(2 / signers.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">
                    {((2 / signers.length) * 100).toFixed(0)}% consensus required
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Voting Period</span>
                    <span className="text-white font-bold">7 Days</span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Time allowed for all signers to review and vote
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Execution Delay</span>
                    <span className="text-white font-bold">24 Hours</span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Delay before approved transactions can be executed
                  </p>
                </div>
              </div>

              {/* Security Recommendations */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Security Recommendations</h4>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Multi-Signature Protection</p>
                      <p className="text-gray-400 text-xs">
                        Requires multiple approvals for all transactions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Time-Locked Execution</p>
                      <p className="text-gray-400 text-xs">
                        Execution delay prevents immediate unauthorized access
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Regular Security Reviews</p>
                      <p className="text-gray-400 text-xs">
                        Periodically review signer list and requirements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white text-sm font-medium">Emergency Procedures</p>
                      <p className="text-gray-400 text-xs">
                        Have clear processes for compromised signer recovery
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Risk Assessment</h3>
            
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-400 font-medium">Low Risk</span>
                </div>
                <p className="text-green-300 text-sm">
                  Current configuration provides strong multi-signature protection with adequate time delays.
                </p>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-yellow-400 font-medium">Monitor</span>
                </div>
                <p className="text-yellow-300 text-sm">
                  Ensure all signers maintain secure key management practices and monitor for any suspicious activity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
          <span className="text-green-400">
            Management proposal created successfully! It will require multi-signature approval.
          </span>
        </div>
      )}
    </div>
  )
}