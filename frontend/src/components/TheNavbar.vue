<script setup>
import { onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useConnection } from "../stores/connection";
import { useNftMarketplace } from "../stores/nftMarketplace";
import WrongNetwork from "./WrongNetwork.vue";
const connection = useConnection();
const nftMarkeplace = useNftMarketplace();
const currentAddress = ref("");
const currentChain = ref("");
const tokenBalance = ref(0);

onMounted(() => {
  currentAddress.value = connection.getCurrentAddress;
  currentChain.value = connection.getCurrentChain;
  tokenBalance.value = nftMarkeplace.getTokenBalance;
});

watch(
  () => connection.getCurrentAddress,
  function () {
    currentAddress.value = connection.getCurrentAddress;
  }
);

watch(
  () => connection.getCurrentChain,
  function () {
    currentChain.value = connection.getCurrentChain;
  }
);

watch(
  () => nftMarkeplace.getTokenBalance,
  function () {
    tokenBalance.value = nftMarkeplace.getTokenBalance;
  }
);

async function connectWallet() {
  await connection.connect();
}

async function disconnect() {
  await connection.disconnect();
}
</script>

<template>
  <nav>
    <q-toolbar class="bg-primary text-white shadow-2">
      <RouterLink to="/"><q-btn stretch flat label="Home" /></RouterLink>
      <RouterLink to="/mint"
        ><q-btn stretch flat label="Mint / sell"
      /></RouterLink>
      <RouterLink to="/nfts"><q-btn stretch flat label="NFTs" /></RouterLink>
      <RouterLink to="/withdraw"><q-btn stretch flat label="withdraw" /></RouterLink>
      <RouterLink to="/exchange"><q-btn stretch flat label="exchange" /></RouterLink>
      <q-space />
      <div div v-if="currentAddress">
        UTT Balance: &nbsp;
        <label>{{ tokenBalance.toLocaleString("en-US") }}</label>
      </div>
      <q-space />
      <div v-if="currentAddress">
        <label> {{ currentAddress.address }}</label>
        <q-btn @click="disconnect" stretch flat label="Disconnect" />
      </div>
      <div v-else>
        <q-btn @click="connectWallet" stretch flat label="Connect wallet" />
      </div>
    </q-toolbar>
  </nav>
  <WrongNetwork
    :visible="currentChain === '0x3' || currentChain === '' ? false : true"
  />
</template>

<style scoped>
label {
  padding: 6px 13px 6px 13px;
  background-color: hsla(160, 100%, 37%, 1);
  border-radius: 30px;
}

a,
.green {
  text-decoration: none;
  color: rgb(49, 240, 32);
  transition: 0.4s;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;

  box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
</style>
