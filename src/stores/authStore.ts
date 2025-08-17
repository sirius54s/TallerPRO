// src/boot/authStorePinia.ts
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth"
import { auth, db } from "src/boot/firebaseConfig"
import { doc, setDoc } from "firebase/firestore"
import { useConfigStore, UserProfile } from "src/stores/configStore"

///hace el login, registro y setup
export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const isLoggingOut = ref(false)

  const configStore = useConfigStore()

  const isAuthenticated = computed(() => !!user.value)

  async function login({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    loading.value = true
    error.value = null
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )
      user.value = userCredential.user
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function register({
    email,
    password,
  }: {
    email: string
    password: string
  }) {
    loading.value = true
    error.value = null
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )
      user.value = userCredential.user
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    isLoggingOut.value = true
    error.value = null
    try {
      clearUserData()
      await signOut(auth)
      return true
    } catch (err: unknown) {
      error.value = getErrorMessage(err)
      return false
    } finally {
      loading.value = false
      isLoggingOut.value = false
    }
  }

  function clearUserData() {
    localStorage.clear()
  }

  function initializeAuth() {
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        const wasLoggedIn = !!user.value
        const isNowLoggedIn = !!currentUser

        user.value = currentUser

        if (wasLoggedIn && !isNowLoggedIn) {
          clearUserData()
        }

        if (!initialized.value) {
          initialized.value = true
          loading.value = false
          resolve()
        }
      })

      return unsubscribe
    })
  }

  async function completeSetup(
    setup: UserProfile,
    theme: string,
  ): Promise<boolean> {
    const uid = user.value?.uid
    if (!uid) return false

    try {
      await setDoc(
        doc(db, "users", uid),
        {
          userProfile: setup, // 👈 ahora lo envolvemos aquí
          settings: {
            theme,
            modules: configStore.availableModules,
          },
          create: new Date().toISOString(),
        },
        { merge: true },
      )

      return true
    } catch (error) {
      console.error("❌ Error al guardar perfil o configuración:", error)
      return false
    }
  }

  function getErrorMessage(err: unknown): string {
    const error = err as { code?: string; message?: string }

    switch (error.code) {
      case "auth/user-not-found":
        return "Usuario no encontrado"
      case "auth/wrong-password":
        return "Contraseña incorrecta"
      case "auth/email-already-in-use":
        return "Este correo ya está registrado"
      case "auth/invalid-email":
        return "Correo no válido"
      case "auth/weak-password":
        return "La contraseña es muy débil"
      case "auth/invalid-credential":
        return "Credenciales inválidas"
      default:
        return `Error: ${error.message || "Error desconocido"}`
    }
  }

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated,
    isLoggingOut,
    login,
    register,
    logout,
    initializeAuth,
    clearUserData,
    completeSetup,
  }
})
