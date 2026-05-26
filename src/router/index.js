import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import AppointmentsView from '@/views/AppointmentsView.vue'
import ServicesView from '@/views/ServicesView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import SettingsView from '@/views/SettingsView.vue'
import ReportsView from '@/views/ReportsView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/agendamentos',
    name: 'appointments',
    component: AppointmentsView,
    meta: { title: 'Agendamentos' }
  },
  {
    path: '/servicos',
    name: 'services',
    component: ServicesView,
    meta: { title: 'Serviços' }
  },
  {
    path: '/configuracoes',
    name: 'settings',
    component: SettingsView,
    meta: { title: 'Configurações' }
  },
  {
    path: '/relatorios',
    name: 'reports',
    component: ReportsView,
    meta: { title: 'Relatórios' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '404' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = `${to.meta.title || 'BarberFlow'} — BarberFlow`
})

export default router
