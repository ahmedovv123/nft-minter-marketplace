import { defineStore } from "pinia";
import { ethers } from 'ethers';
import { useConnection } from "./connection";
import config from "../../config.json";
import swapPoolAbi from '../../../artifacts/contracts/Swap.sol/SwapPool.json';

const swapPoolAddress = config.SWAP_POOL_ADDRESS;

const infuraPorovider = new ethers.providers.InfuraProvider(
    "ropsten",
    config.ROPSTEN_PROJECT_ID
  );
  
  const CONTRACT = new ethers.Contract(
    swapPoolAddress,
    swapPoolAbi.abi,
    infuraPorovider
  );

export const useSwapPool = defineStore({
    id: 'swapPool',
    state: () => ({
        t1Address: config.NFT_MARKETPLACE_ADDRESS,
        t2Address: '0x8b98598C7bEEE81028F1Ee002f67b82AAC507617'
    }),
    getters: {
        getT1Address: (state) => state.t1Address,
        getT2Address: (state) => state.t2Address
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

            await CONTRACT.connect(signer.getSigner()).swap(amountIn, minAmountOut, fromToken, toToken, useConnection().currentAddress.address)
        }
    },
})