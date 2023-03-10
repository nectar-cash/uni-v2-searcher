import { ethers, run } from 'hardhat';

//WETH address on ETH
const WethAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

async function main() {
  await run('compile');
  const FlashBot = await ethers.getContractFactory('FlashBot');
  const flashBot = await FlashBot.deploy(WethAddr);

  console.log(`FlashBot deployed to ${flashBot.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
