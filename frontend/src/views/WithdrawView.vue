<script setup>
import { ref, watch } from "vue";
import { useNftMarketplace } from "../stores/nftMarketplace";
import { useConnection } from "../stores/connection";
const nftMarketplace = useNftMarketplace();
const connection = useConnection();

const earnings = ref(nftMarketplace.getEarnings);
const loading = ref(false);

watch(
  () => nftMarketplace.getEarnings,
  function () {
    earnings.value = nftMarketplace.getEarnings;
  }
);

async function withdraw() {
  loading.value = true;
  await nftMarketplace.withdraw().catch(() => (loading.value = false));
  loading.value = false;
}
</script>

<template>
  <div class="column items-center">
    <q-card
      v-if="connection.currentAddress"
      :style="{ height: '200px', width: '500px' }"
      class="q-mt-xl"
    >
      <div class="column items-center q-mt-lg justify-center">
        <div class="text-subtitle1">Your earnings so far</div>
        <div class="q-mt-md text-h3 text-positive">{{ earnings }} MATIC</div>
        <q-btn
          :disable="earnings === 0"
          @click="withdraw"
          class="q-mt-md"
          color="primary"
          label="GET THEM!"
        />
      </div>
      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
    <q-card v-else :style="{ height: '200px', width: '500px' }" class="q-mt-xl">
      <div class="column items-center q-mt-lg justify-center">
        <div class="text-subtitle1">You are not connected to wallet !</div>
        <q-btn
          @click="connection.connect()"
          class="q-mt-md"
          color="primary"
          label="CONNECT"
        />
      </div>
    </q-card>
  </div>
</template>

<style scoped>
.q-card {
  box-shadow: rgba(0, 0, 0, 0.15) 2.4px 2.4px 3.2px;
}
</style>
