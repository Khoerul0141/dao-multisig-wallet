// FILE GasOptimizer.SOL
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GasOptimizer
 * @dev Library untuk optimisasi gas menggunakan assembly dan teknik advanced
 * @author Your Name
 */
library GasOptimizer {
    
    /**
     * @dev Optimized hash calculation using assembly
     */
    function efficientKeccak256(
        address contractAddr,
        address to,
        uint256 value,
        bytes memory data,
        uint256 nonce
    ) internal pure returns (bytes32 result) {
        assembly {
            let ptr := mload(0x40)
            
            // Store contract address (32 bytes)
            mstore(ptr, contractAddr)
            
            // Store to address (32 bytes)
            mstore(add(ptr, 0x20), to)
            
            // Store value (32 bytes)
            mstore(add(ptr, 0x40), value)
            
            // Store data hash (32 bytes)
            let dataHash := keccak256(add(data, 0x20), mload(data))
            mstore(add(ptr, 0x60), dataHash)
            
            // Store nonce (32 bytes)
            mstore(add(ptr, 0x80), nonce)
            
            // Calculate keccak256 hash
            result := keccak256(ptr, 0xA0)
            
            // Update free memory pointer
            mstore(0x40, add(ptr, 0xA0))
        }
    }

    /**
     * @dev Batch signature verification with gas optimization
     */
    function verifySignatures(
        bytes32 txHash,
        bytes[] memory signatures,
        address[] memory signers
    ) internal pure returns (bool) {
        uint256 length = signatures.length;
        require(length == signers.length, "Array length mismatch");
        
        assembly {
            let sigPtr := add(signatures, 0x20)
            let signerPtr := add(signers, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let sig := mload(add(sigPtr, mul(i, 0x20)))
                let signer := mload(add(signerPtr, mul(i, 0x20)))
                
                // Get signature components
                let sigData := add(sig, 0x20)
                let r := mload(sigData)
                let s := mload(add(sigData, 0x20))
                let v := byte(0, mload(add(sigData, 0x40)))
                
                // Prepare for ecrecover
                let recoveredSigner := ecrecover(txHash, v, r, s)
                
                // Check if recovered signer matches expected signer
                if iszero(eq(recoveredSigner, signer)) {
                    revert(0, 0)
                }
            }
        }
        
        return true;
    }

    /**
     * @dev Optimized address array contains check
     */
    function contains(address[] memory array, address target) 
        internal 
        pure 
        returns (bool) 
    {
        uint256 length = array.length;
        
        assembly {
            let ptr := add(array, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let element := mload(add(ptr, mul(i, 0x20)))
                if eq(element, target) {
                    mstore(0x40, 0x01)
                    return(0x40, 0x20)
                }
            }
            
            mstore(0x40, 0x00)
            return(0x40, 0x20)
        }
    }

    /**
     * @dev Optimized unique address checking
     */
    function checkUniqueAddresses(address[] memory addresses) 
        internal 
        pure 
        returns (bool) 
    {
        uint256 length = addresses.length;
        
        assembly {
            let ptr := add(addresses, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let current := mload(add(ptr, mul(i, 0x20)))
                
                for { let j := add(i, 1) } lt(j, length) { j := add(j, 1) } {
                    let next := mload(add(ptr, mul(j, 0x20)))
                    
                    if eq(current, next) {
                        mstore(0x40, 0x00)
                        return(0x40, 0x20)
                    }
                }
            }
            
            mstore(0x40, 0x01)
            return(0x40, 0x20)
        }
    }

    /**
     * @dev Packed storage helper for multiple uint128 values
     */
    function packTwoUint128(uint128 a, uint128 b) internal pure returns (uint256) {
        return uint256(a) | (uint256(b) << 128);
    }

    /**
     * @dev Unpack two uint128 values from uint256
     */
    function unpackTwoUint128(uint256 packed) internal pure returns (uint128 a, uint128 b) {
        a = uint128(packed);
        b = uint128(packed >> 128);
    }

    /**
     * @dev Efficient bytes concatenation
     */
    function concatBytes(bytes memory a, bytes memory b) 
        internal 
        pure 
        returns (bytes memory) 
    {
        uint256 aLength = a.length;
        uint256 bLength = b.length;
        
        bytes memory result = new bytes(aLength + bLength);
        
        assembly {
            let resultPtr := add(result, 0x20)
            let aPtr := add(a, 0x20)
            let bPtr := add(b, 0x20)
            
            // Copy bytes from a
            for { let i := 0 } lt(i, aLength) { i := add(i, 0x20) } {
                mstore(add(resultPtr, i), mload(add(aPtr, i)))
            }
            
            // Copy bytes from b
            for { let i := 0 } lt(i, bLength) { i := add(i, 0x20) } {
                mstore(add(add(resultPtr, aLength), i), mload(add(bPtr, i)))
            }
        }
        
        return result;
    }

    /**
     * @dev Efficient array sum calculation
     */
    function sumArray(uint256[] memory array) internal pure returns (uint256 sum) {
        uint256 length = array.length;
        
        assembly {
            let ptr := add(array, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                sum := add(sum, mload(add(ptr, mul(i, 0x20))))
            }
        }
    }

    /**
     * @dev Gas-efficient boolean array operations
     */
    function countTrue(bool[] memory array) internal pure returns (uint256 count) {
        uint256 length = array.length;
        
        assembly {
            let ptr := add(array, 0x20)
            
            for { let i := 0 } lt(i, length) { i := add(i, 1) } {
                let value := mload(add(ptr, mul(i, 0x20)))
                if value {
                    count := add(count, 1)
                }
            }
        }
    }

    /**
     * @dev Optimized memory copying
     */
    function memCopy(uint256 dest, uint256 src, uint256 len) internal pure {
        assembly {
            for { } gt(len, 0) { len := sub(len, 0x20) } {
                mstore(dest, mload(src))
                dest := add(dest, 0x20)
                src := add(src, 0x20)
            }
        }
    }

    /**
     * @dev Calculate percentage with precision
     */
    function calculatePercentage(
        uint256 value,
        uint256 total,
        uint256 precision
    ) internal pure returns (uint256) {
        require(total > 0, "Division by zero");
        return (value * precision) / total;
    }

    /**
     * @dev Safe math operations with overflow protection
     */
    function safeAdd(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "Addition overflow");
        return c;
    }

    function safeSub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "Subtraction underflow");
        return a - b;
    }

    function safeMul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) return 0;
        uint256 c = a * b;
        require(c / a == b, "Multiplication overflow");
        return c;
    }

    function safeDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "Division by zero");
        return a / b;
    }
}