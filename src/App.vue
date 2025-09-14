<script setup lang="ts">
import { onMounted, ref } from "vue"

const loading = ref(true)
const conectionInternet = ref<boolean>()

setTimeout(() => {
  loading.value = false
}, 4000)

onMounted(async () => {
  conectionInternet.value = navigator.onLine
})
</script>

<template>
  <div>
    <div class="absolute-full flex flex-center flex-col text-center">
      <q-spinner-ball v-if="loading" color="primary" size="12em" />
      <p v-if="!conectionInternet" class="text-center">
        No hay conexion a internet...
      </p>
    </div>
    <router-view v-if="(conectionInternet, !loading)" />
  </div>
</template>
