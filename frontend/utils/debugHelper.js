// frontend/utils/debugHelper.js - Debug helper untuk Wagmi v2 issues

/**
 * Debug helper untuk troubleshooting Wagmi v2 errors
 * Gunakan ini untuk membantu identify masalah dengan hooks
 */

// Helper untuk log contract call details
export const logContractCall = (operation, params) => {
  console.group(`🔍 Contract Call Debug: ${operation}`);
  console.log('Parameters:', params);
  console.log('Address:', params.address);
  console.log('Function:', params.functionName);
  console.log('Args:', params.args);
  console.groupEnd();
};

// Helper untuk log hook state
export const logHookState = (hookName, state) => {
  console.group(`📊 Hook State: ${hookName}`);
  Object.entries(state).forEach(([key, value]) => {
    console.log(`${key}:`, value);
  });
  console.groupEnd();
};

// Helper untuk validate contract parameters
export const validateContractParams = (params) => {
  const errors = [];
  
  if (!params.address || params.address === '0x...') {
    errors.push('Invalid contract address');
  }
  
  if (!params.abi || !Array.isArray(params.abi)) {
    errors.push('Invalid ABI');
  }
  
  if (!params.functionName) {
    errors.push('Missing function name');
  }
  
  if (errors.length > 0) {
    console.error('❌ Contract params validation failed:', errors);
    return false;
  }
  
  console.log('✅ Contract params validation passed');
  return true;
};

// Helper untuk check wallet connection
export const checkWalletConnection = (account) => {
  if (!account.isConnected) {
    console.warn('⚠️ Wallet not connected');
    return false;
  }
  
  if (!account.address) {
    console.warn('⚠️ No wallet address available');
    return false;
  }
  
  console.log('✅ Wallet connected:', account.address);
  return true;
};

// Error handler untuk Wagmi hooks
export const handleWagmiError = (error, context = '') => {
  console.group(`❌ Wagmi Error ${context}`);
  
  if (error?.code) {
    console.log('Error Code:', error.code);
  }
  
  if (error?.reason) {
    console.log('Reason:', error.reason);
  }
  
  if (error?.message) {
    console.log('Message:', error.message);
  }
  
  if (error?.data) {
    console.log('Data:', error.data);
  }
  
  // Common error patterns
  if (error?.message?.includes('user rejected')) {
    console.log('💡 User rejected the transaction');
  } else if (error?.message?.includes('insufficient funds')) {
    console.log('💡 Insufficient funds for transaction');
  } else if (error?.message?.includes('gas')) {
    console.log('💡 Gas related error - check gas settings');
  } else if (error?.message?.includes('revert')) {
    console.log('💡 Transaction reverted - check contract conditions');
  }
  
  console.groupEnd();
  return error;
};

// Helper untuk format transaction parameters
export const formatTxParams = (to, value, data, deadline) => {
  return {
    to: to || '0x0000000000000000000000000000000000000000',
    value: value || '0',
    data: data || '0x',
    deadline: deadline || Math.floor(Date.now() / 1000) + 3600
  };
};

// Helper untuk check if contract is ready
export const isContractReady = (contractAddress, abi, account) => {
  const checks = [
    { name: 'Contract Address', check: () => contractAddress && contractAddress !== '0x...' },
    { name: 'ABI Available', check: () => abi && Array.isArray(abi) && abi.length > 0 },
    { name: 'Wallet Connected', check: () => account?.isConnected },
    { name: 'User Address', check: () => account?.address }
  ];
  
  console.group('🔍 Contract Readiness Check');
  
  let allReady = true;
  checks.forEach(({ name, check }) => {
    const result = check();
    console.log(`${result ? '✅' : '❌'} ${name}:`, result);
    if (!result) allReady = false;
  });
  
  console.log(`Overall Status: ${allReady ? '✅ Ready' : '❌ Not Ready'}`);
  console.groupEnd();
  
  return allReady;
};

// Helper untuk create safe contract call
export const createSafeContractCall = (contractAddress, abi, functionName, args = []) => {
  if (!validateContractParams({ address: contractAddress, abi, functionName })) {
    throw new Error('Invalid contract parameters');
  }
  
  const params = {
    address: contractAddress,
    abi,
    functionName,
    args
  };
  
  logContractCall(functionName, params);
  return params;
};

export default {
  logContractCall,
  logHookState,
  validateContractParams,
  checkWalletConnection,
  handleWagmiError,
  formatTxParams,
  isContractReady,
  createSafeContractCall
};