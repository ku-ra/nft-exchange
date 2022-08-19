import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { SwapItem } from "../interfaces/swap.interfaces";

export const ERC20Address      = "ERC20";
export const ERC721Address     = "ERC721";
export const ERC1155Address    = "ERC1155";

const createItemERC20 = (tokenContract: string, amount: Number): SwapItem => {
    return  {
        tokenContract: tokenContract, 
        tokenType: ERC20Address, 
        tokenIds: [], 
        amount: BigNumber.from(amount), 
        amounts: [], 
        data: "0x00" 
    }
}

const createItemERC721 = (tokenContract: string, tokenIds: number[]): SwapItem => {
    return  {
        tokenContract: tokenContract, 
        tokenType: ERC721Address, 
        tokenIds: tokenIds, 
        amount: BigNumber.from(0), 
        amounts: [], 
        data: "0x00" 
    }
}

const createItemERC1155 = (tokenContract: string, ids: number[], amounts: number[], data: string): SwapItem => {
    return  {
        tokenContract: tokenContract, 
        tokenType: ERC1155Address, 
        tokenIds: ids.map((id) => BigNumber.from(id)), 
        amount: BigNumber.from(0), 
        amounts: amounts.map((amount) => BigNumber.from(amount)), 
        data: data 
    }
}

const expectItem = (item: SwapItem, compare: SwapItem) => {
    expect(item.tokenContract, "Item State Error: Token Contract differs").to.eq(compare.tokenContract);
    expect(item.tokenType, "Item State Error: Token Type differs").to.eq(compare.tokenType);
    expect(item.tokenIds, "Item State Error: Token Ids differ").to.eql(compare.tokenIds.map((id) => BigNumber.from(id)));
    expect(item.amount, "Item State Error: Amount differs").to.eq(compare.amount);
    expect(item.amounts, "Item State Error: Amounts differ").to.eql(compare.amounts.map((amt) => BigNumber.from(amt)));
    expect(item.data, "Item State Error: Data differs").to.eq(compare.data);
}

export { createItemERC20, createItemERC721, createItemERC1155, expectItem};