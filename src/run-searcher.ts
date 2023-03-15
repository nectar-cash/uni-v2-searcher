import { TransactionRequest } from "@ethersproject/providers";
import dotenv from "dotenv";
import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");
import {
  apiKey,
  GAS_CAP,
  SUSHISWAP_FACTORY,
  SUSHISWAP_ROUTER,
  syncEventSignature,
  transferEventSignature,
  UNISWAP_V2_FACTORY,
  UNISWAP_V2_ROUTER,
  WETH,
} from "./config";
import { TransactionIntent } from "./types";
import IUniswapV2Pair from "./abi/IUniswapV2Pair.json";
import IUniswapV2Factory from "./abi/IUniswapV2Factory.json";
import { insertOne } from "./db";
import { Transaction } from "ethers";

dotenv.config();

const mainnetProvider = new ethers.providers.AlchemyProvider(
  "homestead",
  apiKey
);
let flashBot: any;

(() => {
  mainnetProvider.on("block", async (blockNumber) => {
    await helpers.reset(
      `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
      16825588
      //blockNumber
    );
    const FlashBot = await ethers.getContractFactory("FlashBot");
    flashBot = await FlashBot.deploy(WETH);
    await processTransaction(
      "0x02f9017201118404dc7fc585042d98fe2a8302b6e294d9e1ce17f2641f24ae83637ab66a2cca9c378b9f80b9010418cbafe500000000000000000000000000000000000000000000034d8beab7d0203a567c0000000000000000000000000000000000000000000000002493c0cf4ecaa16e00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000004750e475f88d185b1413bc6e15d29e639f065dad00000000000000000000000000000000000000000000000000000000641052ef0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000808507121b80c02388fad14726482e061b8da827000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2c080a0aa71b51b216295eded064978bfb6720cafddd6329048a16f95b61939fa93dfeca026d2e71f857ac022111b9aacb68cd101bfc0c60872dcdd3f4de8c52fabffdfec"
    );
  });
})();

export async function processTransaction(
  rawTx: string,
  _tx?: TransactionIntent,
  bidRecipient?: string
) {
  console.log("-".repeat(64));
  console.log("Processing transaction", _tx?.hash);
  const tx = ethers.utils.parseTransaction(rawTx); // remove this if we have tx intent object
  //console.log(tx);
  /**
   * Filtering only uniswap and sushiswap transactions, further we can take any tx with "Sync" event inside and check if it's a pool with WETH
   */
  if (tx.to && [UNISWAP_V2_ROUTER, SUSHISWAP_ROUTER].includes(tx.to)) {
    console.log("Uniswap tx found!");
    console.log("simulating tx");
    const impersonatedSigner = await ethers.getImpersonatedSigner(
      tx.from as string
    );
    const simulatedTx = await impersonatedSigner.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      gasLimit: tx.gasLimit,
      nonce: tx.nonce,
    });
    const receipt = await simulatedTx.wait();
    //console.log(receipt);
    /**
     * Search through the logs for the transfer events with the WETH address, then look for sync events with the WETH address to get pool address
     */
    const isWethTransfered = receipt.logs.some((log) => {
      if (log.topics[0] == transferEventSignature && log.address == WETH) {
        console.log("WETH transfered");
        return true;
      }
      return false;
    });
    if (!isWethTransfered) {
      console.log("WETH not transfered, skipping");
    }

    /**
     * finding sync events
     */
    const pools = receipt.logs
      .filter((log) => {
        const isSyncEvent = log.topics[0] == syncEventSignature;
        if (isSyncEvent) {
          console.log("Sync event found");
          return true;
        }
        return false;
      })
      .map((log) => log.address)
      .filter(function (item, pos, arr) {
        return arr.indexOf(item) == pos;
      });

    await Promise.all(
      pools.map(
        async (pool) =>
          await checkPoolProfit(pool, tx.to === UNISWAP_V2_ROUTER, tx)
      )
    );

    process.exit(0);
  }
}

async function checkPoolProfit(
  pool: string,
  isUniswap: boolean,
  tx: Transaction
) {
  const uniV2Pool = new ethers.Contract(pool, IUniswapV2Pair, ethers.provider);
  const factory = new ethers.Contract(
    isUniswap ? SUSHISWAP_FACTORY : UNISWAP_V2_FACTORY,
    IUniswapV2Factory,
    ethers.provider
  );
  const token0 = await uniV2Pool.token0();
  const token1 = await uniV2Pool.token1();
  if ([token0, token1].includes(WETH)) {
    const pool2 = await factory.getPair(token0, token1);
    if (pool2 === "0x0000000000000000000000000000000000000000") {
      console.log("pool not found");
      return;
    }
    const res = await flashBot.getProfit(pool, pool2);
    if (res.profit.toNumber < GAS_CAP) {
      console.log("profit too low");
      return;
    }
    try {
      await insertOne({
        profit: ethers.utils.formatEther(res.profit.toString()),
        tx,
      });
    } catch (e) {
      console.log("error writing to db", e);
    }
    console.log(`Profit : ${ethers.utils.formatEther(res.profit.toString())}`);
  }
}
