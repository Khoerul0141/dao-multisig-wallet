// file hardhat.d.ts
declare module "hardhat" {
  interface HardhatUserConfig {
    solidity?: any;
    networks?: any;
    gasReporter?: any;
    etherscan?: any;
    paths?: any;
    mocha?: any;
    typechain?: any;
  }

  interface HardhatRuntimeEnvironment {
    config: HardhatUserConfig;
    hardhatArguments: any;
    tasks: any;
    run: any;
    network: {
      name: string;
      config: any;
      provider: any;
    };
    artifacts: {
      readArtifact: (name: string) => Promise<any>;
    };
    ethers: any;
  }

  const hre: HardhatRuntimeEnvironment;
  export = hre;
}

declare module "@nomicfoundation/hardhat-toolbox" {
  // Toolbox plugin types
}

declare module "@nomicfoundation/hardhat-network-helpers" {
  export namespace time {
    export function increase(seconds: number): Promise<void>;
    export function increaseTo(timestamp: number): Promise<void>;
    export function latest(): Promise<number>;
    export function latestBlock(): Promise<number>;
    export function setNextBlockTimestamp(timestamp: number): Promise<void>;
  }

  export namespace mine {
    export function mine(blocks?: number, options?: { interval?: number }): Promise<void>;
  }

  export namespace loadFixture {
    export function loadFixture<T>(fixture: () => Promise<T>): Promise<T>;
  }

  export namespace impersonateAccount {
    export function impersonateAccount(address: string): Promise<void>;
    export function stopImpersonatingAccount(address: string): Promise<void>;
  }

  export namespace setBalance {
    export function setBalance(address: string, balance: bigint): Promise<void>;
  }

  export namespace reset {
    export function reset(url?: string, blockNumber?: number): Promise<void>;
  }
}

declare module "@nomicfoundation/hardhat-ethers/signers" {
  import { Signer } from "ethers";
  
  export interface SignerWithAddress extends Signer {
    address: string;
  }
}

// Global Hardhat types
declare global {
  namespace Mocha {
    interface Context {
      skip(): void;
    }
  }
}

export {};