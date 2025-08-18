<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue"
import { useAuthStore } from "src/stores/authStore"
import { auth } from "src/boot/firebaseConfig"
import { onAuthStateChanged } from "firebase/auth"
import { useQuasar } from "quasar"

const authStore = useAuthStore()

const $q = useQuasar()

// Estados principales
const isOnline = ref(navigator.onLine)
const connectionStatus = ref<
  "checking" | "connected" | "internet-error" | "firebase-error"
>("checking")
const initMessage = ref("Iniciando aplicación...")

// Estados computados
const isLoading = computed(
  () => connectionStatus.value !== "connected" || authStore.loading,
)

const showRetryButton = computed(
  () =>
    connectionStatus.value === "internet-error" ||
    connectionStatus.value === "firebase-error",
)

// Verificar internet de forma simple
const checkInternet = async (): Promise<boolean> => {
  if (!navigator.onLine) return false

  try {
    await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
      signal: AbortSignal.timeout(5000),
    })
    return true
  } catch {
    return false
  }
}

// Verificar Firebase
const checkFirebase = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 8000)

    const unsubscribe = onAuthStateChanged(
      auth,
      () => {
        clearTimeout(timeout)
        unsubscribe()
        resolve(true)
      },
      () => {
        clearTimeout(timeout)
        unsubscribe()
        resolve(false)
      },
    )
  })
}

// Inicializar aplicación
const initialize = async () => {
  try {
    connectionStatus.value = "checking"
    initMessage.value = "Verificando conexión..."

    // Verificar internet
    const hasInternet = await checkInternet()
    if (!hasInternet) {
      connectionStatus.value = "internet-error"
      return
    }

    // Verificar Firebase
    initMessage.value = "Conectando con Firebase..."
    const firebaseOk = await checkFirebase()
    if (!firebaseOk) {
      connectionStatus.value = "firebase-error"
      return
    }

    // Inicializar autenticación
    initMessage.value = "Inicializando sesión..."
    await authStore.initializeAuth()

    connectionStatus.value = "connected"

    ///////////test
    $q.notify({
      color: "grey-7",
      message: "Conectado...",
      icon: "cloud_done",
      timeout: 2000,
    })
  } catch (error) {
    console.error("Error de inicialización:", error)
    connectionStatus.value = "firebase-error"
  }
}

// Manejar cambios de conexión
const handleConnectionChange = async () => {
  const wasOffline = !isOnline.value
  isOnline.value = navigator.onLine

  if (isOnline.value && wasOffline) {
    $q.notify({
      type: "positive",
      message: "Conexión restaurada",
      icon: "wifi",
    })
    await initialize()
  } else if (!isOnline.value) {
    connectionStatus.value = "internet-error"
  }
}

onMounted(() => {
  window.addEventListener("online", handleConnectionChange)
  window.addEventListener("offline", handleConnectionChange)
  initialize()
})

onUnmounted(() => {
  window.removeEventListener("online", handleConnectionChange)
  window.removeEventListener("offline", handleConnectionChange)
})
</script>

<template>
  <!-- Error de conexión a internet -->
  <div v-if="connectionStatus === 'internet-error'" class="error-screen">
    <q-icon name="wifi_off" size="4rem" color="negative" />
    <div class="q-mt-md text-center">
      <div class="text-h6">Sin conexión</div>
      <div class="text-caption q-mt-xs text-grey-7">
        Verifica tu conexión a internet
      </div>
      <q-btn
        v-if="showRetryButton"
        class="q-mt-md"
        color="primary"
        label="Reintentar"
        icon="refresh"
        @click="initialize"
        rounded
        no-caps
      />
    </div>
  </div>

  <!-- Error de Firebase -->
  <div v-else-if="connectionStatus === 'firebase-error'" class="error-screen">
    <q-icon name="cloud_off" size="4rem" color="warning" />
    <div class="q-mt-md text-center">
      <div class="text-h6">Error de servicio</div>
      <div class="text-caption q-mt-xs text-grey-7">
        No se pudo conectar con el servidor
      </div>
      <q-btn
        v-if="showRetryButton"
        class="q-mt-md"
        color="warning"
        label="Reintentar"
        icon="refresh"
        @click="initialize"
        rounded
        no-caps
      />
    </div>
  </div>

  <!-- Pantalla de carga -->
  <div v-else-if="isLoading" class="loading-screen">
    <q-spinner color="primary" size="4rem" />
    <div class="q-mt-md text-center">
      <div class="text-h6">{{ initMessage }}</div>

      <!-- Solo iconos de estado -->
      <div class="q-mt-md q-gutter-xs">
        <q-icon
          :name="isOnline ? 'wifi' : 'wifi_off'"
          :color="isOnline ? 'positive' : 'grey'"
          size="md"
        />
        <q-icon
          :name="connectionStatus === 'connected' ? 'cloud' : 'cloud_off'"
          :color="connectionStatus === 'connected' ? 'positive' : 'grey'"
          size="md"
        />
      </div>
    </div>
  </div>

  <!-- Aplicación principal -->
  <router-view v-else />
</template>

<style scoped>
.loading-screen,
.error-screen {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>
