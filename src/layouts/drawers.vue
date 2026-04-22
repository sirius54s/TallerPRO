<script setup lang="ts">
import { ref } from "vue"
import { useAuthStore } from "src/stores/authStore"

const auth = useAuthStore()

const list = ref([
  { name: "Inbox", id: 1, icon: "inbox", selected: false },
  { name: "Star", id: 2, icon: "star", selected: true },
  { name: "Send", id: 3, icon: "send", selected: false },
  { name: "Drafts", id: 4, icon: "drafts", selected: false },
])
</script>

<template>
  <q-drawer v-if="auth.user" show-if-above :width="200" :breakpoint="400">
    <q-scroll-area
      style="
        height: calc(100% - 150px);
        margin-top: 150px;
        border-right: 1px solid #ddd;
      "
    >
      <q-list padding>
        <q-item
          :active="item.selected"
          clickable
          v-ripple
          v-for="item in list"
          :key="item.id"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section> {{ item.name }} </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>

    <q-img
      class="absolute-top"
      src="https://cdn.quasar.dev/img/material.png"
      style="height: 150px"
    >
      <div class="absolute-bottom bg-transparent">
        <q-avatar size="56px" class="q-mb-sm">
          <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
        </q-avatar>
        <div class="text-weight-bold">name user</div>
        <div>{{ auth.user?.email }}</div>
      </div>
    </q-img>
  </q-drawer>
</template>
