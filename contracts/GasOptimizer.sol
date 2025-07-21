// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GasOptimizer
 * @dev Library untuk optimisasi gas dalam operasi multisig wallet
 * @author khoerul
 */
library GasOptimizer {
    
    // Custom errors for gas optimization
    error ArrayLengthMismatch();
    error InvalidUrgencyMultiplier();
    error InvalidSignatureLength();
    error InvalidSignatureRecoveryId();
    error DivisionByZero();
    error InvalidChunkSize();
    error DuplicateAddress();

    // Struct untuk batch transactions
    struct BatchTransaction {
        address to;
        uint256 value;
        bytes data;
    }
    
    // Struct untuk optimized signer data
    struct SignerInfo {
        address signer;
        bool isActive;
        uint256 lastActivity;
    }

    // Constants for gas calculations
    uint256 private constant BASE_GAS = 21000;
    uint256 private constant GAS_PER_BYTE = 16;
    uint256 private constant VALUE_TRANSFER_GAS = 9000;
    uint256 private constant SSTORE_GAS = 20000;
    uint256 private constant BATCH_OVERHEAD = 1000;

    /**
     * @dev Check if addresses in array are unique (optimized version)
     */
    function checkUniqueAddresses(address[] memory addresses) 
        internal 
        pure 
        returns (bool) 
    {
        if (addresses.length <= 1) return true;
        
        // Use assembly for gas optimization
        assembly {
            let length := mload(addresses)
            let dataPtr := add(addresses, 0x20)
            
            // Outer loop
            for { let i := 0 } lt(i, sub(length, 1)) { i := add(i, 1) } {
                let addrI := mload(add(dataPtr, mul(i, 0x20)))
                
                // Inner loop
                for { let j := add(i, 1) } lt(j, length) { j := add(j, 1) } {
                    let addrJ := mload(add(dataPtr, mul(j, 0x20)))
                    if eq(addrI, addrJ) {
                        // Store revert data
                        let ptr := mload(0x40)
                        mstore(ptr, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(add(ptr, 0x04), 0x20)
                        mstore(add(ptr, 0x24), 17)
                        mstore(add(ptr, 0x44), "Duplicate address")
                        revert(ptr, 0x64)
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * @dev Estimate gas for a transaction (enhanced)
     */
    function estimateGas(
        address target,
        uint256 value,
        bytes memory data
    ) 
        internal 
        pure 
        returns (uint256) 
    {
        uint256 gasEstimate = BASE_GAS;
        
        // Add gas for data
        if (data.length > 0) {
            gasEstimate += data.length * GAS_PER_BYTE;
            
            // Additional gas for contract calls
            if (target.code.length > 0) {
                gasEstimate += 25000; // CALL to contract
            }
        }
        
        // Add gas for value transfer
        if (value > 0) {
            gasEstimate += VALUE_TRANSFER_GAS;
        }
        
        return gasEstimate;
    }
    
    /**
     * @dev Estimate gas for batch transactions (optimized)
     */
    function estimateBatchGas(BatchTransaction[] memory transactions)
        internal
        pure
        returns (uint256 totalGas)
    {
        uint256 length = transactions.length;
        
        // Use assembly for gas-efficient loop
        assembly {
            let txPtr := add(transactions, 0x20)
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let txData := add(txPtr, mul(i, 0x60)) // Each struct is 3 * 32 bytes
                let to := mload(txData)
                let value := mload(add(txData, 0x20))
                let dataPtr := mload(add(txData, 0x40))
                let dataLength := mload(dataPtr)
                
                // Base gas calculation
                totalGas := add(totalGas, BASE_GAS)
                
                // Data gas
                totalGas := add(totalGas, mul(dataLength, GAS_PER_BYTE))
                
                // Value transfer gas
                if gt(value, 0) {
                    totalGas := add(totalGas, VALUE_TRANSFER_GAS)
                }
            }
        }
        
        // Add batch processing overhead
        totalGas += length * BATCH_OVERHEAD;
    }
    
    /**
     * @dev Optimize storage by packing address and amount
     */
    function packAddressAndAmount(address addr, uint96 amount)
        internal
        pure
        returns (bytes32)
    {
        return bytes32(uint256(uint160(addr)) | (uint256(amount) << 160));
    }
    
    /**
     * @dev Unpack address and amount from packed data
     */
    function unpackAddressAndAmount(bytes32 packed)
        internal
        pure
        returns (address addr, uint96 amount)
    {
        addr = address(uint160(uint256(packed)));
        amount = uint96(uint256(packed) >> 160);
    }
    
    /**
     * @dev Calculate optimal gas price with EIP-1559 support
     */
    function calculateOptimalGasPrice(
        uint256 baseFee,
        uint256 priorityFee,
        uint256 urgencyMultiplier
    )
        internal
        pure
        returns (uint256)
    {
        if (urgencyMultiplier == 0 || urgencyMultiplier > 10) {
            revert InvalidUrgencyMultiplier();
        }
        
        uint256 maxPriorityFee = priorityFee * urgencyMultiplier;
        return baseFee + maxPriorityFee;
    }
    
    /**
     * @dev Optimized array element removal
     */
    function efficientArrayRemoval(
        address[] storage array,
        address elementToRemove
    )
        internal
        returns (bool found)
    {
        uint256 length = array.length;
        
        for (uint256 i = 0; i < length; i++) {
            if (array[i] == elementToRemove) {
                // Move last element to current position and pop
                array[i] = array[length - 1];
                array.pop();
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Batch verify signatures using assembly (gas optimized)
     */
    function batchVerifySignatures(
        bytes32[] memory hashes,
        bytes[] memory signatures,
        address[] memory signers
    )
        internal
        pure
        returns (bool)
    {
        uint256 length = hashes.length;
        if (length != signatures.length || signatures.length != signers.length) {
            revert ArrayLengthMismatch();
        }
        
        // Use assembly for efficient batch verification
        assembly {
            let hashesPtr := add(hashes, 0x20)
            let signaturesPtr := add(signatures, 0x20)
            let signersPtr := add(signers, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let hash := mload(add(hashesPtr, mul(i, 0x20)))
                let signature := mload(add(signaturesPtr, mul(i, 0x20)))
                let expectedSigner := mload(add(signersPtr, mul(i, 0x20)))
                
                // Verify signature (simplified check)
                let signatureLength := mload(signature)
                if iszero(eq(signatureLength, 65)) {
                    return(0, 0)
                }
            }
        }
        
        return true;
    }
    
    /**
     * @dev Enhanced signature verification with assembly optimization
     */
    function verifySignature(
        bytes32 hash,
        bytes memory signature,
        address expectedSigner
    )
        internal
        pure
        returns (bool)
    {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        // Use assembly for efficient signature parsing
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        if (v != 27 && v != 28) {
            revert InvalidSignatureRecoveryId();
        }
        
        address recoveredSigner = ecrecover(hash, v, r, s);
        return recoveredSigner == expectedSigner && recoveredSigner != address(0);
    }
    
    /**
     * @dev Compress transaction data using RLP-like encoding
     */
    function compressTransactionData(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory data
    )
        internal
        pure
        returns (bytes memory compressed)
    {
        uint256 length = targets.length;
        if (length != values.length || values.length != data.length) {
            revert ArrayLengthMismatch();
        }
        
        // Calculate total size needed
        uint256 totalSize = 32; // Length prefix
        for (uint256 i = 0; i < length; i++) {
            totalSize += 20 + 32 + data[i].length + 32; // address + value + data length + data
        }
        
        compressed = new bytes(totalSize);
        
        assembly {
            let compressedPtr := add(compressed, 0x20)
            mstore(compressedPtr, length) // Store array length
            compressedPtr := add(compressedPtr, 0x20)
            
            let targetsPtr := add(targets, 0x20)
            let valuesPtr := add(values, 0x20)
            let dataPtr := add(data, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                // Store address (20 bytes)
                let target := mload(add(targetsPtr, mul(i, 0x20)))
                mstore(compressedPtr, shl(96, target))
                compressedPtr := add(compressedPtr, 0x14)
                
                // Store value (32 bytes)
                let value := mload(add(valuesPtr, mul(i, 0x20)))
                mstore(compressedPtr, value)
                compressedPtr := add(compressedPtr, 0x20)
                
                // Store data length and data
                let dataItem := mload(add(dataPtr, mul(i, 0x20)))
                let dataLength := mload(dataItem)
                mstore(compressedPtr, dataLength)
                compressedPtr := add(compressedPtr, 0x20)
                
                // Copy data
                let dataItemPtr := add(dataItem, 0x20)
                for { let j := 0 } lt(j, dataLength) { j := add(j, 0x20) } {
                    mstore(add(compressedPtr, j), mload(add(dataItemPtr, j)))
                }
                compressedPtr := add(compressedPtr, dataLength)
            }
        }
    }
    
    /**
     * @dev Decompress transaction data
     */
    function decompressTransactionData(bytes memory compressed)
        internal
        pure
        returns (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory data
        )
    {
        assembly {
            let compressedPtr := add(compressed, 0x20)
            let length := mload(compressedPtr)
            compressedPtr := add(compressedPtr, 0x20)
            
            // Allocate arrays
            targets := mload(0x40)
            mstore(targets, length)
            let targetsPtr := add(targets, 0x20)
            
            values := add(targets, add(0x20, mul(length, 0x20)))
            mstore(values, length)
            let valuesPtr := add(values, 0x20)
            
            data := add(values, add(0x20, mul(length, 0x20)))
            mstore(data, length)
            let dataPtr := add(data, 0x20)
            
            // Update free memory pointer
            mstore(0x40, add(dataPtr, mul(length, 0x20)))
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                // Read address (20 bytes, but stored in 32 bytes slot)
                let target := shr(96, mload(compressedPtr))
                mstore(add(targetsPtr, mul(i, 0x20)), target)
                compressedPtr := add(compressedPtr, 0x14)
                
                // Read value (32 bytes)
                let value := mload(compressedPtr)
                mstore(add(valuesPtr, mul(i, 0x20)), value)
                compressedPtr := add(compressedPtr, 0x20)
                
                // Read data length
                let dataLength := mload(compressedPtr)
                compressedPtr := add(compressedPtr, 0x20)
                
                // Allocate and store data
                let dataItem := mload(0x40)
                mstore(dataItem, dataLength)
                let dataItemPtr := add(dataItem, 0x20)
                mstore(0x40, add(dataItemPtr, dataLength))
                
                // Copy data
                for { let j := 0 } lt(j, dataLength) { j := add(j, 0x20) } {
                    mstore(add(dataItemPtr, j), mload(add(compressedPtr, j)))
                }
                compressedPtr := add(compressedPtr, dataLength)
                
                // Store data pointer in array
                mstore(add(dataPtr, mul(i, 0x20)), dataItem)
            }
        }
    }
    
    /**
     * @dev Calculate storage cost in gas
     */
    function calculateStorageCost(uint256 dataSize)
        internal
        pure
        returns (uint256)
    {
        // SSTORE from zero costs 20,000 gas
        // SSTORE from non-zero costs 5,000 gas
        // Assume worst case (from zero)
        uint256 slots = (dataSize + 31) / 32; // Round up to nearest slot
        return slots * SSTORE_GAS;
    }
    
    /**
     * @dev Find element in array with early termination
     */
    function findInArray(address[] memory array, address target)
        internal
        pure
        returns (bool found, uint256 index)
    {
        assembly {
            let length := mload(array)
            let arrayPtr := add(array, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let element := mload(add(arrayPtr, mul(i, 0x20)))
                if eq(element, target) {
                    found := 1
                    index := i
                    break
                }
            }
        }
    }
    
    /**
     * @dev Gas-efficient approval counting
     */
    function countApprovals(
        mapping(address => bool) storage approvals,
        address[] memory signers
    )
        internal
        view
        returns (uint256 count)
    {
        uint256 length = signers.length;
        for (uint256 i = 0; i < length;) {
            if (approvals[signers[i]]) {
                count++;
            }
            unchecked { ++i; }
        }
    }
    
    /**
     * @dev Bitwise operations for efficient flags
     */
    function setBit(uint256 bitmap, uint256 index)
        internal
        pure
        returns (uint256)
    {
        return bitmap | (1 << index);
    }
    
    function clearBit(uint256 bitmap, uint256 index)
        internal
        pure
        returns (uint256)
    {
        return bitmap & ~(1 << index);
    }
    
    function getBit(uint256 bitmap, uint256 index)
        internal
        pure
        returns (bool)
    {
        return (bitmap & (1 << index)) != 0;
    }
    
    function countSetBits(uint256 bitmap)
        internal
        pure
        returns (uint256 count)
    {
        // Brian Kernighan's algorithm
        while (bitmap != 0) {
            bitmap &= bitmap - 1;
            count++;
        }
    }
    
    /**
     * @dev Calculate percentage with precision (gas optimized)
     */
    function calculatePercentage(
        uint256 numerator,
        uint256 denominator,
        uint256 precision
    )
        internal
        pure
        returns (uint256)
    {
        if (denominator == 0) {
            revert DivisionByZero();
        }
        
        // Use assembly for gas optimization
        assembly {
            let result := div(mul(numerator, exp(10, precision)), denominator)
            return(0, 0)
        }
    }
    
    /**
     * @dev Efficient batch transfer encoding
     */
    function optimizedBatchTransfer(
        address[] memory recipients,
        uint256[] memory amounts
    )
        internal
        pure
        returns (bytes memory callData)
    {
        if (recipients.length != amounts.length) {
            revert ArrayLengthMismatch();
        }
        
        // Create optimized call data for batch transfers
        callData = abi.encodeWithSelector(
            bytes4(keccak256("batchTransfer(address[],uint256[])")),
            recipients,
            amounts
        );
    }
    
    /**
     * @dev Process arrays in chunks for gas efficiency
     */
    function processInChunks(
        address[] memory array,
        uint256 chunkSize
    )
        internal
        pure
        returns (uint256 totalChunks)
    {
        if (chunkSize == 0) {
            revert InvalidChunkSize();
        }
        totalChunks = (array.length + chunkSize - 1) / chunkSize;
    }
    
    /**
     * @dev Efficient hash calculation for arrays
     */
    function efficientHash(
        address[] memory addresses,
        uint256[] memory values
    )
        internal
        pure
        returns (bytes32)
    {
        if (addresses.length != values.length) {
            revert ArrayLengthMismatch();
        }
        
        bytes32 hash;
        assembly {
            let length := mload(addresses)
            hash := keccak256(add(addresses, 0x20), mul(length, 0x20))
            
            let valuesHash := keccak256(add(values, 0x20), mul(length, 0x20))
            hash := keccak256(abi_encode(hash, valuesHash), 0x40)
        }
        hash = keccak256(abi.encode(hash, valuesHash));

        return hash;
    }
    
    /**
     * @dev Calculate voting power with quorum
     */
    function calculateVotingPower(
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalSigners,
        uint256 quorumPercentage
    )
        internal
        pure
        returns (bool hasQuorum, bool isPassing, uint256 participationRate)
    {
        uint256 totalVotes = yesVotes + noVotes;
        participationRate = (totalVotes * 10000) / totalSigners; // Basis points
        
        hasQuorum = participationRate >= quorumPercentage;
        isPassing = yesVotes > noVotes;
    }
    
    /**
     * @dev Optimize struct packing checker
     */
    function checkStructPacking(
        uint256 value1,
        uint256 value2,
        bool flag
    )
        internal
        pure
        returns (bytes32 packed)
    {
        // Pack three values into single storage slot
        assembly {
            packed := or(
                or(
                    and(value1, 0xffffffffffffffffffffffffffffffff), // 128 bits
                    shl(128, and(value2, 0xffffffffffffffffffffffffffffff)) // 120 bits
                ),
                shl(248, flag) // 1 bit
            )
        }
    }
    
    /**
     * @dev Unpack struct data
     */
    function unpackStructData(bytes32 packed)
        internal
        pure
        returns (uint256 value1, uint256 value2, bool flag)
    {
        assembly {
            value1 := and(packed, 0xffffffffffffffffffffffffffffffff)
            value2 := and(shr(128, packed), 0xffffffffffffffffffffffffffffff)
            flag := gt(and(shr(248, packed), 0xff), 0)
        }
    }
    
    /**
     * @dev Memory-efficient array comparison
     */
    function compareArrays(
        address[] memory array1,
        address[] memory array2
    )
        internal
        pure
        returns (bool isEqual)
    {
        if (array1.length != array2.length) {
            return false;
        }
        
        assembly {
            let length := mload(array1)
            let array1Ptr := add(array1, 0x20)
            let array2Ptr := add(array2, 0x20)
            
            isEqual := 1
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                if iszero(eq(mload(add(array1Ptr, mul(i, 0x20))), mload(add(array2Ptr, mul(i, 0x20))))) {
                    isEqual := 0
                    break
                }
            }
        }
    }
    
    /**
     * @dev Calculate time-weighted voting power
     */
    function calculateTimeWeightedVote(
        uint256 voteTime,
        uint256 proposalStart,
        uint256 proposalEnd,
        uint256 baseWeight
    )
        internal
        pure
        returns (uint256 weightedPower)
    {
        if (voteTime < proposalStart || voteTime > proposalEnd) {
            return 0;
        }
        
        uint256 totalDuration = proposalEnd - proposalStart;
        uint256 timeElapsed = voteTime - proposalStart;
        
        // Early voters get more weight
        uint256 timeBonus = ((totalDuration - timeElapsed) * 100) / totalDuration;
        weightedPower = baseWeight + (baseWeight * timeBonus) / 100;
    }
    
    /**
     * @dev Efficient merkle proof verification
     */
    function verifyMerkleProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    )
        internal
        pure
        returns (bool)
    {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
}