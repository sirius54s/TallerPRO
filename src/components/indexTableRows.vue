<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { useQuasar } from "quasar"
import { useRepairsStore, type Repair } from "src/stores/repairsStore"

const $q = useQuasar()
const repairsStore = useRepairsStore()

// Estados reactivos del store
const repairs = computed(() => repairsStore.repairs)
const loading = computed(() => repairsStore.loading)
const error = computed(() => repairsStore.error)

interface Column {
  name: string
  label: string
  align: "left" | "center" | "right"
  field: string
  sortable?: boolean
}

const repairColumns: Column[] = [
  {
    name: "brand",
    label: "Marca",
    align: "left",
    field: "brand",
    sortable: true,
  },
  {
    name: "model",
    label: "Modelo",
    align: "left",
    field: "model",
    sortable: true,
  },
  {
    name: "customerName",
    label: "Cliente",
    align: "left",
    field: "customerName",
    sortable: true,
  },
  {
    name: "status",
    label: "Estado",
    align: "center",
    field: "status",
    sortable: true,
  },
  {
    name: "date",
    label: "Fecha",
    align: "center",
    field: "date",
    sortable: true,
  },
  {
    name: "assignedTechnician",
    label: "Técnico",
    align: "left",
    field: "assignedTechnician",
    sortable: true,
  },
  {
    name: "detailNote",
    label: "Descripción",
    align: "left",
    field: "detailNote",
  },
  {
    name: "acciones",
    label: "Acciones",
    align: "center",
    field: "",
    sortable: false,
  },
]

const initialPagination = ref({
  page: 1,
  rowsPerPage: 8,
})

// ✅ Fecha y hora actual del sistema
const currentDateTime = computed(() => {
  const now = new Date()
  return now.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
})

// Cargar datos al montar componente
onMounted(async () => {
  await repairsStore.loadRepairs()
})

