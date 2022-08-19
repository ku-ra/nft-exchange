import { BigNumber } from "ethers"

export enum SwapStates {
    Created, Accepted, Cancelled
}

export interface Items {
    ERC20: number,
    ERC721: number,
    ERC1155: { ids: number[], amounts: number[] }
}

export interface SwapItems {
    offerItems: SwapItem[],
    recieveItems: SwapItem[],
}

export interface SwapItem {
    tokenContract: string,
    tokenType: string,
    tokenIds: BigNumber[] | number[],
    amount: BigNumber,
    amounts: BigNumber[] | number[],
    data: string
}

export interface SwapTest {
    description: string,
    offer: Items,
    recieve: Items,
    endState: SwapStates,
    cancelWallet?: 1 | 2,
}