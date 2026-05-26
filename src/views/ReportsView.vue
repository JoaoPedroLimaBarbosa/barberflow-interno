<template>
  <div class="reports-page">
    <div class="page-header">
      <h1 class="page-title">Relatório de Faturamento</h1>
      <p class="page-subtitle">Acompanhe seu faturamento por período</p>
    </div>

    <!-- Período -->
    <div class="period-tabs">
      <button
        v-for="p in periods"
        :key="p.key"
        class="period-tab"
        :class="{ active: activePeriod === p.key }"
        @click="activePeriod = p.key"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Cards de resumo -->
    <div class="summary-grid">
      <div class="summary-card summary-card--gold">
        <span class="summary-label">Faturamento {{ periodLabel }}</span>
        <span class="summary-value">{{ formatCurrency(totalRevenue) }}</span>
        <span class="summary-sub">{{ confirmedCount }} atendimento{{ confirmedCount !== 1 ? 's' : '' }} confirmado{{ confirmedCount !== 1 ? 's' : '' }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Ticket Médio</span>
        <span class="summary-value">{{ formatCurrency(avgTicket) }}</span>
        <span class="summary-sub">por atendimento</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Cancelamentos</span>
        <span class="summary-value">{{ cancelledCount }}</span>
        <span class="summary-sub">{{ cancelledCount > 0 ? formatCurrency(lostRevenue) + ' perdidos' : 'Nenhum cancelamento' }}</span>
      </div>
      <div class="summary-card">
        <span class="summary-label">Serviço Mais Pedido</span>
        <span class="summary-value summary-value--sm">{{ topService || '—' }}</span>
        <span class="summary-sub">{{ topServiceCount > 0 ? topServiceCount + 'x no período' : 'sem dados' }}</span>
      </div>
    </div>

    <!-- Faturamento por serviço -->
    <div class="card section-card">
      <h2 class="section-title">Faturamento por Serviço</h2>
      <div v-if="loading" class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <p class="empty-state-text">Carregando dados...</p>
      </div>
      <div v-else-if="serviceBreakdown.length === 0" class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p class="empty-state-text">Nenhum atendimento confirmado neste período</p>
      </div>
      <div v-else class="service-list">
        <div v-for="item in serviceBreakdown" :key="item.name" class="service-row">
          <div class="service-row-info">
            <span class="service-row-name">{{ item.name }}</span>
            <span class="service-row-count">{{ item.count }}x</span>
          </div>
          <div class="service-row-bar-wrap">
            <div
              class="service-row-bar"
              :style="{ width: (item.revenue / totalRevenue * 100) + '%' }"
            />
          </div>
          <span class="service-row-value">{{ formatCurrency(item.revenue) }}</span>
        </div>
      </div>
    </div>

    <!-- Lista de agendamentos do período -->
    <div class="card section-card">
      <h2 class="section-title">Agendamentos do Período</h2>
      <div v-if="loading" class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <p class="empty-state-text">Carregando...</p>
      </div>
      <div v-else-if="periodAppointments.length === 0" class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p class="empty-state-text">Nenhum agendamento neste período</p>
      </div>
      <div v-else class="appointments-table">
        <div class="table-header">
          <span>Data</span>
          <span>Cliente</span>
          <span>Serviço</span>
          <span>Valor</span>
          <span>Status</span>
        </div>
        <div
          v-for="a in periodAppointments"
          :key="a.id"
          class="table-row"
        >
          <span class="table-date">{{ formatDate(a.appointment_date) }}</span>
          <span class="table-client">{{ a.client_name }}</span>
          <span class="table-service">{{ a.services?.name || '—' }}</span>
          <span class="table-value">{{ formatCurrency(a.services?.price || 0) }}</span>
          <span class="badge" :class="a.status === 'cancelado' ? 'badge-danger' : 'badge-success'">
            {{ a.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { supabase } from '@/lib/supabase'

const appointmentsStore = useAppointmentsStore()
const loading = ref(false)
const periodAppointments = ref([])
const activePeriod = ref('week')

const periods = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mês' },
]

const periodLabel = computed(() => periods.find(p => p.key === activePeriod.value)?.label || '')

function getDateRange() {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  if (activePeriod.value === 'today') {
    return { from: today, to: today }
  }
  if (activePeriod.value === 'week') {
    const day = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      from: monday.toISOString().split('T')[0],
      to: sunday.toISOString().split('T')[0]
    }
  }
  if (activePeriod.value === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: first.toISOString().split('T')[0],
      to: last.toISOString().split('T')[0]
    }
  }
}

