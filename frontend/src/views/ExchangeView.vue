<script setup>
import { ethers } from "ethers";
import { onMounted, ref, watch } from "vue";
import { useSwapPool } from "../stores/swapPool";
import Vue3Autocounter from "vue3-autocounter";
const swapPool = useSwapPool();
const loading = ref(false);
const swapped = ref(false);
const t1Address = ref(swapPool.getT1Address);
const t2Address = ref(swapPool.getT2Address);

const tokenFrom = ref("");
const tokenFromAmount = ref();
const tokenToAmount = ref(0);

onMounted(() => {
  t1Address.value = swapPool.getT1Address;
  t2Address.value = swapPool.getT2Address;
  tokenFrom.value = t1Address.value;
});

function getSwapping() {
  if (tokenFrom.value === t1Address.value) {
    return "UTT for nUSD";
  } else {
    return "nUSD for UTT";
  }
}

function switchTokens() {
  if (tokenFrom.value === t1Address.value) {
    tokenFrom.value = t2Address.value;
  } else {
    tokenFrom.value = t1Address.value;
  }
}

async function swap() {
  loading.value = true;
  const to =
    tokenFrom.value == t1Address.value ? t2Address.value : t1Address.value;
  try {
    swapped.value = await swapPool.swap(
      tokenFromAmount.value,
      tokenToAmount.value,
      tokenFrom.value,
      to
    );
    loading.value = false;
  } catch (e) {
    switch (e.data.message) {
      case "execution reverted: ERC20: insufficient allowance":
        swapped.value = await swapPool.approveAndSwap(
          tokenFromAmount.value,
          tokenToAmount.value,
          tokenFrom.value,
          to
        );
        break;
    }
    loading.value = false;
  }

  setTimeout(() => {
    swapped.value = false;
  }, 5000);
}

watch(tokenFromAmount, async (newAmount, _) => {
  if (newAmount === 0) return;
  loading.value = true;
  const data = await swapPool.getAmountOut(newAmount, tokenFrom.value);
  tokenToAmount.value = +ethers.utils.formatEther(data[0]);
  loading.value = false;
});

watch(tokenFrom, async () => {
  if (tokenFromAmount.value === 0 || tokenFromAmount.value === undefined)
    return;
  loading.value = true;
  const data = await swapPool.getAmountOut(
    tokenFromAmount.value,
    tokenFrom.value
  );
  tokenToAmount.value = +ethers.utils.formatEther(data[0]);
  loading.value = false;
});
</script>

<template>
  <main>
    <q-card>
      <form>
        <div class="text-body1" :style="{ textAlign: 'center' }">
          Swapping {{ getSwapping() }}
          <small @click="switchTokens()"><u>switch</u></small>
        </div>
        <q-input
          outlined
          :label="tokenFrom == t1Address ? 'UTT' : 'nUSD'"
          required
          :placeholder="`Enter amount of ${
            tokenFrom == t1Address ? 'UTT' : 'nUSD'
          } Tokens`"
          v-model.lazy.number="tokenFromAmount"
        />
        <q-input
          outlined
          :label="tokenFrom == t1Address ? 'nUSD' : 'UTT'"
          :readonly="true"
          :style="{ fontWeight: 'bolder' }"
          v-model="tokenToAmount"
        />
        <input
          :disabled="tokenFromAmount <= 0 || tokenToAmount <= 0"
          type="submit"
          value="SWAP"
          class="btn-grad"
          @click.prevent="swap()"
        />
        <small :style="{ textAlign: 'center' }" v-if="loading"
          >Loading...</small
        >
        <div v-if="swapped" class="text-body1 text-center text-positive">
          Swapped Successfully !
        </div>
      </form>
    </q-card>
  </main>
</template>

<style scoped>
.q-card {
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
    rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px,
    rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
}

.q-input {
  padding: 15px;
}

main {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

form {
  border: 2px solid white;
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-top: 20px;
  width: 400px;
  padding: 15px;
  border-radius: 10px;
}

u {
  cursor: pointer;
}

.connect {
  display: flex;
  justify-content: center;
  text-align: center;
  font-weight: bold;
}

.btn-grad {
  background-image: linear-gradient(
    90deg,
    rgba(187, 185, 210, 1) 0%,
    rgba(217, 217, 250, 0.950315160243785) 49%,
    rgba(0, 212, 255, 1) 100%
  );
  margin: 10px;
  padding: 15px 45px;
  text-align: center;
  text-transform: uppercase;
  transition: 0.5s;
  background-size: 200% auto;
  box-shadow: 0 0 20px #eee;
  border-radius: 10px;
  display: block;
  font-weight: bold;
  border: 0;
}

.btn-grad:hover {
  background-position: right center; /* change the direction of the change here */
  color: #fff;
  text-decoration: none;
  cursor: pointer;
}
/* 
  form input {
    border-radius: 10px;
    padding: 15px 20px;
    border: none;
  }

  form input:focus {
    border: none;
  } */

.btns {
  display: flex;
  justify-content: space-around;
  text-decoration: underline;
  cursor: pointer;
  color: #e55d87;
}
</style>
