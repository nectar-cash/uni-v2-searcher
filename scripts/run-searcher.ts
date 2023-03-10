import { ethers } from 'hardhat';
const helpers = require("@nomicfoundation/hardhat-network-helpers");
import {apiKey} from '../.secret';

const mainnetProvider = new ethers.providers.AlchemyProvider("homestead", apiKey);

(()=>{
    mainnetProvider.on("block", async (blockNumber)=>{
        const a = Date.now();
        //console.log(1,ethers.provider.blockNumber);
        //console.log(2,blockNumber);
        await helpers.reset(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`, blockNumber);
        //await new Promise(r => setTimeout(r, 2000));
        console.log(3, Date.now()-a);
        const b=await ethers.provider.getBlockNumber();

    })
})()