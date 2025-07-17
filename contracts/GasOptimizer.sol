// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library GasOptimizer {
    
    // Struct untuk batch transactions
    struct BatchTransaction {
        address to;
        uint256 value;
        bytes data;
    }
    
    // Check if addresses in array are unique
    function checkUniqueAddresses(address[] memory addresses) 
        internal 
        pure 
        returns (bool) 
    {
        if (addresses.length <= 1) return true;
        
        for (uint256 i = 0; i < addresses.length - 1; i++) {
            for (uint256 j = i + 1; j < addresses.length; j++) {
                if (addresses[i] == addresses[j]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Estimate gas for a transaction
    function estimateGas(
        address /* target */,
        uint256 value,
        bytes memory data
    ) 
        internal 
        pure 
        returns (uint256) 
    {
        // Basic gas estimation
        uint256 baseGas = 21000; // Base transaction cost
        uint256 dataGas = data.length * 16; // Cost per byte of data
        uint256 valueGas = value > 0 ? 9000 : 0; // Additional cost for value transfer
        
        return baseGas + dataGas + valueGas;
    }
    
    // Estimate gas for batch transactions
    function estimateBatchGas(BatchTransaction[] memory transactions)
        internal
        view
        returns (uint256 totalGas)
    {
        for (uint256 i = 0; i < transactions.length; i++) {
            totalGas += estimateGas(
                transactions[i].to,
                transactions[i].value,
                transactions[i].data
            );
        }
        
        // Add overhead for batch processing
        totalGas += transactions.length * 1000;
    }
    
    // Optimize storage by packing data
    function packAddressAndAmount(address addr, uint256 amount)
        internal
        pure
        returns (bytes32)
    {
        return bytes32(uint256(uint160(addr)) | (amount << 160));
    }
    
    // Unpack address and amount from packed data
    function unpackAddressAndAmount(bytes32 packed)
        internal
        pure
        returns (address addr, uint256 amount)
    {
        addr = address(uint160(uint256(packed)));
        amount = uint256(packed) >> 160;
    }
    
    // Calculate gas price optimization
    function calculateOptimalGasPrice(
        uint256 baseFee,
        uint256 priorityFee,
        uint256 urgencyMultiplier
    )
        internal
        pure
        returns (uint256)
    {
        require(urgencyMultiplier > 0 && urgencyMultiplier <= 10, "Invalid urgency multiplier");
        
        uint256 maxPriorityFee = priorityFee * urgencyMultiplier;
        return baseFee + maxPriorityFee;
    }
    
    // Optimize array operations
    function efficientArrayRemoval(
        address[] storage array,
        address elementToRemove
    )
        internal
        returns (bool found)
    {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == elementToRemove) {
                // Move last element to current position
                array[i] = array[array.length - 1];
                array.pop();
                return true;
            }
        }
        return false;
    }
    
    // Batch verification of signatures (placeholder for actual implementation)
    function batchVerifySignatures(
        bytes32[] memory hashes,
        bytes[] memory signatures,
        address[] memory signers
    )
        internal
        pure
        returns (bool)
    {
        require(
            hashes.length == signatures.length && 
            signatures.length == signers.length,
            "Array length mismatch"
        );
        
        // Simplified batch verification
        // In real implementation, this would use cryptographic batch verification
        for (uint256 i = 0; i < hashes.length; i++) {
            if (!verifySignature(hashes[i], signatures[i], signers[i])) {
                return false;
            }
        }
        return true;
    }
    
    // Verify single signature (simplified)
    function verifySignature(
        bytes32 hash,
        bytes memory signature,
        address signer
    )
        internal
        pure
        returns (bool)
    {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        require(v == 27 || v == 28, "Invalid signature recovery id");
        
        address recoveredSigner = ecrecover(hash, v, r, s);
        return recoveredSigner == signer && recoveredSigner != address(0);
    }
    
    // Compress transaction data - VERSI SEDERHANA
    function compressTransactionData(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory data
    )
        internal
        pure
        returns (bytes memory compressed)
    {
        require(
            targets.length == values.length && 
            values.length == data.length,
            "Array length mismatch"
        );
        
        // Use abi.encode for complex types (safer but less efficient)
        compressed = abi.encode(targets, values, data);
    }
    
    // Decompress transaction data - VERSI SEDERHANA
    function decompressTransactionData(bytes memory compressed)
        internal
        pure
        returns (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory data
        )
    {
        // Simple decompression using abi.decode
        (targets, values, data) = abi.decode(compressed, (address[], uint256[], bytes[]));
    }
    
    // Calculate storage cost
    function calculateStorageCost(uint256 dataSize)
        internal
        pure
        returns (uint256)
    {
        uint256 storageGasPerByte = 20000; // SSTORE cost
        return dataSize * storageGasPerByte;
    }
    
    // Optimize loops with early termination
    function findInArray(address[] memory array, address target)
        internal
        pure
        returns (bool found, uint256 index)
    {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == target) {
                return (true, i);
            }
        }
        return (false, 0);
    }
    
    // Gas-efficient counting
    function countApprovals(
        mapping(address => bool) storage approvals,
        address[] memory signers
    )
        internal
        view
        returns (uint256 count)
    {
        for (uint256 i = 0; i < signers.length; i++) {
            if (approvals[signers[i]]) {
                count++;
            }
        }
    }
    
    // Bitwise operations for efficient flags
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
    
    // Calculate percentage with precision
    function calculatePercentage(
        uint256 numerator,
        uint256 denominator,
        uint256 precision
    )
        internal
        pure
        returns (uint256)
    {
        require(denominator > 0, "Division by zero");
        return (numerator * (10 ** precision)) / denominator;
    }
    
    // Advanced gas optimization techniques
    
    // Efficient batch transfer
    function optimizedBatchTransfer(
        address[] memory recipients,
        uint256[] memory amounts
    )
        internal
        pure
        returns (bytes memory callData)
    {
        require(recipients.length == amounts.length, "Array length mismatch");
        
        // Create optimized call data for batch transfers
        callData = abi.encodeWithSelector(
            bytes4(keccak256("batchTransfer(address[],uint256[])")),
            recipients,
            amounts
        );
    }
    
    // Memory optimization for large arrays
    function processInChunks(
        address[] memory array,
        uint256 chunkSize
    )
        internal
        pure
        returns (uint256 totalChunks)
    {
        require(chunkSize > 0, "Invalid chunk size");
        totalChunks = (array.length + chunkSize - 1) / chunkSize;
    }
    
    // Efficient hash calculation
    function efficientHash(
        address[] memory addresses,
        uint256[] memory values
    )
        internal
        pure
        returns (bytes32)
    {
        require(addresses.length == values.length, "Array length mismatch");
        
        bytes32 hash = keccak256(abi.encodePacked(addresses.length));
        
        for (uint256 i = 0; i < addresses.length; i++) {
            hash = keccak256(abi.encodePacked(hash, addresses[i], values[i]));
        }
        
        return hash;
    }
}