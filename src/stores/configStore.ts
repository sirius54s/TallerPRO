// src/stores/configStore.ts
import { defineStore } from "pinia"
import { ref, computed, watch, nextTick } from "vue"
import { useAuthStore } from "src/stores/authStore"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "src/boot/firebaseConfig"
import { useQuasar } from "quasar"
import { useRepairsStore } from "src/stores/repairsStore"

export type ModuleKey = "addRepair" | "reports"

export interface ModuleConfig {
  name: string
  install: boolean
  disable: boolean
}

export type Modules = Record<ModuleKey, ModuleConfig>

export interface Settings {
  theme: "light" | "dark"
  modules: Modules
}

export interface UserProfile {
  name: string
  company: string
  phone: string
  address: string
  technical: Array<{ id: string; name: string }>
  email?: string
}

export interface technical {
  id: string
  name: string
}

interface UserData {
  name?: string
  company?: string
  phone?: string
  address?: string
  technical?: Array<technical | string>
  email: string
  settings?: Partial<Settings>
}

const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  modules: {
    addRepair: { name: "Agregar reparación", install: true, disable: true },
    reports: { name: "Reportes y Estadísticas", install: true, disable: true },
  },
}

export const THEME_OPTIONS = [
  { label: "Claro", value: "light" },
  { label: "Oscuro", value: "dark" },
]

function mergeSettings(base: Settings, override?: Partial<Settings>): Settings {
  const validKeys: ModuleKey[] = ["addRepair", "reports"]

  const mergedModules: Modules = { ...base.modules }

  if (override?.modules) {
    for (const key of validKeys) {
      if (override.modules[key]) {
        mergedModules[key] = {
          ...base.modules[key],
          ...override.modules[key],
        }
      }
    }
  }

  return {
    theme: override?.theme ?? base.theme,
    modules: mergedModules,
  }
}

function normalizeTecnicos(tecnicos?: Array<technical | string>): technical[] {
  if (!Array.isArray(tecnicos)) return []

  return tecnicos.map((tecnico, index) => {
    if (typeof tecnico === "object" && tecnico.id && tecnico.name) {
      return tecnico
    }
    if (typeof tecnico === "string") {
      return {
        id: `t_${Date.now()}_${index}`,
        name: tecnico,
      }
    }
    return {
      id: `t_${Date.now()}_${index}`,
      name: "Técnico sin nombre",
    }
  })
}

