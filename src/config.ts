import dotenv from "dotenv";

dotenv.config();

export const WETH = process.env.WETH as string;
export const UNISWAP_V2_ROUTER = process.env.UNISWAP_V2_ROUTER as string;
export const SUSHISWAP_ROUTER = process.env.SUSHISWAP_ROUTER as string;
export const ONEINCH_RESOLVER = process.env.ONEINCH_RESOLVER as string;
export const UNISWAP_V2_FACTORY = process.env.UNISWAP_V2_FACTORY as string;
export const SUSHISWAP_FACTORY = process.env.SUSHISWAP_FACTORY as string;
export const transferEventSignature =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
export const syncEventSignature =
  "0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1";
export const GAS_CAP = parseFloat(process.env.GAS_CAP as string);
export const apiKey = process.env.ALCHEMY_API_KEY as string;
export const dbUri = process.env.DB_URI as string;
