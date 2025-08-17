<script setup lang="ts">
import { reactive, computed } from "vue"
import { useConfigStore } from "src/stores/configStore"
import { useRepairsStore } from "src/stores/repairsStore"
import { useQuasar } from "quasar"

// Stores
const configStore = useConfigStore()
const repairsStore = useRepairsStore()
const $q = useQuasar() // Para notificaciones

//emit
const emit = defineEmits<{
  (e: "close"): void
}>()

// Opciones para el Estado
const estadoOptions = [
  { label: "Pendiente", value: "Pendiente" },
  { label: "Completado", value: "Completado" },
  { label: "Cancelado", value: "Cancelado" },
]

// Opciones para la Marca
const brandOptions = [
  { label: "Apple", value: "Apple" },
  { label: "Samsung", value: "Samsung" },
  { label: "Huawei", value: "Huawei" },
  { label: "Xiaomi", value: "Xiaomi" },
  { label: "Motorola", value: "Motorola" },
  { label: "Oppo", value: "Oppo" },
  { label: "Vivo", value: "Vivo" },
  { label: "Realme", value: "Realme" },
  { label: "OnePlus", value: "OnePlus" },
  { label: "Nokia", value: "Nokia" },
  { label: "Sony", value: "Sony" },
  { label: "Google", value: "Google" },
  { label: "LG", value: "LG" },
]

// Calcular hoy en formato "YYYY-MM-DD"
const today = new Date().toISOString().split("T")[0]
const todayNext = (): string =>
  new Date(Date.now() + 86400000).toISOString().split("T")[0]

// Estado reactivo del formulario
const formData = reactive({
  id: Math.floor(Date.now() * Math.random()).toString(),
  brand: "",
  model: "",
  status: "Pendiente",
  date: today,
  serviceType: "",
  estimatedCost: "",
  deliveryDate: todayNext(),
  assignedTechnician: "",
  customerName: "",
  phone: "",
  detailNote: "",
})

const technicianOptions = computed(() => {
  const userTechnicians = configStore.profile?.technical || []

  const techniciansOptions = userTechnicians.map((technician) => ({
    label: technician.name,
    value: technician.name,
  }))

  techniciansOptions.push({
    label: "No especificar",
    value: "No especificar",
  })

  return techniciansOptions
})

//  Función para enviar el formulario
const submitForm = async () => {
  // Validación básica
  if (!formData.model || !formData.customerName || !formData.serviceType) {
    $q.notify({
      type: "negative",
      message:
        "Por favor completa los campos obligatorios: Modelo, Cliente y Tipo de reparación",
    })
    return
  }

  try {
    // Preparar los datos según la interfaz Repair
    const repairData = {
      brand: formData.brand,
      model: formData.model,
      status: formData.status as "Pendiente" | "Completado" | "Cancelado",
      date: formData.date,
      customerName: formData.customerName,
      phone: formData.phone,
      detailNote: formData.detailNote,
      assignedTechnician: formData.assignedTechnician,
      serviceType: formData.serviceType,
      estimatedCost: Number(formData.estimatedCost) || 0,
      deliveryDate: formData.deliveryDate || undefined,
    }

    //  Llamar al store para guardar
    const success = await repairsStore.addRepair(repairData)

    if (success) {
      emit("close")
      $q.notify({
        type: "positive",
        message: "Reparación agregada exitosamente",
      })
    }
  } catch (error) {
    console.error("Error al guardar:", error)
    $q.notify({
      type: "negative",
      message: "Error al guardar la reparación",
    })
  }
}

function closeModal() {
  emit("close")
}
</script>

<template>
  <q-card class="q-ma-md">
    <!-- Encabezado -->
    <q-bar class="q-pa-xs">
      <div class="q-pl-md">Agregar un nuevo registro</div>
      <q-space />
      <q-btn dense flat round icon="close" @click="closeModal">
        <q-tooltip>Close</q-tooltip>
      </q-btn>
    </q-bar>

    <q-separator />

    <q-card-section class="q-pa-md">
      <q-form @submit.prevent="submitForm">
        <div class="row q-col-gutter-md">
          <!-- Columna Izquierda: Servicio -->
          <div class="col-12">
            <div class="q-pa-xs">Servicio</div>

            <!-- ID y Marca -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.id"
                  label="ID"
                  disable
                  class="q-mb-sm"
                />
              </div>
              <div class="col-6">
                <q-select
                  filled
                  dense
                  v-model="formData.brand"
                  :options="brandOptions"
                  label="Marca"
                  class="q-mb-sm"
                  emit-value
                  map-options
                />
              </div>
            </div>

            <!-- Modelo y Estado -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.model"
                  label="Modelo *"
                  placeholder="Ingresa modelo"
                  class="q-mb-sm"
                  :rules="[(val) => !!val || 'Campo obligatorio']"
                />
              </div>
              <div class="col-6">
                <q-select
                  filled
                  dense
                  v-model="formData.status"
                  :options="estadoOptions"
                  label="Estado"
                  class="q-mb-sm"
                  emit-value
                  map-options
                />
              </div>
            </div>

            <!-- Fecha y Tipo de reparación -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.date"
                  label="Fecha"
                  type="date"
                />
              </div>
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.serviceType"
                  label="Tipo de reparación *"
                  :rules="[(val) => !!val || 'Campo obligatorio']"
                />
              </div>
            </div>

            <!-- Costo y Fecha de entrega -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.estimatedCost"
                  label="Costo (CLP)"
                  prefix="$"
                  class="q-mb-sm"
                  mask="#.###.###"
                  reverse-fill-mask
                />
              </div>
              <div class="col-6">
                <q-input
                  filled
                  dense
                  v-model="formData.deliveryDate"
                  label="Entrega"
                  type="date"
                  class="q-mb-sm"
                />
              </div>
            </div>

            <!-- Técnico - Ahora dinámico -->
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  filled
                  dense
                  v-model="formData.assignedTechnician"
                  :options="technicianOptions"
                  label="Técnico"
                  class="q-mb-sm"
                  :disable="technicianOptions.length <= 1"
                  emit-value
                  map-options
                />
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Cliente -->
          <div class="col-12">
            <div class="q-pa-xs">Cliente</div>
            <q-input
              filled
              dense
              v-model="formData.customerName"
              label="Nombre *"
              :rules="[(val) => !!val || 'Campo obligatorio']"
            />
            <q-input
              filled
              dense
              v-model="formData.phone"
              label="Teléfono"
              type="tel"
              prefix="+56"
              class="q-mb-sm"
            />
            <q-input
              filled
              dense
              v-model="formData.detailNote"
              label="Notas"
              type="textarea"
              autogrow
              class="q-mb-sm"
            />
          </div>
        </div>

        <!-- Botón de envío -->
        <div class="row q-mt-md">
          <div class="col-12">
            <q-btn
              label="Guardar Reparación"
              type="submit"
              color="primary"
              class="full-width"
              :loading="repairsStore.loading"
              :disable="repairsStore.loading"
            />
          </div>
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="sass">
.full-width
  width: 100%
</style>
