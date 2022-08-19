import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContract, solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, Signer, Wallet } from "ethers";
import { SwapItem } from "./interfaces/swap.interfaces";
import { createItemERC721 } from "./helpers/swap.helper";

require('chai').use(solidity)

describe("Should pass edge cases", async () => {
    let erc721Contract: Contract;
    let swapContract: Contract;

    let owner: SignerWithAddress;
    let wallet1: SignerWithAddress;
    let wallet2: SignerWithAddress;
    let unauthorized: SignerWithAddress;
    let offer: SwapItem, recieve: SwapItem;

    it("Should deploy contract", async () => {
        [owner, wallet1, wallet2, unauthorized] = await ethers.getSigners();

        const swap = await ethers.getContractFactory("Swap");
        swapContract = await swap.deploy();
        await swapContract.deployed();

    });


    it("Should deploy the Test Token Contracts", async () => {
        const erc721 = await ethers.getContractFactory("ERC721Token");
        erc721Contract = await erc721.deploy();
        await erc721Contract.deployed();
    });

    // Check Valid Swap Modifier
    it("Should check validSwap Modifier", async () => {
        await expect(swapContract.getSwap(1)).to.be.reverted;
    });

    it("Should prepare Wallet 1", async () => {
        await erc721Contract.connect(wallet1).mint();
        expect(await erc721Contract.ownerOf(1)).to.eq(wallet1.address);

        offer = createItemERC721(erc721Contract.address, [1]);
        recieve = createItemERC721(erc721Contract.address, [2]);
    })

    //  No offer behaviour
    //  No recieving behaviour
    describe("Check create() function behaviour", () => {
        it("Should revert on creation with empty values", async () => {
            await expect(swapContract.connect(wallet1).create([], [], wallet2.address)).to.be.revertedWith("You have to either retrieve or offer a token");
        });
    
        // Invalid recipient
        it("Should revert on creation with invalid recipient", async () => {
            await expect(swapContract.connect(wallet1).create([offer], [], "")).to.be.reverted;
        });
    
        it("Should revert on creation with offer tokens not owned", async () => {
            await expect(swapContract.connect(wallet2).create([offer], [], wallet1.address)).to.be.reverted;
        });
    
        it("Should revert on creation with tokens not approved by creator", async () => {
            await expect(swapContract.connect(wallet1).create([offer], [], wallet2.address)).to.be.reverted;
        });

        it("Should approve the token", async () => {
            expect(await erc721Contract.connect(wallet1).setApprovalForAll(swapContract.address, true));
        });

        it("Should create a swap", async () => {
            expect(await swapContract.connect(wallet1).create([offer], [recieve], wallet2.address));
        });
    });

    describe("Check accept() function behaviour", () => {
        it("Should revert with requested token not in recipients wallet", async () => {
            await expect(swapContract.connect(wallet1).accept(0)).to.be.reverted;
        })
        it("Should revert with invalid swap ID provided", async () => {
            await expect(swapContract.connect(wallet1).accept(100)).to.be.reverted;
        });
        it("Should revert with unauthorized caller", async () => {
            await expect(swapContract.connect(unauthorized).accept(0)).to.be.reverted;
        });

        it("Should mint Token for Wallet 2", async () => {
            await erc721Contract.connect(wallet2).mint();
            expect(await erc721Contract.ownerOf(2)).to.eq(wallet2.address);
        });

        it("Should revert with no token approval from recipient", async () => {
            await expect(swapContract.connect(wallet2).accept(0)).to.be.reverted;
        });
    });

    describe("Check cancel() function behaviour", () => {
        it("Should revert with invalid swap ID", async () => {
            await expect(swapContract.connect(wallet1).cancel(100)).to.be.reverted;
        });

        it("Should revert with unauthorized caller", async () => {
            await expect(swapContract.connect(unauthorized).cancel(0)).to.be.reverted;
        });
    });

    describe("Check getSwap() function behaviour", () => {
        it("Should revert with invalid swapId", async () => {
            await expect(swapContract.getSwap(100)).to.be.reverted;
        })
    });


    describe("Check getSwapItems() function behaviour", () => {
        it("Should revert with invalid swapId", async () => {
            await expect(swapContract.getSwapItems(100)).to.be.reverted;
        })
    });

    describe("Check openSwap modifier", () => {
        it("Should revert if swap state cancelled or accepted", async () => {
            await swapContract.connect(wallet2).cancel(0);
            await expect(swapContract.connect(wallet2).accept(0)).to.be.reverted;
        });
    });
});