async function loadPeriodData() {
  loading.value = true
  const { from, to } = getDateRange()
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, services(id, name, price, duration)')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
    if (error) throw error
    periodAppointments.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadPeriodData)
watch(activePeriod, loadPeriodData)

const confirmedAppointments = computed(() =>
  periodAppointments.value.filter(a => a.status !== 'cancelado')
)
const confirmedCount = computed(() => confirmedAppointments.value.length)
const cancelledCount = computed(() =>
  periodAppointments.value.filter(a => a.status === 'cancelado').length
)
const totalRevenue = computed(() =>
  confirmedAppointments.value.reduce((sum, a) => sum + (a.services?.price || 0), 0)
)
const lostRevenue = computed(() =>
  periodAppointments.value
    .filter(a => a.status === 'cancelado')
    .reduce((sum, a) => sum + (a.services?.price || 0), 0)
)
const avgTicket = computed(() =>
  confirmedCount.value > 0 ? totalRevenue.value / confirmedCount.value : 0
)

const serviceBreakdown = computed(() => {
  const map = {}
  confirmedAppointments.value.forEach(a => {
    const name = a.services?.name || 'Sem serviço'
    const price = a.services?.price || 0
    if (!map[name]) map[name] = { name, count: 0, revenue: 0 }
    map[name].count++
    map[name].revenue += price
  })
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
})

const topService = computed(() => serviceBreakdown.value[0]?.name || null)
const topServiceCount = computed(() => serviceBreakdown.value[0]?.count || 0)

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit'
  })
}
</script>

<style scoped>
.reports-page {
  padding: 28px;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header { margin-bottom: 4px; }
.page-title {
  font-family: var(--font-family);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
.page-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}
.period-tabs {
  display: flex;
  gap: 8px;
}
.period-tab {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition);
}
.period-tab:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
}
.period-tab.active {
  background: var(--color-gold);
  color: #0a0a0a;
  border-color: var(--color-gold);
  font-weight: 600;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.summary-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.summary-card--gold {
  border-color: rgba(201, 168, 76, 0.3);
  background: linear-gradient(135deg, var(--color-bg-card), rgba(201, 168, 76, 0.04));
}
.summary-label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}
.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.1;
}
.summary-value--sm {
  font-size: 1rem;
}
.summary-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.section-card { padding: 24px; }
.section-title {
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 20px;
}
.service-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.service-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  align-items: center;
  gap: 12px;
}
.service-row-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.service-row-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}
.service-row-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-bg-elevated);
  padding: 1px 7px;
  border-radius: 10px;
}
.service-row-bar-wrap {
  height: 6px;
  background: var(--color-bg-elevated);
  border-radius: 3px;
  overflow: hidden;
}
.service-row-bar {
  height: 100%;
  background: var(--color-gold);
  border-radius: 3px;
  transition: width 0.6s ease;
}
.service-row-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gold);
  white-space: nowrap;
}
.appointments-table {
  display: flex;
  flex-direction: column;
}
.table-header {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 90px 100px;
  padding: 8px 12px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 4px;
}
.table-row {
  display: grid;
  grid-template-columns: 60px 1fr 1fr 90px 100px;
  padding: 12px 12px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border);
  align-items: center;
  transition: background var(--transition);
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: var(--color-bg-elevated); border-radius: 8px; }
.table-date { color: var(--color-text-muted); font-size: 0.8rem; }
.table-client { font-weight: 500; color: var(--color-text); }
.table-service { color: var(--color-text-muted); font-size: 0.82rem; }
.table-value { font-weight: 600; color: var(--color-gold); }

@media (max-width: 768px) {
  .reports-page { padding: 16px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .table-header { display: none; }
  .table-row {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 4px;
    padding: 12px;
  }
  .table-date { grid-column: 1; font-size: 0.75rem; }
  .table-client { grid-column: 2; text-align: right; }
  .table-service { grid-column: 1; color: var(--color-text-muted); }
  .table-value { grid-column: 2; text-align: right; }
  .table-row .badge { grid-column: 1; width: fit-content; }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr; }
  .period-tabs { flex-wrap: wrap; }
}
</style>