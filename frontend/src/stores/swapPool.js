import { defineStore } from "pinia";
import { ethers } from "ethers";
import { useConnection } from "./connection";
import config from "../../config.json";
import swapPoolAbi from "../../../artifacts/contracts/Swap.sol/SwapPool.json";
import tokenAbi from "../../../artifacts/contracts/nUSD.sol/nUSD.json";
import { useNftMarketplace } from "./nftMarketplace";

const swapPoolAddress = config.SWAP_POOL_ADDRESS;

const alchemyProvider = new ethers.providers.AlchemyProvider(
  "maticmum",
  config.MUMBAI_ALCHEMY_API_KEY
);

const CONTRACT = new ethers.Contract(
  swapPoolAddress,
  swapPoolAbi.abi,
  alchemyProvider
);

export const useSwapPool = defineStore({
  id: "swapPool",
  state: () => ({
    t1Address: config.NFT_MARKETPLACE_ADDRESS,
    t2Address: "0xEC8Da6b31472504F0e5182a46E86463A5E08733f",
  }),
  getters: {
    getT1Address: (state) => state.t1Address,
    getT2Address: (state) => state.t2Address,
  },
  actions: {
    async getAmountOut(amountIn, fromToken) {
      amountIn = ethers.utils.parseEther(amountIn.toString());
      let data = await CONTRACT.getAmountOut(amountIn, fromToken);
      return data;
    },
    async swap(amountIn, minAmountOut, fromToken, toToken) {
      amountIn = ethers.utils.parseEther(amountIn.toString());
      minAmountOut = ethers.utils.parseEther(minAmountOut.toString());

      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );

      let swapped = await CONTRACT.connect(signer.getSigner()).swap(
        amountIn,
        minAmountOut,
        fromToken,
        toToken,
        useConnection().currentAddress.address
      );
      await swapped.wait();
      await useNftMarketplace().updateTokenBalance();
      return true;
    },
    async approveAndSwap(amountIn, minAmountOut, fromToken, toToken) {
      amountIn = ethers.utils.parseEther(amountIn.toString());
      minAmountOut = ethers.utils.parseEther(minAmountOut.toString());
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );

      const tokenContract = new ethers.Contract(
        fromToken,
        tokenAbi.abi,
        signer.getSigner()
      );

      let approved = await tokenContract.approve(swapPoolAddress, amountIn);
      await approved.wait();
      let swapped = await CONTRACT.connect(signer.getSigner()).swap(
        amountIn,
        minAmountOut,
        fromToken,
        toToken,
        useConnection().currentAddress.address
      );
      await swapped.wait();
      await useNftMarketplace().updateTokenBalance();
      return true;
    },
  },
});