// Funciones
async function marcarComoListo(repair: Repair) {
  $q.dialog({
    title: "Confirmar",
    message: `¿Marcar la reparación de ${repair.model} como completada?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await repairsStore.updateRepairStatus(repair.id, "Completado")
  })
}

function mostrarOpciones(row: Repair) {
  const options = [
    {
      label: "Ver detalles",
      icon: "visibility",
      action: () => verDetalles(row),
    },
    {
      label: "Editar",
      icon: "edit",
      action: () => editarReparacion(row),
    },
    {
      label: "Cambiar estado",
      icon: "swap_horiz",
      action: () => cambiarEstado(row),
    },
    {
      label: "Eliminar",
      icon: "delete",
      color: "negative",
      action: () => eliminarReparacion(row),
    },
  ]

  $q.dialog({
    title: `Opciones - ${row.model}`,
    options: {
      type: "radio",
      model: "",
      items: options.map((opt) => ({
        label: opt.label,
        value: opt.label,
      })),
    },
    cancel: true,
  }).onOk((selectedOption) => {
    const option = options.find((opt) => opt.label === selectedOption)
    if (option) option.action()
  })
}

function verDetalles(repair: Repair) {
  $q.dialog({
    title: `Detalles - ${repair.model}`,
    message: `
      <strong>Cliente:</strong> ${repair.customerName}<br>
      <strong>Teléfono:</strong> ${repair.phone}<br>
      <strong>Estado:</strong> ${repair.status}<br>
      <strong>Técnico:</strong> ${repair.assignedTechnician}<br>
      <strong>Servicio:</strong> ${repair.serviceType}<br>
      <strong>Costo:</strong> $${repair.estimatedCost.toLocaleString("es-CL")}<br>
      <strong>Descripción:</strong> ${repair.detailNote}<br>
      ${repair.detailNote ? `<strong>Notas:</strong> ${repair.detailNote}` : ""}
    `,
    html: true,
    ok: "Cerrar",
  })
}

function editarReparacion(repair: Repair) {
  // Implementar modal de edición
  console.log("Editar:", repair)
  $q.notify({
    message: "Función de edición pendiente de implementar",
    type: "info",
  })
}

function cambiarEstado(repair: Repair) {
  const estados = ["Pendiente", "Completado", "Cancelado"]

  $q.dialog({
    title: "Cambiar Estado",
    options: {
      type: "radio",
      model: repair.status,
      items: estados.map((estado) => ({ label: estado, value: estado })),
    },
    cancel: true,
  }).onOk(async (nuevoEstado) => {
    if (nuevoEstado !== repair.status) {
      await repairsStore.updateRepairStatus(repair.id, nuevoEstado)
    }
  })
}

function eliminarReparacion(repair: Repair) {
  $q.dialog({
    title: "Confirmar eliminación",
    message: `¿Estás seguro de eliminar la reparación de ${repair.model}?`,
    cancel: true,
    persistent: true,
    color: "negative",
  }).onOk(async () => {
    await repairsStore.deleteRepair(repair.id)
  })
}

function getStatusColor(estado: string) {
  switch (estado) {
    case "Pendiente":
      return "orange"
    case "Completado":
      return "green"
    case "Cancelado":
      return "red"
    default:
      return "grey"
  }
}
</script>

<template>
  <div class="q-pa-md fixed-table-container">
    <q-table
      class="my-sticky-header-last-column-table"
      flat
      bordered
      :title="`Reparaciones: ${currentDateTime}`"
      :rows="repairs"
      :columns="repairColumns"
      row-key="id"
      :pagination="initialPagination"
      :loading="loading"
      :no-data-label="error ? 'Error cargando datos' : 'No hay reparaciones'"
      loading-label="Cargando reparaciones..."
      separator="horizontal"
      dense
      :rows-per-page-options="[1]"
    >
      <!-- ✅ Slot para la marca -->
      <template v-slot:body-cell-brand="props">
        <q-td :props="props">
          <span class="text-body2">
            {{ props.row.brand || "N/A" }}
          </span>
        </q-td>
      </template>

      <!-- Slot para el estado -->
      <template v-slot:body-cell-status="props">
        <q-td :props="props">
          <q-badge
            :color="getStatusColor(props.row.status)"
            :label="props.row.status"
          />
        </q-td>
      </template>

      <!-- ✅ Slot para el técnico -->
      <template v-slot:body-cell-assignedTechnician="props">
        <q-td :props="props">
          <span class="text-body2">
            {{ props.value || "No asignado" }}
          </span>
        </q-td>
      </template>

      <!-- Slot para la columna "Acciones" -->
      <template v-slot:body-cell-acciones="props">
        <q-td :props="props">
          <div class="q-gutter-xs">
            <q-btn
              v-if="
                props.row.status !== 'Completado' &&
                props.row.status !== 'Cancelado'
              "
              label="Listo"
              color="green"
              size="sm"
              @click="marcarComoListo(props.row)"
              :loading="loading"
            />
            <q-btn
              round
              dense
              flat
              icon="more_vert"
              color="secondary"
              @click="mostrarOpciones(props.row)"
            />
          </div>
        </q-td>
      </template>

      <!-- Slot para descripción más corta -->
      <template v-slot:body-cell-detailNote="props">
        <q-td :props="props">
          <span class="text-caption">
            {{
              props.value && props.value.length > 30
                ? props.value.substring(0, 30) + "..."
                : props.value || "Sin descripción"
            }}
          </span>
        </q-td>
      </template>
    </q-table>

    <!-- Indicador de error -->
    <div v-if="error && !loading" class="q-pa-md text-center">
      <q-icon name="error" size="48px" color="negative" />
      <div class="text-h6 text-negative q-mt-sm">{{ error }}</div>
      <q-btn
        color="primary"
        label="Reintentar"
        @click="repairsStore.loadRepairs()"
        class="q-mt-md"
      />
    </div>
  </div>
</template>

<style lang="sass" scoped>
.fixed-table-container
  .q-table__container
    max-height: calc(100vh - 200px)
</style>
