// src/stores/repairsStore.ts
import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { useAuthStore } from "src/stores/authStore"
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore"
import { db } from "src/boot/firebaseConfig"
import { useQuasar } from "quasar"

export interface Repair {
  id: string
  model: string
  brand: string
  status: "Pendiente" | "Completado" | "Cancelado"
  date: string
  customerName: string
  phone: string
  detailNote: string
  assignedTechnician: string
  serviceType: string
  estimatedCost: number
  deliveryDate?: string
}

export const useRepairsStore = defineStore("repairs", () => {
  const authStore = useAuthStore()

  // Estados
  const repairs = ref<Repair[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const repairsByStatus = computed(() => {
    return {
      pendiente: repairs.value.filter((r) => r.status === "Pendiente"),
      completado: repairs.value.filter((r) => r.status === "Completado"),
      cancelado: repairs.value.filter((r) => r.status === "Cancelado"),
    }
  })

  const totalRepairs = computed(() => repairs.value.length)

  // Función para obtener la referencia a la subcolección de reparaciones del usuario
  function getRepairsCollectionRef() {
    if (!authStore.user?.uid) return null
    return collection(db, "users", authStore.user.uid, "repairs")
  }

  // Cargar reparaciones desde Firebase
  async function loadRepairs(): Promise<boolean> {
    const $q = useQuasar()

    if (!authStore.user?.uid) {
      error.value = "Usuario no autenticado"
      return false
    }

    loading.value = true
    error.value = null

    try {
      const repairsRef = getRepairsCollectionRef()
      if (!repairsRef) return false

      const q = query(repairsRef, orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      repairs.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Repair[]

      return true
    } catch (err) {
      console.error("Error loading repairs:", err)
      error.value = "Error cargando reparaciones"

      $q.notify({
        type: "negative",
        message: "Error al cargar las reparaciones",
      })

      return false
    } finally {
      loading.value = false
    }
  }

  // Actualizar estado de reparación
  async function updateRepairStatus(
    repairId: string,
    newStatus: Repair["status"],
  ): Promise<boolean> {
    if (!authStore.user?.uid) return false

    try {
      const repairRef = doc(
        db,
        "users",
        authStore.user.uid,
        "repairs",
        repairId,
      )

      await updateDoc(repairRef, {
        status: newStatus,
        ...(newStatus === "Completado" && {
          deliveryDate: new Date().toISOString().split("T")[0],
        }),
      })

      // Actualizar localmente
      const repairIndex = repairs.value.findIndex((r) => r.id === repairId)
      if (repairIndex !== -1) {
        repairs.value[repairIndex].status = newStatus
        if (newStatus === "Completado") {
          repairs.value[repairIndex].deliveryDate = new Date()
            .toISOString()
            .split("T")[0]
        }
      }
      return true
    } catch (err) {
      console.error("Error updating repair:", err)
      return false
    }
  }

  // Agregar nueva reparación
  async function addRepair(repairData: Omit<Repair, "id">): Promise<boolean> {
    if (!authStore.user?.uid) return false

    loading.value = true

    try {
      const repairsRef = getRepairsCollectionRef()
      if (!repairsRef) return false

      const docRef = await addDoc(repairsRef, repairData)

      const newRepair: Repair = {
        id: docRef.id,
        ...repairData,
      }

      repairs.value.unshift(newRepair)

      return true
    } catch (err) {
      console.error("Error adding repair:", err)

      return false
    } finally {
      loading.value = false
    }
  }

  // Eliminar reparación
  async function deleteRepair(repairId: string): Promise<boolean> {
    if (!authStore.user?.uid) return false

    try {
      const repairRef = doc(
        db,
        "users",
        authStore.user.uid,
        "repairs",
        repairId,
      )
      await deleteDoc(repairRef)
      repairs.value = repairs.value.filter((r) => r.id !== repairId)

      return true
    } catch (err) {
      console.error("Error deleting repair:", err)
      return false
    }
  }

  // Limpiar datos (para logout)
  function clearRepairs() {
    repairs.value = []
    error.value = null
  }

  return {
    // Estados
    repairs,
    loading,
    error,

    // Computed
    repairsByStatus,
    totalRepairs,

    // Métodos
    loadRepairs,
    updateRepairStatus,
    addRepair,
    deleteRepair,
    clearRepairs,
  }
})
