import { useContractRead } from 'wagmi';

export default function TransactionList({ contractAddress, transactionCount }) {
    const { data: transactions } = useContractRead({
        address: contractAddress,
        abi: CONTRACT_ABI,
        functionName: 'getTransaction',
        args: [0], // Contoh untuk txId 0
        enabled: transactionCount > 0,
    });

    return (
        <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
                Recent Transactions ({transactionCount})
            </h3>
            {transactions && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/10 rounded-lg">
                        <div>
                            <p className="font-medium">To: {transactions.to}</p>
                            <p className="text-sm text-gray-400">
                                Value: {formatEther(transactions.value)} ETH
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                            transactions.executed 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                            {transactions.executed ? 'Executed' : 'Pending'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}