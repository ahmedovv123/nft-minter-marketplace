import { defineStore } from "pinia";
import config from "../../config.json";
import { Contract, ethers } from "ethers";
import { LoadingBar } from "quasar";
import { useConnection } from "./connection";
import { useIpfs } from "./ipfs";

LoadingBar.setDefaults({
  color: "purple",
  size: "5px",
  position: "top",
});

import marketAbi from "../../../artifacts/contracts/Marketplace.sol/NftMarketplace.json"; // change this to load from its own folder, not from backend
import nftAbi from "../../../artifacts/contracts/NFT.sol/NFT.json";

const MARKETPLACE_ADDRESS = config.NFT_MARKETPLACE_ADDRESS;
const NFT_ADDRESS = config.NFT_ADDRESS;

const alchemyProvider = new ethers.providers.AlchemyProvider(
  "maticmum",
  config.MUMBAI_ALCHEMY_API_KEY
);

const CONTRACT = new Contract(
  MARKETPLACE_ADDRESS,
  marketAbi.abi,
  alchemyProvider
);

CONTRACT.on("ItemListed", async (seller, nftAddress, tokenId, price) => {
  let event = {
    args: [seller, nftAddress, tokenId, price],
  };
  console.log("new item detected", event);
  await useNftMarketplace().filterAndPush(event);
});

CONTRACT.on("ItemCanceled", (seller, nftAddress, tokenId) => {
  console.log("Item canceled");
  if (useNftMarketplace().hashMap.has(`${nftAddress}/${tokenId}`)) {
    let indexToDelete = useNftMarketplace().hashMap.get(
      `${nftAddress}/${tokenId}`
    );
    useNftMarketplace().NFTs.splice(indexToDelete, 1);
    useNftMarketplace().uniqueIds.delete(
      JSON.stringify({ address: nftAddress, id: tokenId.toNumber() })
    );
    useNftMarketplace().hashMap.delete(`${nftAddress}/${tokenId}`);
    useNftMarketplace().iterator--;
    useNftMarketplace().updateStorage();
  }
});

CONTRACT.on("ItemBought", (buyer, nftAddress, tokenId, price) => {
  console.log("Item bought");
  if (useNftMarketplace().hashMap.has(`${nftAddress}/${tokenId}`)) {
    let indexToDelete = useNftMarketplace().hashMap.get(
      `${nftAddress}/${tokenId}`
    );
    useNftMarketplace().NFTs.splice(indexToDelete, 1);
    useNftMarketplace().uniqueIds.delete(
      JSON.stringify({ address: nftAddress, id: tokenId.toNumber() })
    );
    useNftMarketplace().hashMap.delete(`${nftAddress}/${tokenId}`);
    useNftMarketplace().iterator--;
    useNftMarketplace().updateStorage();
    useNftMarketplace().updateEarnings();
  }
});

