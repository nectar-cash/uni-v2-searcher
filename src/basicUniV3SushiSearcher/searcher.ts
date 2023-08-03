import { BigNumber, ethers, utils } from "ethers";
import { quoterAbi } from "../abi/quoterAbi";
import { uniswapV2RouterABI } from "../abi/sushiRouter";

const RPC = "http://209.126.81.142:8547";
const WS = "ws://209.126.81.142:8548";
const UNISWAP_QUOTER = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const SUSHI_ROUTER = "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506";
const TOKEN = "0x539bdE0d7Dbd336b79148AA742883198BBF60342"; // MAGIC;
const WETH = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; // WETH;
const SUSHI_PAIR = "0xb7e50106a5bd3cf21af210a755f9c8740890a8c9"; // MAGIC/WETH;
const FEE = 3000; // uniswap pool fee 0.3%

const iface = new utils.Interface(uniswapV2RouterABI);

//swapExactETHForTokens on Sushi
const tx1 = {
  to: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  data: "0x7ff36ab5000000000000000000000000000000000000000000000006fbb0474e301e498200000000000000000000000000000000000000000000000000000000000000800000000000000000000000005a82e0c3c01a39543af5c2af0bc71e25fc021a5e0000000000000000000000000000000000000000000000000000000064cad0c6000000000000000000000000000000000000000000000000000000000000000200000000000000000000000082af49447d8a07e3bd95bd0d56f35241523fbab1000000000000000000000000539bde0d7dbd336b79148aa742883198bbf60342",
  value: 0xb5303ad38b8000, //0.051ETH
};

//swapExactTokensForETH on Sushi
const tx = {
  to: "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506",
  data: "0x18cbafe5000000000000000000000000000000000000000000000035c3f8c3238dd2f9b2000000000000000000000000000000000000000000000000055d28f444b95f5100000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000f05633fae0f200064b12b2dfa9b17fbccd91fd810000000000000000000000000000000000000000000000000000000064cae1ff0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000539bde0d7dbd336b79148aa742883198bbf6034200000000000000000000000082af49447d8a07e3bd95bd0d56f35241523fbab1",
  value: 0x0,
};

const volume = utils.parseEther("0.01"); // need to be collection of test volumes

//TODO: we need to validate user's transaction, skipping for now for simplicity
//TODO: add swapExactTokensForTokens on Sushi
(async () => {
  const provider = new ethers.providers.WebSocketProvider(WS, "arbitrum");
  const quoter = new ethers.Contract(UNISWAP_QUOTER, quoterAbi, provider);
  const sushiRouter = new ethers.Contract(
    SUSHI_ROUTER,
    uniswapV2RouterABI,
    provider
  );
  // Process Sushi txs
  if (tx.to === SUSHI_ROUTER) {
    const decodedArgsArr = iface.decodeFunctionData(
      tx.data.slice(0, 10),
      tx.data
    );
    const functionName = iface.getFunction(tx.data.slice(0, 10)).name;
    if (
      functionName === "swapExactETHForTokens" &&
      decodedArgsArr[1][0] == WETH &&
      decodedArgsArr[1][1] == TOKEN
    ) {
      console.log("buy on sushi");
      const value = BigNumber.from(tx.value); //amount of user's ETH

      const [amountOutTokenSushi, amountInWETHUniV3] = await Promise.all([
        sushiRouter.getAmountsIn(volume, [TOKEN, WETH]),
        quoter.callStatic.quoteExactInputSingle(WETH, TOKEN, FEE, value, 0),
      ]);

      console.log(
        "Tokens to get weth back on SUSHI:",
        amountOutTokenSushi[0].toString(),
        "Tokens for weth on UNI:",
        amountInWETHUniV3.toString(),
        "PROFIT:",
        amountInWETHUniV3.sub(amountOutTokenSushi[0]).toString()
      );
    }
    if (
      functionName === "swapExactTokensForETH" &&
      decodedArgsArr[2][0] == TOKEN &&
      decodedArgsArr[2][1] == WETH
    ) {
      console.log("sell on sushi");
      const [amountInTokenUniV3, amountOutWethSushi] = await Promise.all([
        quoter.callStatic.quoteExactOutputSingle(TOKEN, WETH, FEE, volume, 0),
        sushiRouter.getAmountsOut(volume, [WETH, TOKEN]),
      ]);
      console.log(
        "Tokens for weth on SUSHI:",
        amountOutWethSushi[1].toString(),
        "Tokens to get weth on UNI:",
        amountInTokenUniV3.toString(),
        "PROFIT:",
        amountOutWethSushi[1].sub(amountInTokenUniV3).toString()
      );
      const value = decodedArgsArr[0]; //amount of user's tokens for sale
    }
  }
})();
