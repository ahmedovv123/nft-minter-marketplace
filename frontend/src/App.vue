<script setup>
import { RouterView } from "vue-router";
import TheNavbar from "./components/TheNavbar.vue";
import { onUnmounted, onMounted } from "vue";
import { useConnection } from "../src/stores/connection";
import { useNftMarketplace } from "../src/stores/nftMarketplace";
import { LoadingBar } from "quasar";
import "animate.css";

LoadingBar.setDefaults({
  color: "purple",
  size: "5px",
  position: "top",
});

const connection = useConnection();
const nftMarketplace = useNftMarketplace();

onUnmounted(() => {
  connection.walletUnsubscribe();
});

onMounted(async () => {
  // LoadingBar.start();
  await connection.tryAutoConnect();
  await nftMarketplace.loadNfts();
  await nftMarketplace.updateNftMintPrice();
  await nftMarketplace.updateNftSellFee();
  // LoadingBar.stop();
});
</script>

<template>
  <TheNavbar />
  <RouterView />
</template>

<style scoped>
html,
body {
  margin: 0px !important;
  padding: 0px !important;
}
</style>