export const useNftMarketplace = defineStore({
  id: "marketplace",
  state: () => ({
    NFTs: [],
    NFT_ADDRESS,
    iterator: 0,
    tokenBalance: 0,
    ethBalance: 0,
    earnings: 0,
    currentNftMintPrice: 0,
    nftSellFee: 0,
    uniqueIds: new Set(),
    hashMap: new Map(),
    loadedFromStorage: false,
    buyingProcess: false,
    mintProcess: false,
    listingProcess: false,
    approving: false,
  }),
  getters: {
    getNfts: (state) => state.NFTs,
    getTokenBalance: (state) => state.tokenBalance,
    getEthBalance: (state) => state.ethBalance,
    getEarnings: (state) => state.earnings,
    getCurrentNftMinPrice: (state) => state.currentNftMintPrice,
    getNftSellFee: (state) => state.nftSellFee,
    getNftAddress: (state) => state.NFT_ADDRESS,
  },
  actions: {
    async loadNfts(force = false) {
      LoadingBar.start();
      const nftListFromStorage = window.localStorage.getItem("nftList");

      if (nftListFromStorage && nftListFromStorage.length > 0 && !force) {
        this.NFTs = JSON.parse(nftListFromStorage);
        this.iterator = JSON.parse(window.localStorage.getItem("iterator"));
        this.uniqueIds = new Set(
          JSON.parse(window.localStorage.getItem("uniqueIds"))
        );
        this.hashMap = new Map(
          JSON.parse(window.localStorage.getItem("hashMap"))
        );
        this.loadedFromStorage = true;
        LoadingBar.stop();
        return;
      }
      this.loadedFromStorage = false;
      this.clearStorage();

      let eventFilter = CONTRACT.filters.ItemListed();
      let events = await CONTRACT.queryFilter(eventFilter);

      console.log(eventFilter);

      for (let i = 0; i < events.length; i++) {
        let event = events[i];
        await this.filterAndPush(event);
      }
      LoadingBar.stop();
      this.updateStorage();
    },

    async filterAndPush(event) {
      const nft = {
        seller: event.args[0],
        contractAddress: event.args[1],
        tokenId: event.args[2].toNumber(),
        price: ethers.utils.formatEther(event.args[3]),
      };
      let nftFromMarket = await CONTRACT.getListing(
        nft.contractAddress,
        nft.tokenId
      );

      if (+nftFromMarket.price !== 0) {
        let setSize = this.uniqueIds.size;
        this.uniqueIds.add(
          JSON.stringify({ address: nft.contractAddress, id: nft.tokenId })
        );

        if (this.uniqueIds.size !== setSize) {
          let nftTokenUri = await this.getNftUri(
            nft.contractAddress,
            nft.tokenId
          );
          const metadata = await this.fetchIPFSJSON(nftTokenUri);

          if (metadata.image) {
            metadata.image = this.makeGatewayURL(metadata.image);
          }

          this.NFTs.push({ ...nft, index: this.iterator, metadata });
          this.hashMap[`${nft.contractAddress}/${nft.tokenId}`] = this.iterator;
          this.hashMap.set(
            `${nft.contractAddress}/${nft.tokenId}`,
            this.iterator
          );
          this.iterator++;
        }
      }
    },

    makeGatewayURL(ipfsURI) {
      return ipfsURI.replace(/^ipfs:\/\//, "https://nftstorage.link/ipfs/");
    },

    async fetchIPFSJSON(ipfsURI) {
      const url = this.makeGatewayURL(ipfsURI);
      const resp = await fetch(url);
      return resp.json();
    },

    async listNft({ address, tokenId, price }) {
      if (useConnection().getCurrentAddress === "") {
        useConnection().connect();
        return;
      }
      console.log(address);
      console.log(NFT_ADDRESS);
      this.listingProcess = {
        address,
        tokenId,
        price,
        status: "Fetching some information...",
      };

      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );

      let fee = address === NFT_ADDRESS ? 0 : this.getNftSellFee;
      console.log(fee);
      this.listingProcess.status = "Calculated fee";
      this.listingProcess.fee = fee;

      try {
        let nftContract = new Contract(address, nftAbi.abi, signer.getSigner());

        this.listingProcess.status = "Checking ownership...";
        let owner = await nftContract.ownerOf(tokenId);
        console.log(owner);
        console.log(useConnection().getCurrentAddress.address);
        if (owner.toLowerCase() !== useConnection().getCurrentAddress.address) {
          throw Error("Not Owner");
        }

        this.listingProcess.status = "Checking approval...";

        let approvedAddress = await nftContract.getApproved(tokenId);
        let isApprovedForAll = await nftContract.isApprovedForAll(
          useConnection().getCurrentAddress.address,
          MARKETPLACE_ADDRESS
        );

        if (approvedAddress === MARKETPLACE_ADDRESS || isApprovedForAll) {
          this.listingProcess.status = "We have approval, processing...";
          price = ethers.utils.parseUnits(price.toString(), "ether");
          this.listingProcess.status = "Pending wallet action";
          let tx;
          if (fee) {
            fee = ethers.utils.parseUnits(fee.toString(), "ether");
            tx = await CONTRACT.connect(signer.getSigner()).listItem(
              address,
              tokenId,
              price,
              {
                value: fee,
              }
            );
          } else {
            tx = await CONTRACT.connect(signer.getSigner()).listItem(
              address,
              tokenId,
              price
            );
          }
          this.listingProcess.status =
            "Confirmed from Wallet, waiting to be confirmed on network";
          await tx.wait();
          this.listingProcess.status = "Listed successfully !";
          setTimeout(() => {
            this.listingProcess = false;
          }, 3000);
          return true;
        } else {
          throw Error("No Approval");
        }
      } catch (e) {
        console.log(
          e.message.includes("ERC721: owner query for nonexistent token")
        );
        if (e.message.includes("ERC721: owner query for nonexistent token")) {
          this.listingProcess.status = "This token doesnt exist !";
          setTimeout(() => {
            this.listingProcess = false;
          }, 3000);
          return;
        } else if (e.message.includes("invalid address")) {
          this.listingProcess.status = "NFT address is not valid";
          setTimeout(() => {
            this.listingProcess = false;
          }, 3000);
          return "invalid address";
        }
        console.log(e.message);
        this.listingProcess.status = e.message;
        setTimeout(() => {
          this.listingProcess = false;
        }, 3000);
        return e.message;
      }
    },

    async buyNft({ nftAddress, tokenId, price }) {
      if (useConnection().getCurrentAddress === "") {
        useConnection().connect();
        return;
      }
      this.buyingProcess = {
        nftAddress,
        tokenId,
        price,
        status: "Pending Wallet action",
      };
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );
      const contractWithSigner = CONTRACT.connect(signer.getSigner());
      try {
        let tx = await contractWithSigner.buyItem(nftAddress, tokenId, {
          value: ethers.utils.parseUnits(price.toString(), "ether"),
        });

        this.buyingProcess.status =
          "Confirmed from Wallet, waiting to be confirmed on network";
        await tx.wait();
        this.buyingProcess.status = "Transaction finished";
        setTimeout(() => {
          this.buyingProcess = false;
        }, 3000);
      } catch (e) {
        console.log(e.message);
        this.buyingProcess.status = e.message;
        setTimeout(() => {
          this.buyingProcess = false;
        }, 2000);
      }
    },

    updateStorage() {
      window.localStorage.setItem("nftList", JSON.stringify(this.getNfts));
      window.localStorage.setItem("iterator", JSON.stringify(this.iterator));
      window.localStorage.setItem(
        "uniqueIds",
        JSON.stringify([...this.uniqueIds])
      );
      window.localStorage.setItem("hashMap", JSON.stringify([...this.hashMap]));
    },

    clearStorage() {
      window.localStorage.removeItem("nftList");
      window.localStorage.removeItem("iterator");
      window.localStorage.removeItem("uniqueIds");
      window.localStorage.removeItem("hashMap");
    },

    async updateTokenBalance() {
      let balance = await CONTRACT.balanceOf(
        useConnection().getCurrentAddress.address
      );
      this.tokenBalance = +ethers.utils.formatEther(balance);
    },

    async updateEthBalance() {
      let balance = await alchemyProvider.getBalance(
        useConnection().getCurrentAddress.address
      );
      this.ethBalance = +ethers.utils.formatEther(balance);
    },

    async updateEarnings() {
      let earnings = await CONTRACT.getProceeds(
        useConnection().getCurrentAddress.address
      );
      this.earnings = +ethers.utils.formatEther(earnings);
    },

    async withdraw() {
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );

      let tx = await CONTRACT.connect(signer.getSigner()).withdrawProceeds();
      await tx.wait();
      await this.updateEarnings();
    },

    async updateNftMintPrice() {
      let price = await CONTRACT.getCurrentMintPrice();
      this.currentNftMintPrice = +ethers.utils.formatEther(price);
    },

    async updateNftSellFee() {
      let fee = await CONTRACT.getListingFee();
      this.nftSellFee = +ethers.utils.formatEther(fee);
    },

    async mintNft(nft) {
      if (useConnection().getCurrentAddress === "") {
        useConnection().connect();
        return;
      }

      this.mintProcess = nft;

      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );

      try {
        this.mintProcess.status = "Checking for allowance for UTT token";
        let allowance = await this.getTokenAllowance();
        allowance = ethers.utils.formatEther(allowance.toString());
        console.log(allowance);
        console.log(this.currentNftMintPrice);
        if (allowance < this.currentNftMintPrice) {
          throw Error(`Insufficient allowance`);
        }

        this.mintProcess.status = "Uploading metadata to ipfs...";
        const metadata = await useIpfs().storeData(nft);

        this.mintProcess.status = "metadata uploaded !";

        await this.updateNftMintPrice();

        this.mintProcess.status = "Uploaded, action from wallet required";
        let tx = await CONTRACT.connect(signer.getSigner()).mintNft(
          metadata.url,
          ethers.utils.parseEther(this.currentNftMintPrice.toString())
        );
        this.mintProcess.status = "Pending to be confirmed";
        let receipt = await tx.wait();
        let tokenId = parseInt(receipt.events[2].topics[3], 16);
        this.mintProcess.status = `Your NFT withd id ${tokenId} successfully minted ! `;
        this.mintProcess = false;
        await this.updateTokenBalance();
        return tokenId;
      } catch (e) {
        console.log(e.message);
        this.mintProcess = false;
        return e.message;
      }
    },

    async approve(approveValue) {
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );
      this.approving = true;
      let tx = await CONTRACT.connect(signer.getSigner()).approve(
        MARKETPLACE_ADDRESS,
        ethers.utils.parseEther(approveValue.toString())
      );
      await tx.wait();
      this.approving = false;
    },

    async getTokenAllowance() {
      return await CONTRACT.allowance(
        useConnection().currentAddress.address,
        MARKETPLACE_ADDRESS
      );
    },

    async getParsedTokenAllowance() {
      let allowance = await this.getTokenAllowance();
      return ethers.utils.formatEther(allowance);
    },

    async approveOneNft({ tokenId, address }) {
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );
      this.approving = true;
      let nftContract = new Contract(address, nftAbi.abi, signer.getSigner());
      try {
        let tx = await nftContract.approve(MARKETPLACE_ADDRESS, tokenId);
        await tx.wait();
      } catch (error) {
        this.approving = false;
      }

      this.approving = false;
    },

    async approveAllNfts({ address }) {
      const signer = new ethers.providers.Web3Provider(
        useConnection().getWallets[0].provider
      );
      this.approving = true;
      let nftContract = new Contract(address, nftAbi.abi, signer.getSigner());
      let tx = await nftContract.setApprovalForAll(MARKETPLACE_ADDRESS, true);
      await tx.wait();
      this.approving = false;
    },

    async getNftUri(nftAddress, tokenId) {
      const nftContract = new ethers.Contract(
        nftAddress,
        nftAbi.abi,
        alchemyProvider
      );

      try {
        let tx = await nftContract.tokenURI(tokenId);
        return tx;
      } catch (e) {
        console.log(e.message);
      }
    },
  },
});
