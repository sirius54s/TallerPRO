<script setup lang="ts">
import { onMounted } from "vue"
import { useAuthStore } from "src/stores/authStore"
import { useConfigStore } from "src/stores/configStore"

const authStore = useAuthStore()
const configStore = useConfigStore()

onMounted(async () => {
  // Inicializar auth primero
  await authStore.initializeAuth()
  console.log("✅ Auth store inicializado")
})
</script>

<template>
  <div
    v-if="authStore.loading && !authStore.initialized"
    class="loading-screen"
  >
    <!-- Pantalla de carga mientras Firebase inicializa -->
    <div class="flex flex-center full-height">
      <q-spinner color="primary" size="7em" />
      <div class="q-mt-md text-center">
        <div class="text-h6">Inicializando aplicación...</div>
        <div class="text-caption q-mt-xs">
          {{
            configStore.syncStatus === "syncing"
              ? "Sincronizando configuración..."
              : "Cargando..."
          }}
        </div>
      </div>
    </div>
  </div>

  <router-view v-else />
</template>

<style scoped>
.loading-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
</style>
