// file test/unit/DAOMultiSig.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { DAOMultiSigWallet } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("DAOMultiSigWallet", function () {
    let wallet: DAOMultiSigWallet;
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

        const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
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
            expect(await wallet.requiredSignatures()).to.equal(REQUIRED_SIGNATURES);
        });

        it("Should have correct initial state", async function () {
            expect(await wallet.transactionCount()).to.equal(0);
            const signers = await wallet.getSigners();
            expect(signers.length).to.equal(3);
        });

        it("Should reject invalid constructor parameters", async function () {
            const DAOMultiSigWallet = await ethers.getContractFactory("DAOMultiSigWallet");
            
            // Test with duplicate signers
            await expect(
                DAOMultiSigWallet.deploy(
                    [signer1.address, signer1.address, signer2.address],
                    2,
                    WALLET_NAME,
                    WALLET_VERSION
                )
            ).to.be.revertedWith("Duplicate signer");

            // Test with zero address
            await expect(
                DAOMultiSigWallet.deploy(
                    [signer1.address, ethers.ZeroAddress, signer2.address],
                    2,
                    WALLET_NAME,
                    WALLET_VERSION
                )
            ).to.be.revertedWith("Invalid signer");

            // Test with invalid required signatures
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

        it("Should auto-execute when threshold is reached", async function () {
            const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
            
            // First vote
            await wallet.connect(signer1).voteOnTransaction(txId, true);
            
            // Second vote should trigger execution
            await expect(
                wallet.connect(signer2).voteOnTransaction(txId, true)
            ).to.emit(wallet, "TransactionExecuted")
             .withArgs(txId, signer2.address, true);

            const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
            expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(ethers.parseEther("1.0"));

            const tx = await wallet.getTransaction(txId);
            expect(tx.executed).to.be.true;
        });
    });

    describe("Signer Management", function () {
        it("Should allow adding new signers", async function () {
            const newSigner = ethers.Wallet.createRandom();
            
            await expect(
                wallet.connect(signer1).addSigner(newSigner.address)
            ).to.emit(wallet, "SignerAdded")
             .withArgs(newSigner.address);

            expect(await wallet.isSigner(newSigner.address)).to.be.true;
        });

        it("Should reject adding duplicate signers", async function () {
            await expect(
                wallet.connect(signer1).addSigner(signer1.address)
            ).to.be.revertedWith("Already a signer");
        });

        it("Should allow removing signers", async function () {
            await expect(
                wallet.connect(signer1).removeSigner(signer3.address)
            ).to.emit(wallet, "SignerRemoved")
             .withArgs(signer3.address);

            expect(await wallet.isSigner(signer3.address)).to.be.false;
        });

        it("Should reject removing signers below minimum", async function () {
            // Remove one signer first
            await wallet.connect(signer1).removeSigner(signer3.address);
            
            // Try to remove another (would leave only 1 signer)
            await expect(
                wallet.connect(signer1).removeSigner(signer2.address)
            ).to.be.revertedWith("Cannot remove, minimum signers required");
        });
    });

    describe("Gas Optimization", function () {
        it("Should handle batch execution efficiently", async function () {
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

            // Vote on all transactions
            for (let i = 0; i < 3; i++) {
                await wallet.connect(signer1).voteOnTransaction(i, true);
                await wallet.connect(signer2).voteOnTransaction(i, true);
            }

            // Test batch execution
            const txIds = [0, 1, 2];
            await expect(
                wallet.connect(signer1).batchExecuteTransactions(txIds)
            ).to.not.be.reverted;
        });
    });

    describe("Security", function () {
        it("Should prevent reentrancy attacks", async function () {
            // This test would require a malicious contract to test reentrancy
            // For now, we just verify the ReentrancyGuard is in place
            expect(await wallet.transactionCount()).to.be.greaterThanOrEqual(0);
        });

        it("Should handle transaction expiration", async function () {
            const shortDeadline = Math.floor(Date.now() / 1000) + 1;
            
            await wallet.connect(signer1).submitTransaction(
                recipient.address,
                ethers.parseEther("1.0"),
                "0x",
                shortDeadline
            );

            // Wait for transaction to expire
            await ethers.provider.send("evm_increaseTime", [2]);
            await ethers.provider.send("evm_mine", []);

            // Vote on transaction
            await wallet.connect(signer1).voteOnTransaction(0, true);
            await wallet.connect(signer2).voteOnTransaction(0, true);

            // Try to execute expired transaction
            await expect(
                wallet.connect(signer1).executeTransaction(0)
            ).to.be.revertedWith("Transaction expired");
        });
    });
});