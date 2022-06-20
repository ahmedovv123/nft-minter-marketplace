import { defineStore } from "pinia";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import URLS from "../../config.json";
import { useNftMarketplace } from "../stores/nftMarketplace";

const ROPSTEN_RPC_URL = URLS.ROPSTEN_INFURA_URL;
const injected = injectedModule();

const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: "0x3",
      token: "rETH",
      label: "Ethereum Ropsten Testnet",
      rpcUrl: `${ROPSTEN_RPC_URL}`,
    },
  ],
  appMetadata: {
    name: "App",
    icon: "../../public/favicon.ico",
    description: "You are awesome !",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});

onboard.state.get().accountCenter.position = "bottomRight";

const walletsSub = onboard.state.select("wallets");

const walletSubscribe = walletsSub.subscribe(async (wallets) => {
  // const nftMarketplace = useNftMarketplace();
  if (wallets.length === 0) {
    useConnection().currentAddress = "";
    return;
  }

  useConnection().wallets = wallets;
  useConnection().currentAddress = wallets[0].accounts[0];
  useConnection().currentChain = wallets[0].chains[0].id;
  useConnection().provider = wallets[0].provider;
  
  await useNftMarketplace().updateTokenBalance();
  await useNftMarketplace().updateEthBalance();
  await useNftMarketplace().updateEarnings();
  const connectedWallets = wallets.map(({ label }) => label);
  window.localStorage.setItem(
    "connectedWallets",
    JSON.stringify(connectedWallets)
  );
});

export const useConnection = defineStore({
  id: "connection",
  state: () => ({
    wallets: [],
    provider: "",
    currentAddress: "",
    currentChain: "",
  }),
  getters: {
    getWallets: (state) => state.wallets,
    getCurrentAddress: (state) => state.currentAddress,
    getCurrentChain: (state) => state.currentChain,
    getProvider: (state) => state.provider,
  },
  actions: {
    async connect() {
      await onboard.connectWallet();
    },
    async disconnect() {
      const [primaryWallet] = onboard.state.get().wallets;
      await onboard.disconnectWallet({ label: primaryWallet.label });
      window.localStorage.removeItem("connectedWallets");
    },

    async switchToRopsten() {
      await onboard.setChain({ chainId: "0x3" });
    },
    walletUnsubscribe() {
      walletSubscribe.unsubscribe();
    },
    async tryAutoConnect() {
      const previouslyConnectedWallets = await JSON.parse(
        window.localStorage.getItem("connectedWallets")
      );
      if (
        previouslyConnectedWallets !== null &&
        previouslyConnectedWallets.length
      ) {
        await onboard.connectWallet({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true,
          },
        });
      }
    },
  },
});
