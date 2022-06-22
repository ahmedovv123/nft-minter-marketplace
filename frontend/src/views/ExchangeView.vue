<script setup>
import { ethers } from 'ethers';
import { onMounted, ref, watch } from 'vue'
import { useSwapPool } from '../stores/swapPool'
const swapPool = useSwapPool();
const loading = ref(false);
const t1Address = ref(swapPool.getT1Address);
const t2Address = ref(swapPool.getT2Address);

const tokenFrom = ref('')
const tokenFromAmount = ref();
const tokenToAmount = ref(0);

onMounted(() => {
    t1Address.value = swapPool.getT1Address;
    t2Address.value = swapPool.getT2Address;
    tokenFrom.value = t1Address.value;
})

function getSwapping() {
    if (tokenFrom.value === t1Address.value) {
        return 'UTT for nUSD'
    } else {
        return 'nUSD for UTT'
    }
}

function switchTokens() {
    if (tokenFrom.value === t1Address.value) {
        tokenFrom.value = t2Address.value
    } else {
        tokenFrom.value = t1Address.value
    }
}

async function swap() {
    loading.value = true;
    const to = tokenFrom.value == t1Address.value ? t2Address.value : t1Address.value;
    await swapPool.swap(tokenFromAmount.value, tokenToAmount.value, tokenFrom.value, to)
    loading.value = false;
}

watch(tokenFromAmount, async (newAmount, _) => {
    if (newAmount === 0) return;
    loading.value = true;
    const data = await swapPool.getAmountOut(newAmount, tokenFrom.value)
    tokenToAmount.value = ethers.utils.formatEther(data[0]);
    loading.value = false;
})

watch(tokenFrom, async () => {
    if (tokenFromAmount.value === 0 || tokenFromAmount.value === undefined) return;
    loading.value = true;
    const data = await swapPool.getAmountOut(tokenFromAmount.value, tokenFrom.value)
    tokenToAmount.value = ethers.utils.formatEther(data[0]);
    loading.value = false;
})

</script>

<template>
    <main>
        <form>
            <label align="center">Swapping {{ getSwapping() }} <small @click="switchTokens()"><u>switch</u></small> </label>
            <label>{{ tokenFrom == t1Address ? 'UTT' : 'nUSD' }}</label>
            <input required min="1" type="number" :placeholder="`Enter amount of ${tokenFrom == t1Address ? 'UTT' : 'nUSD'} Tokens`" v-model.lazy.number="tokenFromAmount">
            <label>{{ tokenFrom == t1Address ? 'nUSD' : 'UTT'}} <small v-if="loading">Loading...</small></label>
            <input disabled :placeholder="`You will get ${tokenToAmount}`">
            <input :disabled="tokenFromAmount <= 0 || tokenToAmount <= 0" type="submit" value="SWAP" class="btn-grad" @click="swap()"/>
        </form>
    </main>
</template>

<style scoped>
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

  form label {
    margin-bottom: 10px;
  }

  form input {
    margin-bottom: 10px;
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
    background-image: linear-gradient(to right, #E55D87 0%, #5FC3E4  51%, #E55D87  100%);
    margin: 10px;
    padding: 15px 45px;
    text-align: center;
    text-transform: uppercase;
    transition: 0.5s;
    background-size: 200% auto;
    color: white;            
    box-shadow: 0 0 20px #eee;
    border-radius: 10px;
    display: block;
    font-weight: bold;
  }

  .btn-grad:hover {
    background-position: right center; /* change the direction of the change here */
    color: #fff;
    text-decoration: none;
    cursor: pointer;
  }

  form input {
    border-radius: 10px;
    padding: 15px 20px;
    border: none;
  }

  form input:focus {
    border: none;
  }

  .btns {
    display: flex;
    justify-content: space-around;
    text-decoration: underline;
    cursor: pointer;
    color: #E55D87;
  }
</style>