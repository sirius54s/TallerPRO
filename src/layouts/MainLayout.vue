<script setup lang="ts">
import mainNavbar from "src/layouts/mainNavbar.vue"
import drawers from "src/layouts/drawers.vue"
</script>

<template>
  <div>
    <q-layout view="lHh Lpr lff" class="shadow-2 rounded-borders">
      <q-header elevated>
        <mainNavbar />
      </q-header>

      <drawers />

      <!-- Contenedor principal donde se renderiza el contenido -->
      <q-page-container>
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<style scoped></style>
