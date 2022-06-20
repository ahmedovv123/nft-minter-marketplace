import { defineStore } from "pinia";
import { NFTStorage } from "nft.storage";
import { NFT_STORAGE_TOKEN } from "../../config.json";

export const useIpfs = defineStore({
  id: "ipfs",
  state: () => ({
    client: new NFTStorage({ token: NFT_STORAGE_TOKEN }),
  }),
  getters: {
    getClient: (state) => state.client,
  },
  actions: {
    async storeData({ name, description, image }) {
      console.log(image);
      const metadata = await this.client.store({
        name,
        description,
        image,
      });

      return metadata;
    },

    // async getDataByCID(CID) {
    //   const data = await this.client.
    // }
  },
});
