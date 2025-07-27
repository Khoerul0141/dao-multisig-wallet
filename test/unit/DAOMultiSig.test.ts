// file test/unit/DAOMultiSig.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOMultiSigWallet, GasOptimizer } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("DAOMultiSigWallet", function () {
    let wallet: DAOMultiSigWallet;
    let gasOptimizer: GasOptimizer;
    let owner: SignerWithAddress;
    let signer1: SignerWithAddress;
    let signer2: SignerWithAddress;
    let signer3: SignerWithAddress;
    let recipient: SignerWithAddress;
    let nonSigner: SignerWithAddress;

    const WALLET_NAME = "DAO MultiSig Wallet";
    const WALLET_VERSION = "1.0.0";
    const REQUIRED_SIGNATURES = 2;

    beforeEach(async function () {
        [owner, signer1, signer2, signer3, recipient, nonSigner] = await ethers.getSigners();

        // Deploy GasOptimizer library first
        const GasOptimizerFactory = await ethers.getContractFactory("GasOptimizer");
        gasOptimizer = await GasOptimizerFactory.deploy();
        await gasOptimizer.waitForDeployment();

        // Deploy DAOMultiSigWallet with library linking
        const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet", {
            libraries: {
                GasOptimizer: await gasOptimizer.getAddress()
            }
        });
        
        wallet = await DAOMultiSigWallet.deploy(
            [signer1.address, signer2.address, signer3.address],
            REQUIRED_SIGNATURES,
            WALLET_NAME,
            WALLET_VERSION
        );

        await wallet.waitForDeployment();

        // Fund the wallet
        await signer1.sendTransaction({
            to: await wallet.getAddress(),
            value: ethers.parseEther("10.0")
        });
    });

    describe("Deployment", function () {
        it("Should set the correct signers", async function () {
            expect(await wallet.isSigner(signer1.address)).to.be.true;
            expect(await wallet.isSigner(signer2.address)).to.be.true;
            expect(await wallet.isSigner(signer3.address)).to.be.true;
            expect(await wallet.isSigner(nonSigner.address)).to.be.false;
        });

        it("Should set the correct required signatures", async function () {
            expect(await wallet.getRequiredSignatures()).to.equal(REQUIRED_SIGNATURES);
        });

        it("Should have correct initial state", async function () {
            expect(await wallet.transactionCount()).to.equal(0);
            const signers = await wallet.getSigners();
            expect(signers.length).to.equal(3);
            expect(await wallet.getSignerCount()).to.equal(3);
            expect(await wallet.isPaused()).to.be.false;
        });

        it("Should reject duplicate signers", async function () {
            const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            
            await expect(
                DAOMultiSigWallet.deploy(
                    [signer1.address, signer1.address, signer2.address],
                    2,
                    WALLET_NAME,
                    WALLET_VERSION
                )
            ).to.be.revertedWith("Duplicate signers");
        });

        it("Should reject zero address signer", async function () {
            const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            
            await expect(
                DAOMultiSigWallet.deploy(
                    [signer1.address, ethers.ZeroAddress, signer2.address],
                    2,
                    WALLET_NAME,
                    WALLET_VERSION
                )
            ).to.be.revertedWith("Invalid signer");
        });

        it("Should reject invalid required signatures", async function () {
            const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            
            await expect(
                DAOMultiSigWallet.deploy(
                    [signer1.address, signer2.address],
                    3,
                    WALLET_NAME,
                    WALLET_VERSION
                )
            ).to.be.revertedWith("Invalid requirement");
        });
    });

    describe("Transaction Submission", function () {
        it("Should allow signers to submit transactions", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await expect(
                wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("1.0"),
                    "0x",
                    deadline
                )
            ).to.emit(wallet, "TransactionSubmitted")
             .withArgs(0, signer1.address, recipient.address, ethers.parseEther("1.0"), "0x");

            expect(await wallet.transactionCount()).to.equal(1);

            const tx = await wallet.getTransaction(0);
            expect(tx.to).to.equal(recipient.address);
            expect(tx.value).to.equal(ethers.parseEther("1.0"));
            expect(tx.executed).to.be.false;
            expect(tx.yesVotes).to.equal(0);
            expect(tx.noVotes).to.equal(0);
        });

        it("Should reject transaction submission from non-signers", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await expect(
                wallet.connect(nonSigner).submitTransaction(
                    recipient.address,
                    ethers.parseEther("1.0"),
                    "0x",
                    deadline
                )
            ).to.be.revertedWith("Not a signer");
        });

        it("Should reject transactions with invalid parameters", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Invalid recipient
            await expect(
                wallet.connect(signer1).submitTransaction(
                    ethers.ZeroAddress,
                    ethers.parseEther("1.0"),
                    "0x",
                    deadline
                )
            ).to.be.revertedWith("Invalid recipient");

            // Invalid deadline
            await expect(
                wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("1.0"),
                    "0x",
                    Math.floor(Date.now() / 1000) - 1000
                )
            ).to.be.revertedWith("Invalid deadline");
        });
    });

    describe("Transaction Voting", function () {
        let txId: number;

        beforeEach(async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );
            txId = 0;
        });

        it("Should allow signers to vote on transactions", async function () {
            await expect(
                wallet.connect(signer1).voteOnTransaction(txId, true)
            ).to.emit(wallet, "TransactionVoted")
             .withArgs(txId, signer1.address, true);

            expect(await wallet.hasVoted(txId, signer1.address)).to.be.true;
            expect(await wallet.getVote(txId, signer1.address)).to.be.true;

            const tx = await wallet.getTransaction(txId);
            expect(tx.yesVotes).to.equal(1);
            expect(tx.noVotes).to.equal(0);
        });

        it("Should allow voting NO", async function () {
            await wallet.connect(signer1).voteOnTransaction(txId, false);

            const tx = await wallet.getTransaction(txId);
            expect(tx.yesVotes).to.equal(0);
            expect(tx.noVotes).to.equal(1);
        });

        it("Should reject votes from non-signers", async function () {
            await expect(
                wallet.connect(nonSigner).voteOnTransaction(txId, true)
            ).to.be.revertedWith("Not a signer");
        });

        it("Should reject duplicate votes", async function () {
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            
            await expect(
                wallet.connect(signer1).voteOnTransaction(txId, false)
            ).to.be.revertedWith("Already voted");
        });

        it("Should reject votes on non-existent transactions", async function () {
            await expect(
                wallet.connect(signer1).voteOnTransaction(999, true)
            ).to.be.revertedWith("Transaction does not exist");
        });

        it("Should respect voting period constraints", async function () {
            // Fast forward past voting period
            await time.increase(7 * 24 * 60 * 60 + 1); // 7 days + 1 second

            await expect(
                wallet.connect(signer1).voteOnTransaction(txId, true)
            ).to.be.revertedWith("Voting ended");
        });
    });

    describe("Transaction Execution", function () {
        let txId: number;

        beforeEach(async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );
            txId = 0;
        });

        it("Should execute transaction with sufficient votes after voting period", async function () {
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            
            // Vote with required signatures
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            await wallet.connect(signer2).voteOnTransaction(txId, true);

            // Fast forward past voting period and execution delay
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1); // 7 days + 1 day + 1 second

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.emit(wallet, "TransactionExecuted")
             .withArgs(txId, signer1.address, true);

            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ethers.parseEther("1.0"));

            const tx = await wallet.getTransaction(txId);
            expect(tx.executed).to.be.true;
        });

        it("Should reject execution without sufficient votes", async function () {
            // Only one vote
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            
            // Fast forward past voting period
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.be.revertedWith("Insufficient votes");
        });

        it("Should reject execution during voting period", async function () {
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            await wallet.connect(signer2).voteOnTransaction(txId, true);

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.be.revertedWith("Voting period not ended");
        });

        it("Should reject execution of already executed transactions", async function () {
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            await wallet.connect(signer2).voteOnTransaction(txId, true);
            
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);
            await wallet.connect(signer1).executeTransaction(txId);

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.be.revertedWith("Transaction already executed");
        });

        it("Should respect execution delay", async function () {
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            await wallet.connect(signer2).voteOnTransaction(txId, true);
            
            // Fast forward past voting period but not execution delay
            await time.increase(7 * 24 * 60 * 60 + 1);

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.be.revertedWith("Execution delay not met");

            // Fast forward past execution delay
            await time.increase(24 * 60 * 60 + 1);

            await expect(
                wallet.connect(signer1).executeTransaction(txId)
            ).to.not.be.reverted;
        });
    });

    describe("Gas Optimization Features", function () {
        it("Should estimate gas for single transaction", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );

            const gasEstimate = await wallet.estimateExecutionGas(0);
            expect(gasEstimate).to.be.greaterThan(0);
        });

        it("Should estimate gas for batch transactions", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit multiple transactions
            for (let i = 0; i < 3; i++) {
                await wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("0.1"),
                    "0x",
                    deadline
                );
            }

            const batchGasEstimate = await wallet.estimateBatchExecutionGas([0, 1, 2]);
            expect(batchGasEstimate).to.be.greaterThan(0);
        });

        it("Should provide transaction status information", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                deadline
            );

            let status = await wallet.getTransactionStatus(0);
            expect(status.canVote).to.be.true;
            expect(status.canExecute).to.be.false;
            expect(status.isExpired).to.be.false;
            expect(status.votingTimeLeft).to.be.greaterThan(0);

            // Vote and check status change
            await wallet.connect(signer1).voteOnTransaction(0, true);
            await wallet.connect(signer2).voteOnTransaction(0, true);

            // Fast forward past voting period
            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            status = await wallet.getTransactionStatus(0);
            expect(status.canVote).to.be.false;
            expect(status.canExecute).to.be.true;
            expect(status.votingTimeLeft).to.equal(0);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow owner to pause/unpause contract", async function () {
            await wallet.togglePause();
            expect(await wallet.isPaused()).to.be.true;

            // Should reject operations when paused
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            await expect(
                wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("1.0"),
                    "0x",
                    deadline
                )
            ).to.be.revertedWith("Contract is paused");

            // Unpause
            await wallet.togglePause();
            expect(await wallet.isPaused()).to.be.false;
        });
    });

    describe("View Functions", function () {
        it("Should return correct signer information", async function () {
            const signers = await wallet.getSigners();
            expect(signers).to.deep.equal([signer1.address, signer2.address, signer3.address]);
            
            expect(await wallet.getSignerCount()).to.equal(3);
            expect(await wallet.isSigner(signer1.address)).to.be.true;
            expect(await wallet.isSigner(nonSigner.address)).to.be.false;
        });

        it("Should return correct configuration", async function () {
            expect(await wallet.getRequiredSignatures()).to.equal(REQUIRED_SIGNATURES);
            expect(await wallet.getProposalDuration()).to.equal(7 * 24 * 60 * 60); // 7 days
            expect(await wallet.isPaused()).to.be.false;
            expect(await wallet.executionDelay()).to.equal(24 * 60 * 60); // 1 day
        });
    });

    describe("Batch Operations", function () {
        it("Should handle batch transaction submission", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            const targets = [recipient.address, recipient.address, recipient.address];
            const values = [
                ethers.parseEther("0.1"),
                ethers.parseEther("0.2"),
                ethers.parseEther("0.3")
            ];
            const data = ["0x", "0x", "0x"];
            const deadlines = [deadline, deadline, deadline];

            await wallet.connect(signer1).submitBatchTransactions(
                targets,
                values,
                data,
                deadlines
            );

            expect(await wallet.transactionCount()).to.equal(3);

            // Verify all transactions were created
            for (let i = 0; i < 3; i++) {
                const transaction = await wallet.getTransaction(i);
                expect(transaction.to).to.equal(recipient.address);
                expect(transaction.value).to.equal(values[i]);
            }
        });

        it("Should handle batch voting", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit multiple transactions
            for (let i = 0; i < 3; i++) {
                await wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("0.1"),
                    "0x",
                    deadline
                );
            }

            const txIds = [0, 1, 2];
            const supports = [true, true, false];

            await wallet.connect(signer1).batchVote(txIds, supports);

            // Verify votes
            expect(await wallet.hasVoted(0, signer1.address)).to.be.true;
            expect(await wallet.getVote(0, signer1.address)).to.be.true;
            expect(await wallet.getVote(2, signer1.address)).to.be.false;
        });
    });

    describe("Edge Cases and Security", function () {
        it("Should handle failed transaction execution gracefully", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            // Submit transaction that will fail (sending more ETH than available)
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("100.0"), // More than wallet balance
                "0x",
                deadline
            );

            await wallet.connect(signer1).voteOnTransaction(0, true);
            await wallet.connect(signer2).voteOnTransaction(0, true);

            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await expect(
                wallet.connect(signer1).executeTransaction(0)
            ).to.be.revertedWith("Transaction execution failed");

            // Transaction should remain unexecuted
            const tx = await wallet.getTransaction(0);
            expect(tx.executed).to.be.false;
        });

        it("Should handle zero value transactions", async function () {
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                0, // Zero value
                "0x1234", // Some data
                deadline
            );

            await wallet.connect(signer1).voteOnTransaction(0, true);
            await wallet.connect(signer2).voteOnTransaction(0, true);

            await time.increase(7 * 24 * 60 * 60 + 24 * 60 * 60 + 1);

            await expect(
                wallet.connect(signer1).executeTransaction(0)
            ).to.not.be.reverted;
        });

        it("Should reject operations from paused contract", async function () {
            await wallet.togglePause();
            
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            
            await expect(
                wallet.connect(signer1).submitTransaction(
                    recipient.address,
                    ethers.parseEther("1.0"),
                    "0x",
                    deadline
                )
            ).to.be.revertedWith("Contract is paused");
        });
    });
});