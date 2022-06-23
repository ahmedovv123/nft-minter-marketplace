<script setup>
import { onMounted, ref, watch } from "vue";
import { useNftMarketplace } from "../stores/nftMarketplace";
import TheNft from "../components/TheNft.vue";

const nftMarketplace = useNftMarketplace();

const nfts = ref(nftMarketplace.getNfts);
const buyingProcess = ref(nftMarketplace.buyingProcess);
const showWarning = ref(true);
const loadedFromStorage = ref(false);

onMounted(() => {
  loadedFromStorage.value = nftMarketplace.loadedFromStorage;
});

watch(
  () => nftMarketplace.getNfts,
  function () {
    nfts.value = nftMarketplace.getNfts;
    loadedFromStorage.value = nftMarketplace.loadedFromStorage;
  }
);

watch(
  () => nftMarketplace.loadedFromStorage,
  function () {
    loadedFromStorage.value = nftMarketplace.loadedFromStorage;
  }
);

watch(
  () => nftMarketplace.buyingProcess,
  function () {
    buyingProcess.value = nftMarketplace.buyingProcess;
    console.log(buyingProcess.value);
  }
);

async function fetchNfts() {
  await nftMarketplace.loadNfts(true);
}
</script>

<template>
  <q-banner
    v-if="showWarning && loadedFromStorage"
    inline-actions
    rounded
    class="bg-orange text-white"
  >
    NFTs loaded from browser storage, if you wish you can load them from
    contract
    <template v-slot:action>
      <q-btn @click="fetchNfts()" flat label="Load" />
      <q-btn @click="showWarning = false" flat label="Dismiss" />
    </template>
  </q-banner>
  <div class="q-pa-md">
    <div v-if="nfts.length" class="row justify-center q-gutter-sm">
      <q-intersection
        v-for="nft in nfts"
        :key="nft.tokenId"
        transition="scale"
        class="nft-card"
      >
        <TheNft :nft="nft" />
      </q-intersection>
    </div>
  </div>
  <q-dialog :model-value="buyingProcess !== false" persistent>
    <q-card style="width: 700px; height: 350px">
      <q-card-section>
        <div class="text-h6">Buying NFT</div>
        <b>Status: {{ buyingProcess.status }} </b>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section class="q-pt-none">
        <p>NFT Address:</p>
        {{ buyingProcess.nftAddress }}
        <q-separator></q-separator>
        <br />
        <p>NFT Token ID:</p>
        {{ buyingProcess.tokenId }}
        <q-separator></q-separator>
        <br />
        <p>NFT Price:</p>
        {{ buyingProcess.price }} ETH
        <q-separator></q-separator>
        <br />
        <q-inner-loading
          :showing="buyingProcess.status !== 'Transaction finished'"
        >
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.nft-card {
  /* height: 300px;
  width: 300px; */
  margin-top: 30px;
  /* text-align: center; */
}
</style>
