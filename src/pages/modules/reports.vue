<script setup lang="ts">
import { computed } from "vue"
import { useRepairsStore } from "src/stores/repairsStore"

// Emit para comunicación con el padre
const emit = defineEmits<{
  (e: "close"): void
}>()

const repairsStore = useRepairsStore()

// Estadísticas calculadas
const stats = computed(() => {
  const repairs = repairsStore.repairs
  const total = repairs.length

  const byStatus = {
    pendiente: repairs.filter((r) => r.status === "Pendiente").length,
    proceso: repairs.filter((r) => r.status === "En proceso").length,
    completado: repairs.filter((r) => r.status === "Completado").length,
    entregado: repairs.filter((r) => r.status === "Entregado").length,
  }

  const totalCost = repairs.reduce(
    (sum, repair) => sum + (repair.estimatedCost || 0),
    0,
  )
  const avgCost = total > 0 ? totalCost / total : 0

  return {
    total,
    byStatus,
    totalCost,
    avgCost,
    completionRate:
      total > 0
        ? ((byStatus.completado + byStatus.entregado) / total) * 100
        : 0,
  }
})

function closeModal() {
  emit("close")
}

function getStatusColor(status: string) {
  switch (status) {
    case "pendiente":
      return "orange"
    case "proceso":
      return "blue"
    case "completado":
      return "green"
    case "entregado":
      return "purple"
    default:
      return "grey"
  }
}
</script>

<template>
  <q-card class="reports-modal" style="min-width: 500px">
    <!-- Header -->
    <q-bar>
      <q-icon name="assessment" class="q-mr-sm" />
      <div>Reportes y Estadísticas</div>
      <q-space />
      <q-btn
        dense
        flat
        icon="close"
        @click="closeModal"
        aria-label="Cerrar reportes"
      >
        <q-tooltip>Cerrar</q-tooltip>
      </q-btn>
    </q-bar>

    <q-card-section class="q-pa-lg">
      <!-- Resumen general -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-6">
          <q-card flat bordered class="text-center q-pa-md">
            <div class="text-h4 text-primary">{{ stats.total }}</div>
            <div class="text-subtitle2 text-grey-7">Total Reparaciones</div>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat bordered class="text-center q-pa-md">
            <div class="text-h4 text-green">
              {{ stats.completionRate.toFixed(1) }}%
            </div>
            <div class="text-subtitle2 text-grey-7">Tasa Completado</div>
          </q-card>
        </div>
      </div>

      <!-- Estados -->
      <div class="q-mb-lg">
        <div class="text-h6 q-mb-md">Estado de Reparaciones</div>
        <div class="row q-col-gutter-sm">
          <div
            class="col-3"
            v-for="(count, status) in stats.byStatus"
            :key="status"
          >
            <q-card flat bordered class="text-center q-pa-sm">
              <q-badge
                :color="getStatusColor(status)"
                class="q-mb-xs"
                :label="count"
                style="font-size: 14px"
              />
              <div class="text-caption text-capitalize">{{ status }}</div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Costos -->
      <div class="q-mb-lg">
        <div class="text-h6 q-mb-md">Análisis de Costos</div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-7">Total Estimado</div>
              <div class="text-h6 text-green">
                ${{ stats.totalCost.toLocaleString("es-CL") }}
              </div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-body2 text-grey-7">Promedio por Reparación</div>
              <div class="text-h6 text-blue">
                ${{ Math.round(stats.avgCost).toLocaleString("es-CL") }}
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Mensaje si no hay datos -->
      <div v-if="stats.total === 0" class="text-center q-pa-lg">
        <div class="text-body2 text-grey-6">
          Agrega algunas reparaciones para ver estadísticas
        </div>
      </div>
    </q-card-section>

    <!-- Footer con acciones -->
    <q-card-actions align="right" class="q-pa-md">
      <q-btn flat label="Cerrar" @click="closeModal" color="grey-7" />
    </q-card-actions>
  </q-card>
</template>

<style lang="sass" scoped>
.reports-modal
  max-width: 600px

.text-capitalize
  text-transform: capitalize
</style>
