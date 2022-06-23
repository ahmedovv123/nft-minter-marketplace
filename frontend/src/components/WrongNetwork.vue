<script setup>
import { useConnection } from "../stores/connection";
import { defineProps } from "vue";

const props = defineProps({
  visible: Boolean,
});
const connection = useConnection();
</script>

<template>
  <q-dialog :model-value="props.visible" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="public_off" color="primary" text-color="white" />
        <span class="q-ml-sm">You are currently on wrong network.</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          @click="connection.switchToMumbai()"
          flat
          label="Switch to Polygon Mumbai Network"
          color="primary"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
