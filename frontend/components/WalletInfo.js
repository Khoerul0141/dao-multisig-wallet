// file Frontend/Components/WalletInfo.js
import { useState, useEffect } from 'react'
import { useBalance, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

export default function WalletInfo({ 
  contractAddress, 
  signers, 
  requiredSignatures, 
  transactionCount, 
  isSigner 
}) {
  const { address } = useAccount()
  const { data: balance } = useBalance({
    address: contractAddress,
    enabled: contractAddress !== '0x...',
  })

  const [stats, setStats] = useState({
    totalSigners: 0,
    requiredSignatures: 0,
    totalTransactions: 0,
    balance: '0',
    userIsSigner: false,
  })

  const [copiedAddress, setCopiedAddress] = useState(null)

  useEffect(() => {
    setStats({
      totalSigners: signers.length,
      requiredSignatures: requiredSignatures,
      totalTransactions: transactionCount,
      balance: balance ? formatEther(balance.value) : '0',
      userIsSigner: isSigner,
    })
  }, [signers, requiredSignatures, transactionCount, balance, isSigner])

  const handleCopy = (address) => {
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const truncateAddress = (addr) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-gradient-to-r ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Wallet Overview</h2>
        <p className="text-gray-300">
          Monitor your DAO MultiSig Wallet status and statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Balance"
          value={`${parseFloat(stats.balance).toFixed(4)} ETH`}
          icon="💰"
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="Total Signers"
          value={stats.totalSigners}
          icon="👥"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Required Signatures"
          value={stats.requiredSignatures}
          icon="✅"
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon="📋"
          color="from-orange-500 to-orange-600"
        />
        <StatCard
          title="Your Status"
          value={stats.userIsSigner ? "Signer" : "Observer"}
          icon={stats.userIsSigner ? "🔑" : "👁️"}
          color={stats.userIsSigner ? "from-teal-500 to-teal-600" : "from-gray-500 to-gray-600"}
        />
        <StatCard
          title="Security Level"
          value={`${Math.round((stats.requiredSignatures / stats.totalSigners) * 100)}%`}
          icon="🛡️"
          color="from-red-500 to-red-600"
        />
      </div>

      {/* Signers List */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Authorized Signers ({signers.length})
        </h3>
        <div className="space-y-3">
          {signers.map((signer, index) => (
            <div 
              key={index} 
              className={`flex items-center justify-between p-4 rounded-lg ${
                signer.toLowerCase() === address?.toLowerCase() 
                  ? 'bg-purple-500/20 border border-purple-500' 
                  : 'bg-white/5'
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
                <span className="text-white font-mono">
                  {truncateAddress(signer)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {signer.toLowerCase() === address?.toLowerCase() && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                    You
                  </span>
                )}
                
                <CopyToClipboard text={signer} onCopy={() => handleCopy(signer)}>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    {copiedAddress === signer ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    )}
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Address Section */}
      <div className="bg-white/5 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Wallet Contract
        </h3>
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
          <span className="font-mono text-gray-300">
            {truncateAddress(contractAddress)}
          </span>
          <CopyToClipboard text={contractAddress} onCopy={() => handleCopy(contractAddress)}>
            <button className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors">
              {copiedAddress === contractAddress ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </CopyToClipboard>
        </div>
      </div>
    </div>
  )
}