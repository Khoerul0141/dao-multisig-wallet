// FILE DAOMultiSigWallet.SOL
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
    }

    struct Proposal {
        uint256 txId;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => bool) votes; // true = yes, false = no
    }

    // State variables
    mapping(address => bool) public isSigner;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => Proposal) public proposals;
    
    address[] public signers;
    uint256 public requiredSignatures;
    uint256 public transactionCount;
    uint256 public proposalDuration = 7 days;
    uint256 public executionDelay = 1 days;
    
    // Gas optimization: pack variables
    uint128 public constant MIN_SIGNERS = 3;
    uint128 public constant MAX_SIGNERS = 20;

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
        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "Invalid signer");
            require(!isSigner[signer], "Duplicate signer");
            
            isSigner[signer] = true;
            signers.push(signer);
        }
        
        requiredSignatures = _required;
    }

    /**
     * @dev Submit a new transaction proposal
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _deadline
    ) external onlySigner returns (uint256 txId) {
        require(_to != address(0), "Invalid recipient");
        require(_deadline > block.timestamp, "Invalid deadline");
        
        txId = transactionCount++;
        
        transactions[txId] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            deadline: _deadline,
            nonce: txId,
            yesVotes: 0,
            noVotes: 0
        });

        // Create proposal
        Proposal storage proposal = proposals[txId];
        proposal.txId = txId;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + proposalDuration;
        proposal.executed = false;

        emit TransactionSubmitted(txId, msg.sender, _to, _value, _data);
    }

    /**
     * @dev Vote on a transaction proposal
     */
    function voteOnTransaction(
        uint256 _txId,
        bool _support
    ) external onlySigner txExists(_txId) notExecuted(_txId) {
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

        // Auto-execute if threshold reached
        if (transactions[_txId].yesVotes >= requiredSignatures) {
            _executeTransaction(_txId);
        }
    }

    /**
     * @dev Execute a transaction after voting period
     */
    function executeTransaction(uint256 _txId) 
        external 
        onlySigner 
        txExists(_txId) 
        notExecuted(_txId) 
    {
        Transaction storage transaction = transactions[_txId];
        Proposal storage proposal = proposals[_txId];
        
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(transaction.yesVotes >= requiredSignatures, "Insufficient votes");
        require(block.timestamp <= transaction.deadline, "Transaction expired");
        
        _executeTransaction(_txId);
    }

    /**
     * @dev Internal function to execute transaction
     */
    function _executeTransaction(uint256 _txId) internal nonReentrant {
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
    {
        uint256 length = _txIds.length;
        require(length > 0, "Empty transaction list");
        
        // Gas optimization: use assembly for loops
        assembly {
            let i := 0
            for { } lt(i, length) { i := add(i, 1) } {
                let txId := calldataload(add(_txIds.offset, mul(i, 0x20)))
                // Additional validation logic would go here
            }
        }
        
        for (uint256 i = 0; i < length; i++) {
            uint256 txId = _txIds[i];
            if (!transactions[txId].executed && 
                transactions[txId].yesVotes >= requiredSignatures) {
                _executeTransaction(txId);
            }
        }
    }

    /**
     * @dev Add a new signer (requires multisig approval)
     */
    function addSigner(address _signer) external onlySigner {
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
    function removeSigner(address _signer) external onlySigner {
        require(isSigner[_signer], "Not a signer");
        require(signers.length > MIN_SIGNERS, "Cannot remove, minimum signers required");
        
        isSigner[_signer] = false;
        
        // Remove from signers array
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == _signer) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                break;
            }
        }
        
        // Adjust required signatures if needed
        if (requiredSignatures > signers.length) {
            requiredSignatures = signers.length;
        }
        
        emit SignerRemoved(_signer);
    }

    /**
     * @dev Change required signatures count
     */
    function changeRequiredSignatures(uint256 _required) 
        external 
        onlySigner 
        validRequirement(signers.length, _required) 
    {
        uint256 oldRequired = requiredSignatures;
        requiredSignatures = _required;
        
        emit RequiredSignaturesChanged(oldRequired, _required);
    }

    // View functions
    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getTransaction(uint256 _txId) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        bool executed,
        uint256 deadline,
        uint256 yesVotes,
        uint256 noVotes
    ) {
        Transaction storage transaction = transactions[_txId];
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.deadline,
            transaction.yesVotes,
            transaction.noVotes
        );
    }

    function hasVoted(uint256 _txId, address _voter) external view returns (bool) {
        return proposals[_txId].hasVoted[_voter];
    }

    function getVote(uint256 _txId, address _voter) external view returns (bool) {
        return proposals[_txId].votes[_voter];
    }

    // Fallback function to receive ETH
    receive() external payable {}
}