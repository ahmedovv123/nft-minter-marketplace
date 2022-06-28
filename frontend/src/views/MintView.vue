<script setup>
import { nextTick, ref, watch } from "vue";
import { useNftMarketplace } from "../stores/nftMarketplace";
import ConfettiExplosion from "vue-confetti-explosion";
import { ethers } from "ethers";
const nftMarketplace = useNftMarketplace();
const tab = ref("mint");
const mintedNftTokenId = ref(0);
const confettiVisible = ref(false);
const nftToMint = ref({});
const nftToSell = ref({});
const previewImg = ref("");
const nftMintPrice = ref(nftMarketplace.getCurrentNftMinPrice);
const nftSellFee = ref(nftMarketplace.getNftSellFee);
const mintingProcess = ref(nftMarketplace.mintProcess);
const listingProcess = ref(nftMarketplace.listingProcess);
const allowanceNotMet = ref(false);
const approveNotMet = ref(false);
const approveNftModal = ref(false);
const approveModal = ref(false);
const approveValue = ref(0);
const copied = ref(false);
const refreshingPrice = ref(false);

watch(
  () => nftToMint.value.image,
  async function () {
    const file = nftToMint.value.image;
    if (file) previewImg.value = URL.createObjectURL(file);
  }
);

watch(
  () => nftMarketplace.getCurrentNftMinPrice,
  function () {
    nftMintPrice.value = nftMarketplace.getCurrentNftMinPrice;
  }
);

watch(
  () => nftMarketplace.getNftSellFee,
  function () {
    nftSellFee.value = nftMarketplace.getNftSellFee;
  }
);

watch(
  () => nftMarketplace.mintProcess,
  function () {
    mintingProcess.value = nftMarketplace.mintProcess;
  }
);

watch(
  () => nftMarketplace.listingProcess,
  function () {
    listingProcess.value = nftMarketplace.listingProcess;
  }
);

async function onSubmit() {
  mintedNftTokenId.value = 0;
  let result = await nftMarketplace.mintNft(nftToMint.value);
  console.log(result);

  if (typeof result !== "number") {
    switch (result) {
      case "Insufficient allowance":
        allowanceNotMet.value = true;
        break;
    }
  } else {
    mintedNftTokenId.value = result;
    explode();
    onReset();
  }

  // onReset();
}

async function explode() {
  confettiVisible.value = false;
  await nextTick();
  confettiVisible.value = true;
}

async function onSubmitSell() {
  let result = await nftMarketplace.listNft(nftToSell.value);
  if (result != true) {
    switch (result) {
      case "No Approval":
        approveNotMet.value = true;
        break;
    }
  }
}

function onReset() {
  nftToMint.value = {};
  previewImg.value = "";
}

function onResetSell() {
  nftToSell.value = {};
}

function isValidAddress(address) {
  try {
    ethers.utils.getAddress(address);
    return true;
  } catch (e) {
    return false;
  }
}

function isValidPrice(price) {
  console.log(isNaN(Number(price)));
  if (price <= 0 || isNaN(Number(price))) return false;
  return true;
}

function copyAddress() {
  navigator.clipboard.writeText(nftMarketplace.getNftAddress);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 3000);
}

async function refreshPrice() {
  refreshingPrice.value = true;
  await nftMarketplace.updateNftMintPrice();
  refreshingPrice.value = false;
}

async function approve() {
  await nftMarketplace.approve(approveValue.value);
  console.log("Approved!");
  approveModal.value = false;
  allowanceNotMet.value = false;
}

async function approveOneNft() {
  await nftMarketplace.approveOneNft(nftToSell.value);
  approveNftModal.value = false;
  approveNotMet.value = false;
}

async function approveAllNfts() {
  await nftMarketplace.approveAllNfts(nftToSell.value);
  approveNftModal.value = false;
  approveNotMet.value = false;
}
</script>

