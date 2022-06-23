<script setup>
import { useNftMarketplace } from "../stores/nftMarketplace";
import { ref, watch } from "vue";
const nftMarkeplace = useNftMarketplace();
const priceInUsd = ref(0);
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

watch(
  () => nftMarkeplace.getMaticPriceInUsd,
  function () {
    priceInUsd.value = Number(
      props.nft.price * nftMarkeplace.getMaticPriceInUsd
    ).toFixed(3);
  }
);
</script>

<template>
  <div class="card">
    <div class="card__body">
      <div class="card__image">
        <q-img :ratio="1" spinner-color="white" :src="props.nft.metadata.image">
          <template v-slot:loading>
            <q-spinner-gears color="blue" />
          </template>
        </q-img>
      </div>
    </div>
    <div class="q-mt-lg text-h5 text-bold row justify-center">
      {{ props.nft.metadata.name }}
    </div>
    <div class="card__info">
      <p><b>Price:</b> MATIC {{ props.nft.price }}</p>
      <p>(${{ priceInUsd }})</p>
    </div>
    <div class="card__footer">
      <q-btn
        :disabled="nftMarkeplace.getEthBalance < props.nft.price"
        @click="buyNft()"
        class="card__btn card__btn--primary"
        >Buy Now</q-btn
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: #eceff1;
  background-repeat: no-repeat;
  background-size: cover;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "DM Sans", system-ui, sans-serif;
  color: #263238;
}

.card {
  width: 22rem;
  max-width: 90%;
  border-radius: 0.5rem 0.5rem 1.25rem 0.5rem;
  padding: 0.75rem;
  text-decoration: none;
  color: inherit;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
    rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px,
    rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
  &__body {
    box-shadow: rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset;
    border-radius: 1.25rem;
    // padding: 1rem;
  }
  &__top {
    display: flex;
    font-weight: 500;
  }
  &__owner,
  &__creator {
    width: 50%;
    display: flex;
  }
  &__owner {
    position: relative;
    &::after {
      content: "";
      position: absolute;
      top: 0;
      right: -1px;
      width: 2px;
      height: 100%;
      border-radius: 2px;
      background: #eceff1;
    }
  }
  &__creator {
    flex-direction: row-reverse;
    text-align: right;
  }
  &__avatar {
    width: 3rem;
    height: 3rem;
    background: #eceff1;
    border-radius: 100%;
    flex-shrink: 0;
  }
  &__user {
    padding: 0 0.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    &__title {
      font-size: 0.75rem;
      color: #b0bec5;
    }
  }
  &__image {
    position: relative;
    overflow: hidden;
    border-radius: 1rem;
    background: #eceff1;
  }
  &__info {
    margin: 0.75rem;
    display: flex;
    justify-content: space-between;
    p {
      margin: 0;
    }
  }
  &__footer {
    padding: 0.75rem;
    border-radius: 0.75rem 0.75rem 1.75rem 1.75rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__btn {
    width: 48%;
    padding: 1rem;
    text-align: center;
    font-weight: 500;
    transition: all 200ms ease;
    cursor: pointer;
    &--primary {
      background: #263238;
      color: #eceff1;
      border-radius: 0.5rem 0.5rem 1.25rem 0.5rem;
    }
    &--secondary {
      border-radius: 0.5rem 0.5rem 0.5rem 1.25rem;
      &:hover {
        background: #eceff1;
        color: #304ffe;
      }
    }
  }
}
</style>
