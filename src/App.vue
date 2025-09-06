<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useAuthStore } from "src/stores/authStore"
import { auth } from "src/boot/firebaseConfig"
import { signInAnonymously } from "firebase/auth"

const authStore = useAuthStore()

const firebaseError = ref<string | null>(null)

onMounted(async () => {
  try {
    await signInAnonymously(auth) // Esto forzará validar la API key
  } catch (error: any) {
    if (
      error?.code?.includes("api-key") ||
      error?.code === "auth/invalid-api-key"
    ) {
      firebaseError.value = "E1001"
    } else if (error?.code?.includes("network")) {
      firebaseError.value = "E1002"
    } else {
      firebaseError.value = "E1004"
    }
  }
})
</script>

<template>
  <div>
    <div v-if="firebaseError" class="absolute-full flex flex-center flex-col">
      <p class="text-center">
        Ha ocurrido un error al inicializar la configuración. Código de error:
        {{ firebaseError }}
      </p>
    </div>

    <div
      v-else-if="authStore.loading && !authStore.initialized"
      class="absolute-full flex flex-center flex-col"
    >
      <q-spinner-ball color="primary" size="10em" />
    </div>

    <router-view v-else />
  </div>
</template>
