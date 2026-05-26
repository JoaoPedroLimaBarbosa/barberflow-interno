<template>
  <AppLayout />
</template>

<script setup>
import AppLayout from '@/components/AppLayout.vue'
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useServicesStore } from '@/stores/servicesStore'
import { useHolidaysStore } from '@/stores/holidaysStore'

const settingsStore = useSettingsStore()
const servicesStore = useServicesStore()
const holidaysStore = useHolidaysStore()

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    servicesStore.loadServices(),
    holidaysStore.loadHolidays()
  ])
})
</script>
