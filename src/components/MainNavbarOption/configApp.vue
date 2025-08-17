<script lang="ts" setup>
import { computed } from "vue"
import { useQuasar } from "quasar"
import {
  useConfigStore,
  THEME_OPTIONS,
  ModuleKey,
} from "src/stores/configStore"

const configStore = useConfigStore()
const $q = useQuasar()

const emit = defineEmits<{ (e: "close"): void }>()

// Reactive state from store
const settings = computed(() => configStore.settings)
const hasChanges = computed(() => configStore.hasUnsavedChanges)
const isLoading = computed(() => configStore.loading)
const syncStatus = computed(() => configStore.syncStatus)

// Update module config safely
function updateModule(moduleKey: string, config: { disable: boolean }) {
  if (moduleKey in settings.value.modules) {
    configStore.updateModule(moduleKey as ModuleKey, config)
  } else {
    console.warn(`Invalid module key: ${moduleKey}`)
  }
}

// Save config and close modal
async function saveConfig() {
  const success = await configStore.saveToFirebase()
  if (success) {
    emit("close")
  }
}

// Discard changes with confirmation
function discardChanges() {
  $q.dialog({
    title: "Discard changes",
    message: "Are you sure you want to discard all changes?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    configStore.discardChanges()
  })
}
</script>

<template>
  <q-card style="min-width: 600px; max-width: 700px">
    <!-- Header bar -->
    <q-bar class="q-pa-xs">
      <q-icon name="settings" />
      <div>Configuration</div>

      <q-space />
      <q-spinner-dots
        v-if="syncStatus === 'syncing'"
        size="20px"
        color="primary"
      />
      <q-icon
        v-else-if="syncStatus === 'error'"
        name="error"
        color="negative"
        size="20px"
      >
        <q-tooltip>Sync error</q-tooltip>
      </q-icon>
      <q-icon v-else-if="hasChanges" name="circle" color="orange" size="12px">
        <q-tooltip>Unsaved changes</q-tooltip>
      </q-icon>

      <q-btn dense flat round icon="close" @click="emit('close')">
        <q-tooltip>Close</q-tooltip>
      </q-btn>
    </q-bar>

    <q-separator />

    <!-- Main content -->
    <q-card-section class="q-pa-md" style="height: 400px">
      <q-form @submit.prevent="saveConfig">
        <!-- Theme selector -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <q-select
              filled
              dense
              v-model="settings.theme"
              :options="THEME_OPTIONS"
              label="Theme"
              :loading="isLoading"
              emit-value
              map-options
            />
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Modules toggle -->
        <div class="text-subtitle2 q-mb-sm">
          <q-icon name="apps" size="16px" class="q-mr-xs" />
          Modulos del sistema
        </div>

        <div class="row q-col-gutter-sm q-mb-md">
          <div
            v-for="[key, module] in Object.entries(settings.modules)"
            :key="key"
            class="col-12 col-sm-6"
          >
            <div
              class="flex items-center justify-between q-pa-sm rounded-borders"
              :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-grey-1'"
            >
              <div class="text-body2">{{ module.name }}</div>
              <q-toggle
                :model-value="!module.disable"
                @update:model-value="
                  (val) => updateModule(key, { disable: !val })
                "
                color="primary"
                :disable="!module.install || isLoading"
                dense
              />
            </div>
          </div>
        </div>
      </q-form>
    </q-card-section>

    <!-- Action buttons -->
    <div class="row q-gutter-lg justify-around q-mb-md">
      <q-btn
        v-if="hasChanges"
        label="Descartar"
        flat
        @click="discardChanges"
        class="col-4"
        :loading="isLoading"
      />

      <q-btn
        label="Guardar"
        type="submit"
        color="primary"
        unelevated
        class="col-6"
        @click="saveConfig"
        :loading="isLoading || syncStatus === 'syncing'"
        :disable="!hasChanges"
      />
    </div>
  </q-card>
</template>
