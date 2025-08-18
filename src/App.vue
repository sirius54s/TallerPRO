<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import {
  hasFirebaseError,
  getFirebaseError,
  isFirebaseReady,
  ERROR_CODES,
} from "src/boot/firebaseConfig"

const loading = ref(true)
const hasInternet = ref(true)
const appError = ref<{
  code: string
  name: string
  message: string
  errorCode: number
} | null>(null)

const canProceed = computed(
  () => hasInternet.value && !appError.value && isFirebaseReady(),
)

function getErrorIcon(code: string): string {
  switch (code) {
    case "NO_INTERNET":
      return "wifi_off"
    case "FIREBASE_ERROR":
      return "cloud_off"
    case "CONFIG_ERROR":
      return "settings"
    default:
      return "error_outline"
  }
}

async function checkInternet(): Promise<boolean> {
  if (!navigator.onLine) return false

  try {
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
    })
    return true
  } catch {
    return false
  }
}

async function initApp() {
  loading.value = true
  appError.value = null

  hasInternet.value = await checkInternet()
  if (!hasInternet.value) {
    appError.value = {
      code: "NO_INTERNET",
      name: "Sin conexión",
      message: "No tienes conexión a internet",
      errorCode: ERROR_CODES.NO_INTERNET,
    }
    loading.value = false
    return
  }

  if (hasFirebaseError()) {
    appError.value = getFirebaseError()
    loading.value = false
    return
  }

  loading.value = false
}

onMounted(initApp)
</script>

<template>
  <div class="full-height">
    <!-- Pantalla de carga -->
    <div v-if="loading" class="loading-screen text-center">
      <q-spinner-dots color="primary" size="3em" />
      <div class="q-mt-md text-h6 text-primary">Inicializando...</div>
      <div class="text-caption text-grey-6">Verificando conexión</div>
    </div>

    <!-- Pantalla de error -->
    <div v-else-if="appError" class="loading-screen">
      <q-card
        flat
        class="q-pa-lg text-center bg-transparent"
        style="max-width: 400px; width: 100%; box-shadow: none"
      >
        <q-card-section>
          <q-icon
            :name="getErrorIcon(appError.code)"
            color="negative"
            size="4rem"
          />
          <div class="text-h5 q-mt-md text-negative">{{ appError.name }}</div>
          <div class="text-body1 q-mt-sm text-grey-7">
            {{ appError.message }}
          </div>
          <div style="font-size: 15px">Código: {{ appError.errorCode }}</div>
        </q-card-section>
        <q-card-actions align="center" class="q-py-xs">
          <q-btn
            color="primary"
            unelevated
            icon="refresh"
            label="Reintentar"
            @click="initApp"
          />
        </q-card-actions>
      </q-card>
    </div>

    <!-- Contenido principal -->
    <div v-else-if="canProceed" class="loading-screen">
      <router-view />
    </div>
  </div>
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
