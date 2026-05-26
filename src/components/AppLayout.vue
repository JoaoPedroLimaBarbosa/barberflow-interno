<template>
  <div class="app-layout">
    <!-- Mobile overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <Sidebar :isOpen="sidebarOpen" @close="sidebarOpen = false" />

    <div class="main-wrapper">
      <Navbar :sidebarOpen="sidebarOpen" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const sidebarOpen = ref(false)
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}
.sidebar-overlay {
  display: none;
}
.main-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  padding: 28px;
  min-height: 0;
}
.page-enter-active, .page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (max-width: 768px) {
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 99;
  }
  .main-content {
    padding: 12px;
    padding-bottom: 80px;
  }
}
</style>