<script setup lang="ts">
import { computed } from "vue"
import { useModalStore } from "src/stores/modalStore"
import { useConfigStore } from "src/stores/configStore"
import { markRaw } from "vue"

// Modal
import AddRepairModal from "src/pages/modules/addRepair.vue"
import AdditionalFunctionsModal from "src/components/AdditionalFunctionsModal.vue"
import ReportsModal from "src/pages/modules/reports.vue"

// Pinia stores
const modalStore = useModalStore()
const configStore = useConfigStore()

const visibleModules = computed(() => [
  ...configStore.availableModules.filter((module) => module.install),
  { key: "Otras funciones", name: "Otras funciones", disable: false },
])

function handleModuleClick(key: string) {
  if (key === "addRepair") {
    modalStore.openModal(markRaw(AddRepairModal))
  } else if (key === "reports") {
    modalStore.openModal(markRaw(ReportsModal))
  } else if (key === "Otras funciones") {
    modalStore.openModal(markRaw(AdditionalFunctionsModal))
  } else {
    console.log(`Action triggered: ${key}`)
  }
}
</script>

<template>
  <div>
    <div class="q-pa-md row justify-center items-center">
      <div
        v-for="module in visibleModules"
        :key="module.key"
        class="q-ma-sm rounded-borders shadow-2 cursor-pointer text-center flex flex-center q-gutter-sm box"
        @click="handleModuleClick(module.key)"
        :class="{ 'opacity-50': module.disable }"
      >
        {{ module.name }}
      </div>
    </div>

    <!-- Modal Pinia -->
    <q-dialog v-model="modalStore.modalVisible">
      <component
        :is="modalStore.activeModalComponent"
        @close="modalStore.closeModal"
        @escape-key="modalStore.closeModal"
      />
    </q-dialog>
  </div>
</template>

<style lang="sass" scoped>
.box
  width: 160px
  height: 90px
  user-select: none
  transition: transform 0.2s ease-in-out

  &:hover
    transform: scale(1.05)
</style>
