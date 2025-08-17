<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "src/stores/authStore"
import { useConfigStore, THEME_OPTIONS } from "src/stores/configStore"
import { useQuasar } from "quasar"

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const configStore = useConfigStore()

const loading = ref(false)
const genId = () => crypto.randomUUID()

const form = ref({
  name: "",
  company: "",
  phone: "",
  address: "",
  technical: [{ id: genId(), name: "" }],
})

watch(
  () => configStore.settings.theme,
  (newTheme) => {
    $q.dark.set(newTheme === "dark")
  },
  { immediate: true, flush: "post" },
)

const valid = computed(
  () =>
    form.value.name.trim() &&
    form.value.company.trim() &&
    form.value.technical.every((t) => t.name.trim()),
)

function addTechnical() {
  form.value.technical.push({ id: genId(), name: "" })
}

function removeTechnical(i: number) {
  if (form.value.technical.length > 1) {
    form.value.technical.splice(i, 1)
  }
}

async function submitForm() {
  if (!authStore.user?.uid || !valid.value) return

  loading.value = true
  try {
    // Mapeamos technical a tecnicos para que coincida con el store
    const setupData = {
      name: form.value.name,
      company: form.value.company,
      phone: form.value.phone,
      address: form.value.address,
      technical: form.value.technical,
    }

    const success = await configStore.completeSetup(setupData)

    $q.notify({
      type: success ? "positive" : "negative",
      message: success
        ? "Perfil completado exitosamente"
        : "Error al completar el perfil",
    })

    if (success) {
      router.push({ name: "home" })
    }
  } catch (err) {
    console.error("Setup error:", err)
    $q.notify({
      type: "negative",
      message: "Error inesperado al completar el perfil",
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <q-page padding class="flex items-center justify-center">
    <q-card
      flat
      bordered
      class="q-pa-sm"
      style="width: 600px; border-radius: 10px"
    >
      <div class="text-center q-pa-lg">
        <div class="text-h5 text-weight-light">Completa tu perfil</div>
      </div>

      <q-form @submit.prevent="submitForm">
        <!-- Datos personales -->
        <div class="row q-col-gutter-md">
          <q-input
            v-model="form.name"
            label="Nombre completo"
            dense
            filled
            required
            class="col-6"
          />
          <q-input
            v-model="form.company"
            label="Empresa / Negocio"
            dense
            filled
            required
            class="col-6"
          />
          <q-input
            v-model="form.phone"
            label="Teléfono"
            dense
            filled
            class="col-6"
          />
          <q-input
            v-model="form.address"
            label="Dirección"
            dense
            filled
            class="col-6"
          />
        </div>

        <!-- Técnicos y Tema -->
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6">
            <div class="flex items-center q-my-xs">
              <div class="text-subtitle2 flex items-center">
                <q-icon name="engineering" size="16px" class="q-mr-xs" />
                Técnicos
              </div>
              <q-btn
                dense
                flat
                round
                icon="add"
                size="sm"
                @click="addTechnical"
              />
            </div>

            <div
              v-for="(t, i) in form.technical"
              :key="t.id"
              class="row items-center q-col-gutter-sm q-my-xs"
            >
              <q-input
                v-model="t.name"
                :label="`Técnico ${i + 1}`"
                dense
                filled
                required
                class="col-8"
              />
              <q-btn
                v-if="form.technical.length > 1"
                dense
                flat
                round
                icon="delete"
                size="sm"
                color="negative"
                @click="removeTechnical(i)"
                class="col-4"
              />
            </div>
          </div>

          <div class="col-6">
            <q-select
              v-model="configStore.settings.theme"
              :options="THEME_OPTIONS"
              label="Tema"
              dense
              filled
              emit-value
              map-options
              @update:model-value="(val) => configStore.updateTheme(val)"
            />
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Módulos -->
        <div class="text-subtitle2 q-my-md">
          <q-icon name="apps" size="16px" class="q-mr-xs" />
          Módulos disponibles
        </div>

        <div class="row q-col-gutter-sm q-mb-md">
          <q-toggle
            :model-value="!configStore.settings.modules.addRepair.disable"
            @update:model-value="
              (val) => configStore.updateModule('addRepair', { disable: !val })
            "
            :label="configStore.settings.modules.addRepair.name"
            color="secondary"
            dense
            class="col-6"
          />
          <q-toggle
            :model-value="!configStore.settings.modules.reports.disable"
            @update:model-value="
              (val) => configStore.updateModule('reports', { disable: !val })
            "
            :label="configStore.settings.modules.reports.name"
            color="secondary"
            dense
            class="col-6"
          />
        </div>

        <!-- Info de ayuda -->
        <q-banner
          :class="$q.dark.isActive ? 'bg-grey-8' : 'bg-blue-1'"
          class="q-mt-sm"
          dense
        >
          <template v-slot:avatar>
            <q-icon name="info" :color="$q.dark.isActive ? 'blue-3' : 'blue'" />
          </template>
          <span class="text-caption">
            Activa solo los módulos que planeas usar. Podrás cambiar esto
            después en configuración.
          </span>
        </q-banner>

        <div class="text-center q-my-md">
          <q-btn
            class="q-px-xl"
            type="submit"
            color="primary"
            unelevated
            :loading="loading"
            :disable="!valid"
            dense
            label="Siguiente "
          />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>
