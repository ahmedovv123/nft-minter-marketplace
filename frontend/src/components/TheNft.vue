<script setup>
import { ref } from 'vue'
import { useNftMarketplace } from "../stores/nftMarketplace";
import Ethereum from '../../public/ethereum-brands.svg'
const nftMarkeplace = useNftMarketplace();

const props = defineProps({
  nft: Object,
});

async function buyNft() {
  let nftObj = {
    nftAddress: props.nft.contractAddress,
    tokenId: props.nft.tokenId,
    price: props.nft.price,
  };
  await nftMarkeplace.buyNft(nftObj);
}
</script>

<template>
  <q-card class="q-ma-sm">
    <q-img :ratio="1" spinner-color="white" :src="props.nft.metadata.image">
      <template v-slot:loading>
        <q-spinner-gears color="blue" />
      </template>
    </q-img>

    <q-card-section>
      <div class="text-h6">
        {{ props.nft.metadata.name }} #{{ props.nft.tokenId }}
      </div>
      <div class="text-subtitle1"> {{props.nft.price}} <img :style="{width: '8px'}" :src="Ethereum" alt=""></div>
      <q-separator></q-separator>
      <br />
      <div class="row items-center  justify-evenly">
        <q-btn :disable="nftMarkeplace.getEthBalance < props.nft.price" @click="buyNft()" color="primary" label="BUY" />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>

.q-card {
  transition: all 0.3s ease-in-out;
}
 .q-card:hover {
  margin-top: -3px;
 }

</style>
