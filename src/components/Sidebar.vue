<template>
  <aside class="sidebar" :class="{ 'sidebar-open': isOpen }">
    <div class="sidebar-logo">
      <span class="sidebar-logo-icon">✂</span>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">BarberFlow</span>
        <span class="sidebar-logo-sub">Interno</span>
      </div>
    </div>

    <div class="gold-line sidebar-divider" />

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="sidebar-nav-item"
        :class="{ active: isActive(item.path) }"
        @click="$emit('close')"
      >
        <span class="sidebar-nav-icon">{{ item.icon }}</span>
        <span class="sidebar-nav-label">{{ item.label }}</span>
        <span v-if="isActive(item.path)" class="sidebar-nav-indicator" />
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-footer-text">
        Desenvolvido por<br />
        <a href="https://instagram.com/joaopedrojp_15" target="_blank">@joaopedrojp_15</a>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineProps({ isOpen: Boolean })
defineEmits(['close'])

const route = useRoute()

const navItems = [
  { path: '/', icon: '◈', label: 'Dashboard' },
  { path: '/agendamentos', icon: '◷', label: 'Agendamentos' },
  { path: '/servicos', icon: '✦', label: 'Serviços' },
  { path: '/relatorios', icon: '📊', label: 'Relatórios' },
  { path: '/configuracoes', icon: '⚙', label: 'Configurações' }
]

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  transition: transform var(--transition);
  z-index: 100;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px 20px;
}

.sidebar-logo-icon {
  font-size: 1.6rem;
  color: var(--color-gold);
  line-height: 1;
}

.sidebar-logo-text {
  display: flex;
  flex-direction: column;
}

.sidebar-logo-name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.1;
}

.sidebar-logo-sub {
  font-size: 0.7rem;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
}

.sidebar-divider {
  margin: 0 20px 20px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: var(--border-radius-sm);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all var(--transition);
  position: relative;
}

.sidebar-nav-item:hover {
  color: var(--color-text);
  background: var(--color-bg-elevated);
}

.sidebar-nav-item.active {
  color: var(--color-gold);
  background: var(--color-gold-muted);
}

.sidebar-nav-icon {
  font-size: 1rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.sidebar-nav-label {
  flex: 1;
}

.sidebar-nav-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-gold);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--color-border);
}

.sidebar-footer-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.sidebar-footer-text a {
  color: var(--color-gold);
  font-weight: 500;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    box-shadow: 4px 0 30px rgba(0,0,0,0.5);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>
