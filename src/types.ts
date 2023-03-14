import { Transaction } from '@ethersproject/transactions';

import {
  METHOD_AUCTION_BID_RECIPIENT,
  METHOD_AUCTION_RESULT,
  METHOD_RPC_NEW_AUCTION,
  METHOD_SEARCHER_BID,
} from './constants'

// Protocol Definitions

//const {Transaction} = ethers;

export interface NectarOptions {
  onlyBackrun?: boolean // only allow backrunning MEV for this transaction
  rewardAddress?: string // address to receive the reward of the auction
  feeAddress?: string // address to receive fees
  feeAmount?: number // amount of fees the fee address should receive in percent
}

// Protocol Communication

export interface PayloadAny {
  method: string
  data: Record<string, unknown>
}

export interface PayloadRPCNewAuction {
  method: typeof METHOD_RPC_NEW_AUCTION
  data: {
    hash: string
    tx: TransactionIntent
    options: NectarOptions
  }
}

export interface PayloadSearcherBid {
  method: typeof METHOD_SEARCHER_BID
  data: {
    bundle: TransactionBundle
  }
}

interface PayloadAuctionDataWithWinner {
  hasWinner: true
  bundle: TransactionBundle
}
interface PayloadAuctionDataWithoutWinner {
  hasWinner: false
  bundle: undefined
}
export interface PayloadAuctionResult {
  method: typeof METHOD_AUCTION_RESULT
  data: {
    hash: string
  } & (PayloadAuctionDataWithWinner | PayloadAuctionDataWithoutWinner)
}

export interface PayloadAuctionBidRecipient {
  method: typeof METHOD_AUCTION_BID_RECIPIENT
  data: {
    address: string
  }
}

// Data Structures

export type TransactionIntent = Omit<Transaction, 'v' | 'r' | 's'>

// Transaction Bundles

export interface BundleTransactionHash {
  hash: string
}
export interface BundleTransactionSigned {
  signedTransaction: string
}
export type BundleTransaction = BundleTransactionHash | BundleTransactionSigned
export type TransactionBundle = BundleTransaction[]