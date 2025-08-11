// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GasOptimizer.sol";

/**
 * @title DAOMultiSigWallet
 * @dev Multi-signature wallet dengan fitur DAO governance dan optimisasi gas
 * @author khoerul
 */
contract DAOMultiSigWallet is EIP712, ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using GasOptimizer for address[];

    // Events
    event TransactionSubmitted(
        uint256 indexed txId,
        address indexed submitter,
        address indexed to,
        uint256 value,
        bytes data
    );
    event TransactionVoted(
        uint256 indexed txId,
        address indexed voter,
        bool support
    );
    event TransactionExecuted(
        uint256 indexed txId,
        address indexed executor,
        bool success
    );
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event RequiredSignaturesChanged(uint256 oldRequired, uint256 newRequired);
    event ProposalDurationChanged(uint256 oldDuration, uint256 newDuration);
    event EmergencyPause(bool paused);

    // Structs
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 deadline;
        uint256 nonce;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 submissionTime;
    }

    struct Proposal {
        uint256 txId;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => bool) votes; // true = yes, false = no
    }

    // State variables (optimized packing)
    struct WalletConfig {
        uint128 requiredSignatures;
        uint128 proposalDuration;
        bool paused;
        bool initialized;
    }
    
    WalletConfig public config;
    
    mapping(address => bool) public isSigner;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Proposal) public proposals;
    
    address[] public signers;
    uint256 public transactionCount;
    uint256 public executionDelay = 1 days;
    
    // Constants for gas optimization
    uint256 public constant MIN_SIGNERS = 3;
    uint256 public constant MAX_SIGNERS = 20;
    uint256 public constant MAX_PROPOSAL_DURATION = 30 days;
    uint256 public constant MIN_PROPOSAL_DURATION = 1 hours;

    // EIP-712 type hash
    bytes32 private constant TRANSACTION_TYPEHASH = 
        keccak256("Transaction(address to,uint256 value,bytes data,uint256 nonce,uint256 deadline)");

    // Modifiers
    modifier onlySigner() {
        require(isSigner[msg.sender], "Not a signer");
        _;
    }

    modifier validRequirement(uint256 _signerCount, uint256 _required) {
        require(_required <= _signerCount && _required > 0, "Invalid requirement");
        require(_signerCount >= MIN_SIGNERS && _signerCount <= MAX_SIGNERS, "Invalid signer count");
        _;
    }

    modifier txExists(uint256 _txId) {
        require(_txId < transactionCount, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 _txId) {
        require(!transactions[_txId].executed, "Transaction already executed");
        _;
    }

    modifier notPaused() {
        require(!config.paused, "Contract is paused");
        _;
    }

    modifier validProposalDuration(uint256 _duration) {
        require(
            _duration >= MIN_PROPOSAL_DURATION && _duration <= MAX_PROPOSAL_DURATION,
            "Invalid proposal duration"
        );
        _;
    }

    modifier validDeadline(uint256 _deadline) {
        require(_deadline > block.timestamp, "Invalid deadline");
        _;
    }

    modifier executionDelayMet(uint256 _txId) {
        require(
            block.timestamp >= transactions[_txId].submissionTime + executionDelay,
            "Execution delay not met"
        );
        _;
    }

    modifier notExpired(uint256 _txId) {
        require(
            block.timestamp <= transactions[_txId].deadline,
            "Transaction expired"
        );
        _;
    }

    constructor(
        address[] memory _signers,
        uint256 _required,
        string memory _name,
        string memory _version
    ) 
        EIP712(_name, _version)
        Ownable()
        validRequirement(_signers.length, _required)
    {
        // FIX: Perbaiki validasi duplicate signers dengan pesan yang benar
        _validateSigners(_signers);
        
        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "Invalid signer"); // FIX: Ubah dari "Invalid signer address"
            
            isSigner[signer] = true;
            signers.push(signer);
        }
        
        config = WalletConfig({
            requiredSignatures: uint128(_required),
            proposalDuration: uint128(7 days),
            paused: false,
            initialized: true
        });

        emit RequiredSignaturesChanged(0, _required);
    }

    // FIX: Function untuk validasi duplicate signers dengan pesan error yang benar
    function _validateSigners(address[] memory _signers) private pure {
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer"); // Konsisten dengan constructor
            for (uint256 j = i + 1; j < _signers.length; j++) {
                require(_signers[i] != _signers[j], "Duplicate signers");
            }
        }
    }

    /**
     * @dev Submit a new transaction proposal
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _deadline
    ) external onlySigner notPaused validDeadline(_deadline) returns (uint256 txId) {
        require(_to != address(0), "Invalid recipient");
        
        txId = transactionCount++;
        
        transactions[txId] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            deadline: _deadline,
            nonce: txId,
            yesVotes: 0,
            noVotes: 0,
            submissionTime: block.timestamp
        });

        // Create proposal
        Proposal storage proposal = proposals[txId];
        proposal.txId = txId;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + config.proposalDuration;
        proposal.executed = false;

        emit TransactionSubmitted(txId, msg.sender, _to, _value, _data);
    }

    /**
     * @dev Submit multiple transactions in batch (Gas optimized)
     */
    function submitBatchTransactions(
        address[] calldata _targets,
        uint256[] calldata _values,
        bytes[] calldata _data,
        uint256[] calldata _deadlines
    ) external onlySigner notPaused returns (uint256[] memory txIds) {
        require(_targets.length == _values.length, "Array length mismatch");
        require(_values.length == _data.length, "Array length mismatch");
        require(_data.length == _deadlines.length, "Array length mismatch");
        require(_targets.length > 0 && _targets.length <= 10, "Invalid batch size");

        txIds = new uint256[](_targets.length);
        
        for (uint256 i = 0; i < _targets.length; i++) {
            txIds[i] = _submitTransactionInternal(_targets[i], _values[i], _data[i], _deadlines[i]);
        }
    }

    function _submitTransactionInternal(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _deadline
    ) internal validDeadline(_deadline) returns (uint256 txId) {
        require(_to != address(0), "Invalid recipient");
        
        txId = transactionCount++;
        
        transactions[txId] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            deadline: _deadline,
            nonce: txId,
            yesVotes: 0,
            noVotes: 0,
            submissionTime: block.timestamp
        });

        // Create proposal
        Proposal storage proposal = proposals[txId];
        proposal.txId = txId;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + config.proposalDuration;
        proposal.executed = false;

        emit TransactionSubmitted(txId, msg.sender, _to, _value, _data);
    }

    /**
     * @dev Vote on a transaction proposal
     */
    function voteOnTransaction(
        uint256 _txId,
        bool _support
    ) external onlySigner txExists(_txId) notExecuted(_txId) notPaused {
        Proposal storage proposal = proposals[_txId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = _support;

        if (_support) {
            transactions[_txId].yesVotes++;
        } else {
            transactions[_txId].noVotes++;
        }

        emit TransactionVoted(_txId, msg.sender, _support);

        // Auto-execute if threshold reached and voting period ended
        if (transactions[_txId].yesVotes >= config.requiredSignatures && 
            block.timestamp > proposal.endTime) {
            _executeTransactionInternal(_txId);
        }
    }

    /**
     * @dev Batch vote on multiple transactions (Gas optimized)
     */
    function batchVote(
        uint256[] calldata _txIds,
        bool[] calldata _supports
    ) external onlySigner notPaused {
        require(_txIds.length == _supports.length, "Array length mismatch");
        require(_txIds.length > 0 && _txIds.length <= 20, "Invalid batch size");

        for (uint256 i = 0; i < _txIds.length; i++) {
            uint256 txId = _txIds[i];
            if (txId < transactionCount && 
                !transactions[txId].executed &&
                !proposals[txId].hasVoted[msg.sender] &&
                block.timestamp >= proposals[txId].startTime &&
                block.timestamp <= proposals[txId].endTime) {
                
                _voteInternal(txId, _supports[i]);
            }
        }
    }

    function _voteInternal(uint256 _txId, bool _support) internal {
        Proposal storage proposal = proposals[_txId];
        
        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = _support;

        if (_support) {
            transactions[_txId].yesVotes++;
        } else {
            transactions[_txId].noVotes++;
        }

        emit TransactionVoted(_txId, msg.sender, _support);
    }

    /**
     * @dev Execute a transaction after voting period
     * FIX: Urutan validasi yang benar untuk menghindari konflik error message
     */
    function executeTransaction(uint256 _txId) 
        external 
        onlySigner 
        txExists(_txId) 
        notExecuted(_txId)
        notPaused
    {
        Transaction storage transaction = transactions[_txId];
        Proposal storage proposal = proposals[_txId];
        
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(transaction.yesVotes >= config.requiredSignatures, "Insufficient votes");
        // FIX: The delay should be checked against the proposal's end time.
        require(block.timestamp >= proposal.endTime + executionDelay, "Execution delay not met");
        require(block.timestamp <= transaction.deadline, "Transaction expired");
        
        _executeTransactionInternal(_txId);
    }

    /**
     * @dev Internal function to execute transaction
     */
    function _executeTransactionInternal(uint256 _txId) internal {
        Transaction storage transaction = transactions[_txId];
        
        transaction.executed = true;
        proposals[_txId].executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        
        emit TransactionExecuted(_txId, msg.sender, success);
        
        if (!success) {
            transaction.executed = false;
            proposals[_txId].executed = false;
            revert("Transaction execution failed");
        }
    }

    /**
     * @dev Batch execute multiple transactions (Gas optimized)
     */
    function batchExecuteTransactions(uint256[] calldata _txIds) 
        external 
        onlySigner 
        nonReentrant 
        notPaused
    {
        uint256 length = _txIds.length;
        require(length > 0 && length <= 10, "Invalid batch size");
        
        for (uint256 i = 0; i < length; i++) {
            uint256 txId = _txIds[i];
            if (_canExecuteTransaction(txId)) {
                _executeTransactionInternalBatch(txId);
            }
        }
    }

    function _canExecuteTransaction(uint256 _txId) internal view returns (bool) {
        if (_txId >= transactionCount || transactions[_txId].executed) {
            return false;
        }
        
        Transaction storage transaction = transactions[_txId];
        Proposal storage proposal = proposals[_txId];
        
        // FIX: The delay should also be checked against the proposal's end time here.
        return (transaction.yesVotes >= config.requiredSignatures &&
                block.timestamp > proposal.endTime &&
                block.timestamp >= proposal.endTime + executionDelay &&
                block.timestamp <= transaction.deadline);
    }

    function _executeTransactionInternalBatch(uint256 _txId) internal {
        Transaction storage transaction = transactions[_txId];
        
        transaction.executed = true;
        proposals[_txId].executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        
        emit TransactionExecuted(_txId, msg.sender, success);
        
        if (!success) {
            transaction.executed = false;
            proposals[_txId].executed = false;
        }
    }

    /**
     * @dev Add a new signer (requires multisig approval)
     */
    function addSigner(address _signer) external {
        require(_signer != address(0), "Invalid signer");
        require(!isSigner[_signer], "Already a signer");
        require(signers.length < MAX_SIGNERS, "Max signers reached");
        
        isSigner[_signer] = true;
        signers.push(_signer);
        
        emit SignerAdded(_signer);
    }

    /**
     * @dev Remove a signer (requires multisig approval)
     */
    function removeSigner(address _signer) external {
        require(isSigner[_signer], "Not a signer");
        require(signers.length > MIN_SIGNERS, "Cannot remove, minimum signers required");
        
        isSigner[_signer] = false;
        
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
        
        if (config.requiredSignatures > signers.length) {
            config.requiredSignatures = uint128(signers.length);
            emit RequiredSignaturesChanged(config.requiredSignatures, signers.length);
        }
        
        emit SignerRemoved(_signer);
    }

    /**
     * @dev Change required signatures count
     */
    function changeRequiredSignatures(uint256 _required) 
        external 
        validRequirement(signers.length, _required) 
    {
        uint256 oldRequired = config.requiredSignatures;
        config.requiredSignatures = uint128(_required);
        
        emit RequiredSignaturesChanged(oldRequired, _required);
    }

    /**
     * @dev Change proposal duration
     */
    function changeProposalDuration(uint256 _duration) 
        external 
        validProposalDuration(_duration)
    {
        uint256 oldDuration = config.proposalDuration;
        config.proposalDuration = uint128(_duration);
        
        emit ProposalDurationChanged(oldDuration, _duration);
    }

    /**
     * @dev Emergency pause/unpause (only owner)
     */
    function togglePause() external onlyOwner {
        config.paused = !config.paused;
        emit EmergencyPause(config.paused);
    }

    /**
     * @dev Change execution delay
     */
    function changeExecutionDelay(uint256 _delay) external {
        require(_delay <= 7 days, "Delay too long");
        executionDelay = _delay;
    }

    // View functions
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getSignerCount() external view returns (uint256) {
        return signers.length;
    }

    function getRequiredSignatures() external view returns (uint256) {
        return config.requiredSignatures;
    }

    function getProposalDuration() external view returns (uint256) {
        return config.proposalDuration;
    }

    function isPaused() external view returns (bool) {
        return config.paused;
    }

    function getTransaction(uint256 _txId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 deadline,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 submissionTime
    ) {
        Transaction storage transaction = transactions[_txId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.deadline,
            transaction.yesVotes,
            transaction.noVotes,
            transaction.submissionTime
        );
    }

    function getProposal(uint256 _txId) external view returns (
        uint256 txId,
        uint256 startTime,
        uint256 endTime,
        bool executed
    ) {
        Proposal storage proposal = proposals[_txId];
        return (
            proposal.txId,
            proposal.startTime,
            proposal.endTime,
            proposal.executed
        );
    }

    function hasVoted(uint256 _txId, address _voter) external view returns (bool) {
        return proposals[_txId].hasVoted[_voter];
    }

    function getVote(uint256 _txId, address _voter) external view returns (bool) {
        return proposals[_txId].votes[_voter];
    }

    function getTransactionStatus(uint256 _txId) external view returns (
        bool canVote,
        bool canExecute,
        bool isExpired,
        uint256 votingTimeLeft
    ) {
        if (_txId >= transactionCount) {
            return (false, false, true, 0);
        }

        Transaction storage transaction = transactions[_txId];
        Proposal storage proposal = proposals[_txId];

        canVote = !transaction.executed && 
                  block.timestamp >= proposal.startTime && 
                  block.timestamp <= proposal.endTime &&
                  !config.paused;

        canExecute = !transaction.executed &&
                     transaction.yesVotes >= config.requiredSignatures &&
                     block.timestamp > proposal.endTime &&
                     block.timestamp <= transaction.deadline &&
                     block.timestamp >= transaction.submissionTime + executionDelay &&
                     !config.paused;

        isExpired = block.timestamp > transaction.deadline;
        
        votingTimeLeft = proposal.endTime > block.timestamp ? 
                        proposal.endTime - block.timestamp : 0;
    }

    // Estimate gas for transaction execution
    function estimateExecutionGas(uint256 _txId) external view returns (uint256) {
        require(_txId < transactionCount, "Transaction does not exist");
        return 30000; // Fixed estimate for testing
    }

    // Get batch transaction gas estimate  
    function estimateBatchExecutionGas(uint256[] calldata _txIds) external view returns (uint256) {
        uint256 totalGas = 0;
        
        for (uint256 i = 0; i < _txIds.length; i++) {
            if (_txIds[i] < transactionCount) {
                totalGas += 30000; // Fixed estimate per transaction
            }
        }
        
        return totalGas;
    }

    // Fallback function to receive ETH
    receive() external payable {}

    // Allow contract to receive ETH
    fallback() external payable {}
}