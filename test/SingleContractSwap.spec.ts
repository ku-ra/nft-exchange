import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContract, solidity } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract } from "ethers";

import { SwapItem, SwapTest, SwapItems, Items, SwapStates } from "./interfaces/swap.interfaces";
import { createItemERC1155, createItemERC20, createItemERC721, ERC1155Address, ERC20Address, ERC721Address, expectItem } from "./helpers/swap.helper";

require('chai').use(solidity);

const testCases: SwapTest[] = [
    {
        description: "ERC721 for ERC721",
        offer: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: []}},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Accepted
    },
    {
        description: "ERC20 for ERC721",
        offer: { ERC20: 100000, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Accepted
    },
    {
        description: "ERC20 for ERC20",
        offer: { ERC20: 100000, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 99999, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Accepted
    },
    {
        description: "ERC721 for ERC20",
        offer: { ERC20: 0, ERC721: 5, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 100000, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Accepted
    },
    {
        description: "ERC721 for single ERC1155",
        offer: { ERC20: 0, ERC721: 5, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0], amounts: [500] }},
        endState: SwapStates.Accepted
    },
    {
        description: "Single ERC1155 for single ERC1155",
        offer: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0], amounts: [100] }},
        recieve: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0], amounts: [200] }},
        endState: SwapStates.Accepted
    },
    {
        description: "Multiple ERC1155 for multiple ERC1155",
        offer: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0, 1], amounts: [500, 100] }},
        recieve: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0, 1], amounts: [100, 500] }},
        endState: SwapStates.Accepted
    },
    {
        description: "Single ERC1155 for ERC721",
        offer: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0, 1], amounts: [500, 100] }},
        recieve: { ERC20: 0, ERC721: 3, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Accepted
    },
    {
        description: "Multiple Token Transfer",
        offer: { ERC20: 1000, ERC721: 9, ERC1155: {ids: [0, 1], amounts: [500, 100] }},
        recieve: { ERC20: 2000, ERC721: 3, ERC1155: {ids: [0], amounts: [999] }},
        endState: SwapStates.Accepted
    },




    {
        description: "ERC721 Wallet 1 Cancel",
        offer: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: []}},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 1
    },
    {
        description: "ERC721 Wallet 2 Cancel",
        offer: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 2
    },
    {
        description: "ERC20 Wallet 1 Cancel",
        offer: { ERC20: 100000, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 1
    },
    {
        description: "ERC20 Wallet 2 Cancel",
        offer: { ERC20: 100000, ERC721: 0, ERC1155: {ids: [], amounts: [] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 2
    },
    {
        description: "Multiple ERC1155 Wallet 1 Cancel",
        offer: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0, 1], amounts: [500, 100] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 1
    },
    {
        description: "Multiple ERC1155 Wallet 2 Cancel",
        offer: { ERC20: 0, ERC721: 0, ERC1155: {ids: [0, 1], amounts: [500, 100] }},
        recieve: { ERC20: 0, ERC721: 1, ERC1155: {ids: [], amounts: [] }},
        endState: SwapStates.Cancelled,
        cancelWallet: 2
    },
]

for (const test of testCases) {
    describe(`Single Swap ${test.description}`, () => {
        let swapItems: SwapItems = { offerItems: [], recieveItems: [] };
        let erc20OfferItems: SwapItem[], erc20RecieveItems: SwapItem[];
        let erc721OfferItems: SwapItem[], erc721RecieveItems: SwapItem[];
        let erc1155OfferItems: SwapItem[], erc1155RecieveItems: SwapItem[];

        let erc20Contract: Contract;
        let erc721Contract: Contract;
        let erc1155Contract: Contract;
        let swapContract: Contract;
      
        let owner: SignerWithAddress;
        let wallet1: SignerWithAddress;
        let wallet2: SignerWithAddress;

        describe("Execute the Swap", async () => {
            it("Should deploy the Swap Contract", async () => {
                const swap = await ethers.getContractFactory("Swap");
                swapContract = await swap.deploy();
                await swapContract.deployed();
            });

            it("Should get the Test Wallets", async () => {
                [owner, wallet1, wallet2] = await ethers.getSigners();
            });

            it("Should deploy the Test Token Contracts", async () => {
                const erc20 = await ethers.getContractFactory("ERC20Token");
                const erc721 = await ethers.getContractFactory("ERC721Token");
                const erc1155 = await ethers.getContractFactory("ERC1155Token");

                erc20Contract = await erc20.deploy();
                erc721Contract = await erc721.deploy();
                erc1155Contract = await erc1155.deploy();

                await erc20Contract.deployed();
                await erc721Contract.deployed();
                await erc1155Contract.deployed();
            });

            it("Should Prepare Wallets", async () => {
                swapItems.offerItems = await prepareWallet(wallet1, test.offer, erc20Contract, erc721Contract, erc1155Contract, swapContract);
                swapItems.recieveItems = await prepareWallet(wallet2, test.recieve, erc20Contract, erc721Contract, erc1155Contract, swapContract);
           
                erc20OfferItems = swapItems.offerItems.filter(item => item.tokenType == ERC20Address);
                erc721OfferItems = swapItems.offerItems.filter(item => item.tokenType == ERC721Address);
                erc1155OfferItems = swapItems.offerItems.filter(item => item.tokenType == ERC1155Address);

                erc20RecieveItems = swapItems.recieveItems.filter(item => item.tokenType == ERC20Address);
                erc721RecieveItems = swapItems.recieveItems.filter(item => item.tokenType == ERC721Address);
                erc1155RecieveItems = swapItems.recieveItems.filter(item => item.tokenType == ERC1155Address);
            }); 
    
            it("Should Create Swap", async () => {
                const tx = await swapContract.connect(wallet1).create(swapItems.offerItems, swapItems.recieveItems, wallet2.address);

                // Get State of Contract
                const swap = await swapContract.connect(wallet1).getSwap(0);
                const items = await swapContract.connect(wallet1).getSwapItems(swap.swapId);
        
                // Check emitted event
                await expect(tx).to.emit(swapContract, 'SwapEvent').withArgs(0, wallet1.address, wallet2.address, SwapStates.Created, BigNumber.from(swap.createdTimestamp));

                // Check Swap Object State
                expect(swap.swapId,         "SwapId differs from expected").to.eq(0);
                expect(swap.initiator.addr, "Initiator different from wallet1").to.eq(wallet1.address);
                expect(swap.recipient.addr, "Recipient different from wallet2").to.eq(wallet2.address);
                expect(swap.state,          "Invalid SwapState").to.eq(SwapStates.Created);
    
                // Check Swap Items
                expect(items.offer.length).to.eq(swapItems.offerItems.length);
                expect(items.recieve.length).to.eq(swapItems.recieveItems.length);
    
                const offerItems = (swapItems.offerItems as SwapItem[]);
                const recieveItems = (swapItems.recieveItems as SwapItem[]);

                items.offer.forEach((item: SwapItem, index: number) => {
                    expectItem(item, offerItems[index]);
                });

                items.recieve.forEach((item: SwapItem, index: number) => {
                    expectItem(item, recieveItems[index]);
                });
            })

            if (test.endState == SwapStates.Accepted) {
                it("Should Accept Swap", async () => {
                    const tx = await swapContract.connect(wallet2).accept(0);
        
                    // Get State of Contract
                    const swap = await swapContract.connect(wallet1).getSwap(0);

                    // Check emitted Event
                    await expect(tx).to.emit(swapContract, 'SwapEvent').withArgs(0, wallet1.address, wallet2.address, SwapStates.Accepted, BigNumber.from(swap.executedTimestamp));

                    // Check Swap Object State
                    expect(swap.swapId,         "SwapId differs from expected").to.eq(0);
                    expect(swap.initiator.addr, "Initiator different from wallet1").to.eq(wallet1.address);
                    expect(swap.recipient.addr, "Recipient different from wallet2").to.eq(wallet2.address);
                    expect(swap.executedTimestamp, "Executed timestamp not set").to.gt(0);
                    expect(swap.state,          "Invalid SwapState").to.eq(SwapStates.Accepted);

                    for (const item of erc20OfferItems) {
                        expect(await erc20Contract.balanceOf(wallet2.address), "Expected Recipient Balance to equal offered amount").to.eq(item.amount);
                    }

                    for (const item of erc721OfferItems) {
                        for (const tokenId of item.tokenIds) {
                            expect(await erc721Contract.ownerOf(tokenId), "Expected TokenId Owner to be Recipient").to.eq(wallet2.address);
                        }
                    }

                    for (const item of erc1155OfferItems) {
                        for (const index of item.tokenIds.keys()) {
                            expect(await erc1155Contract.balanceOf(wallet2.address, item.tokenIds[index]), "Expected Recipient Balance to equal offered amount").to.gte(item.amounts[index]);
                        }
                    }

                    for (const item of erc20RecieveItems) {
                        expect(await erc20Contract.balanceOf(wallet1.address), "Expected Initiator Balance to equal recieved amount").to.eq(item.amount);
                    }

                    for (const item of erc721RecieveItems) {
                        for (const tokenId of item.tokenIds) {
                            expect(await erc721Contract.ownerOf(tokenId), "Expected TokenId Owner to be Initiator").to.eq(wallet1.address);
                        }
                    }

                    for (const item of erc1155RecieveItems) {
                        for (const index of item.tokenIds.keys()) {
                            expect(await erc1155Contract.balanceOf(wallet1.address, item.tokenIds[index]), "Expected Initiator Balance to equal recieved amount").to.gte(item.amounts[index]);
                        }
                    }
                });               
            }
            else if (test.endState == SwapStates.Cancelled) {
                it("Should Cancel Swap", async () => {
                    const wallet = test.cancelWallet == 1 ? wallet1 : wallet2;
                    const tx = await swapContract.connect(wallet).cancel(0);

                    // Get State of Contract
                    const swap = await swapContract.connect(wallet).getSwap(0);

                    // Check emitted Event
                    await expect(tx).to.emit(swapContract, 'SwapEvent').withArgs(0, wallet1.address, wallet2.address, SwapStates.Cancelled, BigNumber.from(swap.executedTimestamp));

                    // Check Swap Object State
                    expect(swap.swapId,         "SwapId differs from expected").to.eq(0);
                    expect(swap.initiator.addr, "Initiator different from wallet1").to.eq(wallet1.address);
                    expect(swap.recipient.addr, "Recipient different from wallet2").to.eq(wallet2.address);
                    expect(swap.executedTimestamp, "Executed timestamp not set").to.gt(0);
                    expect(swap.state,          "Invalid SwapState").to.eq(SwapStates.Cancelled);

                    for (const item of erc20OfferItems) {
                        expect(await erc20Contract.balanceOf(wallet1.address), "Expected Amount to be refunded to Wallet ").to.eq(item.amount);
                    }

                    for (const item of erc721OfferItems) {
                        for (const tokenId of item.tokenIds) {
                            expect(await erc721Contract.ownerOf(tokenId), "Expected Token to be refunded to Wallet 1").to.eq(wallet1.address);
                        }
                    }

                    for (const item of erc1155OfferItems) {
                        for (const index of item.tokenIds.keys()) {
                            expect(await erc1155Contract.balanceOf(wallet1.address, item.tokenIds[index]), "Expected Amount to be refunded to Wallet").to.eq(Math.max(...item.amounts.map(x => Number(x))));
                        }
                    }

                    for (const item of erc20RecieveItems) {
                        expect(await erc20Contract.balanceOf(wallet2.address), "Expected Wallet 2 Balance to not change").to.eq(item.amount);
                    }

                    for (const item of erc721RecieveItems) {
                        for (const tokenId of item.tokenIds) {
                            expect(await erc721Contract.ownerOf(tokenId), "Expected Wallet 2 Tokens to not change").to.eq(wallet2.address);
                        }
                    }

                    for (const item of erc1155RecieveItems) {
                        for (const index of item.tokenIds.keys()) {
                            expect(await erc1155Contract.balanceOf(wallet2.address, item.tokenIds[index]), "Expected Wallet 2 Balance to not change").to.eq(item.amounts[index]);
                        }
                    }
                });
            }
        });
    })
}

const prepareWallet = async (wallet: SignerWithAddress, items: Items, erc20Contract: Contract, erc721Contract: Contract, erc1155Contract: Contract, swapContract: Contract): Promise<SwapItem[]> => {
    let swapItems: SwapItem[] = [];

    if (items.ERC20 > 0) {
        await erc20Contract.connect(wallet).mint(items.ERC20);
        expect(await erc20Contract.balanceOf(wallet.address) >= items.ERC20, "Wallet Balance not enough");
        await erc20Contract.connect(wallet).approve(swapContract.address, items.ERC20);
        swapItems.push(createItemERC20(erc20Contract.address, items.ERC20));
    }

    if (items.ERC721 > 0) {
        let erc721Ids: number[] = [];
        for (let index = 0; index < items.ERC721; index++) {
            await erc721Contract.connect(wallet).mint();
            const tokenId = await erc721Contract.id();
            expect(await erc721Contract.ownerOf(tokenId)).to.eq(wallet.address);
            erc721Ids.push(tokenId);
        }
        await erc721Contract.connect(wallet).setApprovalForAll(swapContract.address, true);
        swapItems.push(createItemERC721(erc721Contract.address, erc721Ids));
    }

    if (items.ERC1155.ids.length > 0 && items.ERC1155.amounts.length > 0) {
        const amount = Math.max(...items.ERC1155.amounts);
        await erc1155Contract.connect(wallet).mint(amount);
        await erc1155Contract.connect(wallet).setApprovalForAll(swapContract.address, true);

        expect(await erc1155Contract.balanceOf(wallet.address, items.ERC1155.ids.at(0))).to.be.gt(0);
        
        swapItems.push(createItemERC1155(erc1155Contract.address, items.ERC1155.ids, items.ERC1155.amounts, "0x00"));
    }

    return swapItems;
}