<template>
  <div class="row justify-center q-gutter-sm">
    <div class="" style="max-width: 600px">
      <q-tabs
        v-model="tab"
        class="text-teal"
        active-color="primary"
        align="justify"
        narrow-indicator=""
      >
        <q-tab name="mint" label="Mint NFT" />
        <q-tab name="sell-your" label="Sell your NFT" />
      </q-tabs>
    </div>
    <ConfettiExplosion v-if="confettiVisible" />
  </div>
  <div class="row q-mt-lg justify-center q-gutter-sm">
    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="mint">
        <div class="row justify-center">
          <q-banner
            rounded
            :style="{ width: '70%' }"
            class="q-mt-lg text-center q-mb-xl bg-orange text-white shadow-5"
          >
            <div class="text-body2">
              In order to mint a NFT, you need to have some UTT Tokens, current
              price to mint is
              <div
                :style="{ color: '#1976d2' }"
                class="text-h5 text-center text-weight-bolder"
              >
                {{ nftMintPrice }} UTT
                <q-icon
                  v-if="!refreshingPrice"
                  @click="refreshPrice()"
                  class="cursor-pointer"
                  name="refresh"
                />
                <q-spinner v-else color="primary" />
              </div>
              <div class="text-body1 text-center">
                Еach mint increases the price by 1%
                <q-icon name="north" />
              </div>
            </div>
          </q-banner>
        </div>

        <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
          <q-input
            filled
            v-model="nftToMint.name"
            label="Asset Name *"
            hint="My NFT"
            lazy-rules
            :rules="[
              (val) => (val && val.length > 0) || 'Please type something',
            ]"
          />

          <q-input
            filled
            v-model="nftToMint.description"
            label="Asset Description *"
            hint="My brilliant cat"
            lazy-rules
            :rules="[
              (val) =>
                (val !== null && val !== '') || 'Please type description',
            ]"
          />

          <q-file outlined v-model="nftToMint.image" label="Upload NFT Image">
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>

          <div class="row justify-center">
            <q-card :style="{ width: '400px' }" bordered v-if="previewImg">
              <q-img :ratio="1" :src="previewImg" alt="" />
            </q-card>
          </div>

          <div>
            <q-btn
              :disable="
                nftMarketplace.tokenBalance < nftMarketplace.currentNftMintPrice
              "
              label="MINT"
              type="submit"
              color="primary"
            />
            <q-btn
              label="Reset"
              type="reset"
              color="primary"
              flat
              class="q-ml-sm"
            />
          </div>
          <div
            class="text-body1 text-negative"
            v-if="
              nftMarketplace.tokenBalance < nftMarketplace.currentNftMintPrice
            "
          >
            Your balance is below the mint fee
          </div>
          <div
            v-if="mintedNftTokenId"
            class="column items-center text-body1 text-positive"
          >
            Freshly minted NFT with id
            <div class="text-orange">{{ mintedNftTokenId }}</div>
            is your now !
          </div>
        </q-form>
        <div class="row justify-center">
          <q-banner
            v-if="allowanceNotMet"
            rounded
            class="q-mt-lg q-mb-lg bg-negative text-white shadow-5"
          >
            <div class="text-body2">
              <q-icon name="warning" />
              We can't mint your NFT ! You need to approve us to spend your UTT
              Tokens
            </div>
            <template v-slot:action>
              <q-btn
                @click="allowanceNotMet = false"
                flat
                color="white"
                label="Dismiss"
              />
              <q-btn
                @click="approveModal = true"
                flat
                color="positive"
                label="Approve"
              />
            </template>
          </q-banner>
        </div>
      </q-tab-panel>
      <q-tab-panel name="sell-your">
        <div class="row justify-center">
          <q-banner
            rounded
            :style="{ width: '70%' }"
            class="q-mt-lg text-center q-mb-xl bg-orange text-white shadow-5"
          >
            <div class="text-body2">
              Listing NFTs minted here will not have any fees, otherwise it will
              worth
              <div
                :style="{ color: '#1976d2' }"
                class="text-h5 text-center text-weight-bolder"
              >
                {{ nftSellFee }} MATIC
                <div class="text-subtitle1">
                  {{
                    `($${Number(
                      nftMarketplace.getMaticPriceInUsd * nftSellFee
                    ).toFixed(3)})`
                  }}
                </div>
              </div>
              <u>{{ nftMarketplace.getNftAddress }}</u
              >&nbsp;
              <q-icon
                v-if="!copied"
                @click="copyAddress"
                class="copyAddress"
                size="20px"
                name="content_copy"
              />
              <q-icon v-else size="20px" name="done" />
            </div>
          </q-banner>
        </div>
        <q-form @submit="onSubmitSell" @reset="onResetSell" class="q-gutter-md">
          <q-input
            filled
            v-model="nftToSell.address"
            label="NFT Address"
            :hint="`Our native NFT address - ${nftMarketplace.getNftAddress}`"
            lazy-rules
            :rules="[
              (val) => (val && val.length > 0) || 'Please enter nft address',
              (val) => isValidAddress(val) || 'Address is invalid',
            ]"
          />

          <q-input
            filled
            v-model="nftToSell.tokenId"
            type="number"
            label="NFT token ID"
            hint="1"
            lazy-rules
            :rules="[
              (val) => (val !== null && val !== '') || 'Please enter token id',
              (val) => val > 0 || 'Please type a real token id',
            ]"
          />

          <q-input
            filled
            v-model="nftToSell.price"
            :label="`Asset Price ($${
              isValidPrice(nftToSell.price)
                ? Number(
                    nftToSell.price * nftMarketplace.getMaticPriceInUsd
                  ).toFixed(3)
                : ''
            }) `"
            lazy-rules
            suffix="MATIC"
            :rules="[(val) => isValidPrice(val) || 'Please type a real price']"
          />
          <div>
            <q-btn label="Submit" type="submit" color="primary" />
            <q-btn
              label="Reset"
              type="reset"
              color="primary"
              flat
              class="q-ml-sm"
            />
          </div>
        </q-form>
        <div class="row justify-center">
          <q-banner
            v-if="approveNotMet"
            rounded
            class="q-mt-lg q-mb-lg bg-negative text-white shadow-5"
          >
            <div class="text-body2">
              <q-icon name="warning" />
              We cant't list your NFT ! You need to approve us to be able to
              transfer it.
            </div>
            <template v-slot:action>
              <q-btn
                @click="approveNotMet = false"
                flat
                color="white"
                label="Dismiss"
              />
              <q-btn
                @click="approveNftModal = true"
                flat
                color="positive"
                label="Approve"
              />
            </template>
          </q-banner>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
  <q-dialog :model-value="mintingProcess !== false" persistent>
    <q-card style="width: 700px; height: 280px">
      <q-card-section>
        <div class="text-h6">Minting NFT</div>
        <b>Status: {{ mintingProcess.status }} </b>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section class="q-pt-md">
        <p>NFT Name:</p>
        {{ mintingProcess.name }}
        <q-separator></q-separator>
        <br />
        <p>NFT Description:</p>
        {{ mintingProcess.description }}
        <q-separator></q-separator>
        <br />
        <q-inner-loading
          :showing="mintingProcess.status !== 'NFT successfully minted !'"
        >
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-dialog :model-value="listingProcess !== false" persistent>
    <q-card style="width: 700px; height: 350px">
      <q-card-section>
        <div class="text-h6">Listing NFT</div>
        <b>Status: {{ listingProcess.status }} </b>
      </q-card-section>
      <q-separator></q-separator>
      <q-card-section class="q-pt-none">
        <p>NFT Address:</p>
        {{ listingProcess.address }}
        <q-separator></q-separator>
        <br />
        <p>NFT Token ID:</p>
        {{ listingProcess.tokenId }}
        <q-separator></q-separator>
        <br />
        <p>NFT Price:</p>
        {{ listingProcess.price }} MATIC
        <q-separator></q-separator>
        <br />
        <q-inner-loading
          :showing="listingProcess.status !== 'Listed successfully !'"
        >
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-dialog>
  <q-dialog v-model="approveModal" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Approvement</div>
        <br />
        <div class="q-pr-lg text-subtitle1">
          We recommend to approve the current mint price which is
          <b
            @click="approveValue = nftMintPrice"
            class="cursor-pointer text-primary"
            >{{ nftMintPrice }} UTT</b
          >
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          dense
          v-model="approveValue"
          autofocus
          @keyup.enter="prompt = false"
        />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn @click="approve" flat label="Approve" />
      </q-card-actions>
      <q-inner-loading :showing="nftMarketplace.approving">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
  <q-dialog v-model="approveNftModal" persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Approvement</div>
        <br />
        <div class="q-pr-lg text-subtitle1">
          Confirm you want to approve us for NFT
          <br />
          <br />
          <b>Address: </b> {{ nftToSell.address }}
          <br />
          <b>Token ID: </b> {{ nftToSell.tokenId }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn @click="approveOneNft" flat label="Approve only this" />
        <q-btn @click="approveAllNfts" flat label="Approve All NFTs" />
      </q-card-actions>
      <q-inner-loading :showing="nftMarketplace.approving">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.copyAddress {
  cursor: pointer;
}
.q-tab-panels {
  width: 60%;
}
.q-banner {
  justify-items: center;
  box-shadow: rgba(0, 0, 0, 0.09) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px,
    rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px,
    rgba(0, 0, 0, 0.09) 0px 32px 16px;
}

.q-tab-panels {
  border-radius: 15px;
  /* box-shadow: 10px 10px 10px #888888; */
  box-shadow: rgba(50, 50, 93, 0.25) 0px 50px 100px -20px,
    rgba(0, 0, 0, 0.3) 0px 30px 60px -30px,
    rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset;
  /* box-shadow: rgba(240, 46, 170, 0.4) 5px 5px, rgba(240, 46, 170, 0.3) 10px 10px, rgba(240, 46, 170, 0.2) 15px 15px, rgba(240, 46, 170, 0.1) 20px 20px, rgba(240, 46, 170, 0.05) 25px 25px; */
  /* box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset, rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset, rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px; */
}
</style>
