<script setup lang="ts">
import { ref } from "vue"

// Emit para comunicación con el padre
const emit = defineEmits<{
  (e: "close"): void
}>()

// Cada función ahora es un objeto con label e install = false
interface Funcion {
  label: string
  install: boolean
}

const funcionesAdicionales = ref<Funcion[]>([
  { label: "Eliminar reparación", install: false },
  { label: "Asignar técnico", install: false },
  { label: "Generar reporte", install: false },
  { label: "Imprimir reparación", install: false },
  { label: "Historial de cambios", install: false },
  { label: "Reprogramar visita", install: false },
  { label: "Enviar notificación", install: false },
  { label: "Exportar datos", install: false },
])

function closeModal() {
  emit("close")
}
</script>

<template>
  <q-card class="q--md">
    <q-bar class="q-pa-none q-ma-none">
      <div class="q-pl-md">Funciones Adicionales</div>
      <q-space />
      <q-btn
        class="q-mr-md"
        dense
        flat
        icon="close"
        @click="closeModal"
        aria-label="Cerrar modal"
    /></q-bar>

    <q-card-section class="content-section">
      <p class="text-center text-body2">
        Seleccione la función deseada para continuar.
      </p>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="row q-col-gutter-md q-pb-xl">
        <div
          v-for="(funcion, idx) in funcionesAdicionales"
          :key="idx"
          class="col-12"
        >
          <div class="row items-center q-gutter-sm">
            <!-- Botón deshabilitado si install === false -->
            <q-btn
              flat
              class="full-width col"
              :label="funcion.label"
              :disable="!funcion.install"
              :aria-label="`${funcion.label} - ${funcion.install ? 'Disponible' : 'No disponible'}`"
            />
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>
