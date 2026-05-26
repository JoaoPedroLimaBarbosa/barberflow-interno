<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="hamburger" @click="$emit('toggle-sidebar')" aria-label="Menu">
        <span class="hamburger-line" :class="{ open: sidebarOpen }" />
        <span class="hamburger-line" :class="{ open: sidebarOpen }" />
        <span class="hamburger-line" :class="{ open: sidebarOpen }" />
      </button>
      <div class="navbar-title-group">
        <span class="navbar-page-label">{{ currentPageTitle }}</span>
        <span class="navbar-date">{{ formattedDate }}</span>
      </div>
    </div>
    <div class="navbar-right">
      <div class="time-chip">
        <span class="time-dot" />
        <span class="time-value">{{ currentTime }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

defineProps({ sidebarOpen: Boolean })
defineEmits(['toggle-sidebar'])

const route = useRoute()
const now = ref(new Date())
let timer = null

onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => clearInterval(timer))

const titles = { '/': 'Dashboard', '/agendamentos': 'Agendamentos', '/servicos': 'Serviços' }
const currentPageTitle = computed(() => titles[route.path] || 'BarberFlow')

const formattedDate = computed(() =>
  now.value.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
)

const currentTime = computed(() =>
  now.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
)
</script>

<style scoped>
.navbar {
  height: 68px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
}
.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}
.hamburger-line {
  width: 16px;
  height: 2px;
  background: var(--color-text-muted);
  border-radius: 2px;
  transition: all var(--transition);
}
.navbar-title-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.navbar-page-label {
  font-family: var(--font-family);
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.1;
  letter-spacing: 0.01em;
}
.navbar-date {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-gold);
  text-transform: capitalize;
  letter-spacing: 0.02em;
  opacity: 0.85;
}
.time-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 6px 14px;
}
.time-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-gold);
  animation: pulse 2s infinite;
}
.time-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
}
@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }
  .navbar-page-label {
    font-size: 1rem;
  }
  .navbar-date {
    font-size: 0.72rem;
  }
  .time-chip {
    padding: 5px 10px;
  }
  .time-value {
    font-size: 0.8rem;
  }
}
</style>