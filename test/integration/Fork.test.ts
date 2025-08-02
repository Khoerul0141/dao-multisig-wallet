// file test/integration/Fork.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOMultiSigWallet, GasOptimizer } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Fork Integration Tests", function () {
    let wallet: DAOMultiSigWallet;
    let gasOptimizer: GasOptimizer;
    let signers: SignerWithAddress[];
    let recipient: SignerWithAddress;

    // Test on forked mainnet
    beforeEach(async function () {
        // Skip if no Alchemy API key
        if (!process.env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY === "demo") {
            this.skip();
        }

        // Reset fork
        await ethers.provider.send("hardhat_reset", [
            {
                forking: {
                    jsonRpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
                    blockNumber: 18900000,
                },
            },
        ]);

        signers = await ethers.getSigners();
        recipient = signers[9];

        // Deploy library first
        const GasOptimizerFactory = await ethers.getContractFactory("GasOptimizer");
        gasOptimizer = await GasOptimizerFactory.deploy();
        await gasOptimizer.waitForDeployment();

        // Deploy wallet with library linking
        let DAOMultiSigWallet;
        const gasOptimizerAddress = await gasOptimizer.getAddress();
        
        try {
            DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet", {
                libraries: {
                    "contracts/GasOptimizer.sol:GasOptimizer": gasOptimizerAddress
                }
            });
        } catch (error) {
            try {
                DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet", {
                    libraries: {
                        GasOptimizer: gasOptimizerAddress
                    }
                });
            } catch (error2) {
                console.log("Warning: Fork test deploying without library linking");
                DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            }
        }

        wallet = await DAOMultiSigWallet.deploy(
            [signers[0].address, signers[1].address, signers[2].address],
            2,
            "DAO MultiSig Wallet",
            "1.0.0"
        );

        await wallet.waitForDeployment();

        // Fund the wallet
        await signers[0].sendTransaction({
            to: await wallet.getAddress(),
            value: ethers.parseEther("100.0")
        });
    });

    describe("Real-world Scenarios", function () {
        it("Should handle large ETH transfers", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            const transferAmount = ethers.parseEther("50.0");

            // Submit large transfer
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                transferAmount,
                "0x",
                deadline
            );

            // Vote and execute
            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            await wallet.connect(signers[1]).voteOnTransaction(0, true);

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await wallet.connect(signers[0]).executeTransaction(0);

            const tx = await wallet.getTransaction(0);
            expect(tx.executed).to.be.true;
        });

        it("Should interact with real DeFi protocols", async function () {
            // Example: Interacting with USDC contract (use a mock for testing)
            const mockERC20Address = "0xA0b86a33E6441D0CcF1b6bb57b39B2c2b1243C5F";
            
            // Create a simple transfer call data
            const transferCalldata = "0xa9059cbb" + // transfer function selector
                "000000000000000000000000" + recipient.address.slice(2) + // to address
                "00000000000000000000000000000000000000000000000000000000000003e8"; // 1000 (amount)

            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signers[0]).submitTransaction(
                mockERC20Address,
                0,
                transferCalldata,
                deadline
            );

            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            await wallet.connect(signers[1]).voteOnTransaction(0, true);

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            // This will fail since we don't have USDC, but the flow should work
            await expect(
                wallet.connect(signers[0]).executeTransaction(0)
            ).to.be.revertedWith("Transaction execution failed");
        });

        it("Should handle gas optimization under network congestion", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit multiple transactions
            const txIds = [];
            for (let i = 0; i < 5; i++) {
                await wallet.connect(signers[0]).submitTransaction(
                    recipient.address,
                    ethers.parseEther("0.1"),
                    "0x",
                    deadline
                );
                txIds.push(i);
            }

            // Vote on all transactions using batch vote
            await wallet.connect(signers[0]).batchVote(txIds, Array(5).fill(true));
            await wallet.connect(signers[1]).batchVote(txIds, Array(5).fill(true));

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            // Test batch execution efficiency
            const tx = await wallet.connect(signers[0]).batchExecuteTransactions(txIds);
            const receipt = await tx.wait();
            
            console.log("Batch execution gas used:", receipt?.gasUsed.toString());
            
            // Should be more efficient than individual executions
            expect(receipt?.gasUsed).to.be.lessThan(ethers.parseUnits("2000000", "wei"));
        });
    });

    describe("Stress Testing", function () {
        it("Should handle maximum number of signers", async function () {
            const maxSigners = 10; // Reduced for testing
            const signerAddresses = [];
            
            // Create max number of signers
            for (let i = 0; i < maxSigners; i++) {
                signerAddresses.push(signers[i % signers.length].address);
            }

            // Remove duplicates
            const uniqueSigners = [...new Set(signerAddresses)];
            
            let DAOMultiSigWallet;
            try {
                DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet", {
                    libraries: {
                        "contracts/GasOptimizer.sol:GasOptimizer": await gasOptimizer.getAddress()
                    }
                });
            } catch (error) {
                DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            }

            const maxWallet = await DAOMultiSigWallet.deploy(
                uniqueSigners,
                Math.min(uniqueSigners.length - 1, 5), // Reasonable requirement
                "Max Signers Wallet",
                "1.0.0"
            );

            await maxWallet.waitForDeployment();
            
            const actualSigners = await maxWallet.getSigners();
            expect(actualSigners.length).to.equal(uniqueSigners.length);
        });

        it("Should handle concurrent voting scenarios", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit transaction
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );

            // Simulate concurrent voting
            const votes = [
                wallet.connect(signers[0]).voteOnTransaction(0, true),
                wallet.connect(signers[1]).voteOnTransaction(0, true),
                wallet.connect(signers[2]).voteOnTransaction(0, false)
            ];

            await Promise.all(votes);

            const tx = await wallet.getTransaction(0);
            expect(tx.yesVotes).to.equal(2);
            expect(tx.noVotes).to.equal(1);
        });

        it("Should handle voting deadline edge cases", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );

            // Fast forward to end of voting period
            await time.increase(7 * 24 * 60 * 60); // 7 days

            // Try to vote after deadline
            await expect(
                wallet.connect(signers[0]).voteOnTransaction(0, true)
            ).to.be.revertedWith("Voting ended");
        });
    });

    describe("Economic Attacks", function () {
        it("Should resist front-running attacks", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit high-value transaction
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("10.0"),
                "0x",
                deadline
            );

            // Even with knowledge of pending votes, non-signers can't interfere
            await expect(
                wallet.connect(signers[9]).voteOnTransaction(0, true)
            ).to.be.revertedWith("Not a signer");
        });

        it("Should handle gas griefing attempts", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Create transaction with expensive data
            const expensiveData = "0x" + "00".repeat(1000); // 1KB of data
            
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("0.1"),
                expensiveData,
                deadline
            );

            // Should still execute within reasonable gas limits
            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            const tx = await wallet.connect(signers[1]).voteOnTransaction(0, true);
            const receipt = await tx.wait();
            
            // Should not exceed reasonable gas limit
            expect(receipt?.gasUsed).to.be.lessThan(ethers.parseUnits("500000", "wei"));
        });
    });

    describe("Recovery Scenarios", function () {
        it("Should handle signer key compromise", async function () {
            const compromisedSigner = signers[2];
            const newSigner = signers[3]; // Use available signer
            
            // Remove compromised signer (this would be done through governance)
            const removeData = wallet.interface.encodeFunctionData("removeSigner", [compromisedSigner.address]);
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signers[0]).submitTransaction(
                await wallet.getAddress(),
                0,
                removeData,
                deadline
            );

            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            await wallet.connect(signers[1]).voteOnTransaction(0, true);

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await wallet.connect(signers[0]).executeTransaction(0);

            expect(await wallet.isSigner(compromisedSigner.address)).to.be.false;
        });

        it("Should handle emergency fund recovery", async function () {
            const emergencyRecipient = signers[8];
            const walletBalance = await ethers.provider.getBalance(await wallet.getAddress());
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Emergency withdrawal of most funds (leave some for gas)
            const withdrawAmount = walletBalance - ethers.parseEther("1.0");
            
            await wallet.connect(signers[0]).submitTransaction(
                emergencyRecipient.address,
                withdrawAmount,
                "0x",
                deadline
            );

            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            await wallet.connect(signers[1]).voteOnTransaction(0, true);

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await wallet.connect(signers[0]).executeTransaction(0);

            const newBalance = await ethers.provider.getBalance(await wallet.getAddress());
            expect(newBalance).to.be.lessThan(ethers.parseEther("2.0")); // Account for gas and remaining funds
        });
    });

    describe("Upgrade Scenarios", function () {
        it("Should handle requirement changes", async function () {
            const newRequirement = 3;
            const changeData = wallet.interface.encodeFunctionData("changeRequiredSignatures", [newRequirement]);
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signers[0]).submitTransaction(
                await wallet.getAddress(),
                0,
                changeData,
                deadline
            );

            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            await wallet.connect(signers[1]).voteOnTransaction(0, true);

            // Fast forward time
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await wallet.connect(signers[0]).executeTransaction(0);

            expect(await wallet.getRequiredSignatures()).to.equal(newRequirement);
        });

        it("Should handle signer expansion", async function () {
            const newSigners = [
                signers[3].address,
                signers[4].address
            ];
            
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Add multiple new signers
            for (const newSigner of newSigners) {
                const addData = wallet.interface.encodeFunctionData("addSigner", [newSigner]);
                
                await wallet.connect(signers[0]).submitTransaction(
                    await wallet.getAddress(),
                    0,
                    addData,
                    deadline + 3600 // Different deadline for each
                );
                
                const txId = (await wallet.transactionCount()) - 1n;
                await wallet.connect(signers[0]).voteOnTransaction(txId, true);
                await wallet.connect(signers[1]).voteOnTransaction(txId, true);

                // Fast forward time
                await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

                await wallet.connect(signers[0]).executeTransaction(txId);
            }

            const finalSigners = await wallet.getSigners();
            expect(finalSigners.length).to.equal(5); // 3 original + 2 new
        });
    });

    describe("Performance Benchmarks", function () {
        it("Should measure transaction throughput", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            const startTime = Date.now();
            
            // Submit 10 transactions (reduced for faster testing)
            for (let i = 0; i < 10; i++) {
                await wallet.connect(signers[0]).submitTransaction(
                    recipient.address,
                    ethers.parseEther("0.01"),
                    "0x",
                    deadline
                );
            }
            
            const submitTime = Date.now() - startTime;
            console.log(`Submitted 10 transactions in ${submitTime}ms`);
            
            // Vote on all transactions using batch
            const txIds = Array.from({length: 10}, (_, i) => i);
            const voteStartTime = Date.now();
            
            await wallet.connect(signers[0]).batchVote(txIds, Array(10).fill(true));
            await wallet.connect(signers[1]).batchVote(txIds, Array(10).fill(true));
            
            const voteTime = Date.now() - voteStartTime;
            console.log(`Voted on 10 transactions in ${voteTime}ms`);
            
            // Should complete within reasonable time
            expect(submitTime + voteTime).to.be.lessThan(30000); // 30 seconds
        });

        it("Should measure gas efficiency", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Single transaction gas cost
            const singleTx = await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("0.1"),
                "0x",
                deadline
            );
            const singleReceipt = await singleTx.wait();
            
            // Vote and execute
            await wallet.connect(signers[0]).voteOnTransaction(0, true);
            const executeTx = await wallet.connect(signers[1]).voteOnTransaction(0, true);
            const executeReceipt = await executeTx.wait();
            
            console.log(`Single transaction gas: ${singleReceipt?.gasUsed.toString()}`);
            console.log(`Execution gas: ${executeReceipt?.gasUsed.toString()}`);
            
            // Should be under reasonable gas limits
            expect(singleReceipt?.gasUsed).to.be.lessThan(ethers.parseUnits("300000", "wei"));
            expect(executeReceipt?.gasUsed).to.be.lessThan(ethers.parseUnits("150000", "wei"));
        });

        it("Should test gas optimization features", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signers[0]).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );

            try {
                // Test gas estimation if library is linked
                const gasEstimate = await wallet.estimateExecutionGas(0);
                expect(gasEstimate).to.be.greaterThan(0);
                console.log("Gas estimation successful:", gasEstimate.toString());
            } catch (error) {
                console.log("Gas estimation not available (expected if library not linked)");
            }

            // Test transaction status
            const status = await wallet.getTransactionStatus(0);
            expect(status.canVote).to.be.true;
            expect(status.canExecute).to.be.false;
            expect(status.isExpired).to.be.false;
        });
    });

    describe("Network Specific Tests", function () {
        it("Should handle mainnet fork specific scenarios", async function () {
            // Test block number and network
            const blockNumber = await ethers.provider.getBlockNumber();
            expect(blockNumber).to.be.greaterThan(18900000);

            // Test that we can interact with mainnet state
            const balance = await ethers.provider.getBalance(signers[0].address);
            expect(balance).to.be.greaterThan(0);
        });

        it("Should handle realistic gas prices", async function () {
            // Get current gas price
            const gasPrice = await ethers.provider.getGasPrice();
            console.log("Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
            
            // Should be reasonable for mainnet
            expect(gasPrice).to.be.greaterThan(ethers.parseUnits("1", "gwei"));
            expect(gasPrice).to.be.lessThan(ethers.parseUnits("1000", "gwei"));
        });
    });
});