export const useConfigStore = defineStore("config", () => {
  const $q = useQuasar()
  const authStore = useAuthStore()

  const settings = ref<Settings>({ ...DEFAULT_SETTINGS })
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const syncStatus = ref<"idle" | "syncing" | "error">("idle")
  const hasUnsavedChanges = ref(false)

  const isConfigured = computed(() => !!profile.value)
  const availableModules = computed(() =>
    Object.entries(settings.value.modules)
      .filter(([, mod]) => mod.install && !mod.disable)
      .map(([key, mod]) => ({ key, ...mod })),
  )

  const activeModules = computed(() =>
    Object.entries(settings.value.modules)
      .filter(([, mod]) => mod.install && !mod.disable)
      .reduce((acc, [key, mod]) => ({ ...acc, [key]: mod }), {}),
  )

  watch(
    () => settings.value.theme,
    (newTheme) => {
      $q.dark.set(newTheme === "dark")
    },
    { immediate: true, flush: "sync" },
  )

  watch(
    settings,
    () => {
      hasUnsavedChanges.value = true
    },
    { deep: true },
  )

  watch(
    () => authStore.user,
    async (user) => {
      if (!user) {
        await resetStoreOnLogout()
      } else {
        await loadFromFirebase()
      }
    },
    { immediate: true },
  )

  async function resetStoreOnLogout() {
    profile.value = null
    hasUnsavedChanges.value = false
    error.value = null
    syncStatus.value = "idle"
    settings.value = { ...DEFAULT_SETTINGS }

    const repairsStore = useRepairsStore()
    repairsStore.clearRepairs()
  }

  async function loadFromFirebase(): Promise<boolean> {
    if (!authStore.user?.uid) return false

    loading.value = true
    syncStatus.value = "syncing"
    error.value = null

    try {
      const snap = await getDoc(doc(db, "users", authStore.user.uid))

      if (!snap.exists()) {
        syncStatus.value = "idle"
        return false
      }

      const data = snap.data() as UserData
      const technicalData = normalizeTecnicos(data.technical)

      profile.value = {
        name: data.name || "",
        company: data.company || "",
        phone: data.phone || "",
        address: data.address || "",
        technical: technicalData,
        email: data.email || authStore.user?.email || "",
      }

      if (data.settings) {
        settings.value = mergeSettings(DEFAULT_SETTINGS, data.settings)
        await nextTick()
        $q.dark.set(settings.value.theme === "dark")
      }

      syncStatus.value = "idle"
      hasUnsavedChanges.value = false
      return true
    } catch (err) {
      console.error("Error loading from Firebase:", err)
      error.value = "Error cargando configuración"
      syncStatus.value = "error"
      return false
    } finally {
      loading.value = false
    }
  }

  async function saveToFirebase(): Promise<boolean> {
    if (!authStore.user?.uid) {
      $q.notify({
        type: "negative",
        message: "Debes estar autenticado para guardar",
      })
      return false
    }

    syncStatus.value = "syncing"
    error.value = null

    try {
      const payload = {
        settings: settings.value,
        ...(profile.value || {}),
      }

      await updateDoc(doc(db, "users", authStore.user.uid), payload)

      syncStatus.value = "idle"
      hasUnsavedChanges.value = false

      $q.notify({
        type: "positive",
        message: "Configuración guardada exitosamente",
      })

      return true
    } catch (err) {
      console.error("Error saving to Firebase:", err)
      error.value = "Error guardando configuración"
      syncStatus.value = "error"

      $q.notify({
        type: "negative",
        message: "Error al guardar la configuración",
      })
      return false
    }
  }

  async function completeSetup(setupData: {
    name: string
    company: string
    phone: string
    address: string
    technical: Array<{ id: string; name: string }>
  }): Promise<boolean> {
    if (!authStore.user?.uid) return false

    loading.value = true
    error.value = null

    try {
      const payload = {
        ...setupData,
        email: authStore.user.email,
        settings: settings.value,
      }

      await setDoc(doc(db, "users", authStore.user.uid), payload)

      profile.value = {
        ...setupData,
        email: authStore.user.email || undefined,
      }

      hasUnsavedChanges.value = false
      return true
    } catch (err) {
      console.error("Error completing setup:", err)
      error.value = "Error completando configuración inicial"
      return false
    } finally {
      loading.value = false
    }
  }

  function updateTheme(theme: "light" | "dark") {
    settings.value.theme = theme
    $q.dark.set(theme === "dark")
  }

  function updateModule(moduleKey: ModuleKey, config: Partial<ModuleConfig>) {
    const current = settings.value.modules[moduleKey]
    if (!current) {
      console.warn(`Module ${moduleKey} does not exist`)
      return
    }

    settings.value.modules[moduleKey] = {
      ...current,
      ...config,
    }
  }

  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    hasUnsavedChanges.value = true
  }

  async function discardChanges() {
    try {
      if (authStore.isAuthenticated) {
        await loadFromFirebase()
      } else {
        resetSettings()
        hasUnsavedChanges.value = false
      }
    } catch (err) {
      console.error("Error discarding changes:", err)
      resetSettings()
    }
  }

  return {
    settings,
    profile,
    loading,
    error,
    syncStatus,
    hasUnsavedChanges,

    // Computeds
    isConfigured,
    availableModules,
    activeModules,

    // Métodos
    loadFromFirebase,
    saveToFirebase,
    completeSetup,
    updateTheme,
    updateModule,
    resetSettings,
    discardChanges,
  }
})
