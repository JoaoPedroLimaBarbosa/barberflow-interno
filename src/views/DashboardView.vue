<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">◷</div>
        <div class="stat-info">
          <span class="stat-label">Agendamentos Hoje</span>
          <span class="stat-value">{{ todayAppointments.length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">◈</div>
        <div class="stat-info">
          <span class="stat-label">Próximo Cliente</span>
          <span class="stat-value stat-value--sm">
            <template v-if="nextAppointment">
              {{ nextAppointment.client_name }}
              <small class="stat-sub">{{ nextAppointment.appointment_time?.substring(0,5) }}</small>
            </template>
            <template v-else>—</template>
          </span>
        </div>
      </div>
      <div class="stat-card stat-card--gold">
        <div class="stat-icon">R$</div>
        <div class="stat-info">
          <span class="stat-label">Faturamento Estimado</span>
          <span class="stat-value">{{ formatCurrency(estimatedRevenue) }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">○</div>
        <div class="stat-info">
          <span class="stat-label">Horários Vagos</span>
          <span class="stat-value">{{ freeSlots }}</span>
        </div>
      </div>
    </div>

    <!-- Day Schedule -->
    <div class="schedule-section card">
      <div class="schedule-header">
        <div>
          <h2 class="schedule-title">Agenda do Dia</h2>
          <p class="schedule-date">{{ formattedToday }}</p>
        </div>
        <div class="schedule-legend">
          <span class="legend-item"><span class="legend-dot legend-dot--occupied" />Ocupado</span>
          <span class="legend-item"><span class="legend-dot legend-dot--free" />Livre</span>
        </div>
      </div>

      <div v-if="loading" class="loading-state">Carregando agenda...</div>

      <div v-else class="schedule-grid" ref="scheduleRef">
        <!-- Red line indicator -->
        <div v-if="currentLinePos !== null" class="time-indicator" :style="{ top: currentLinePos + 'px' }">
          <div class="time-indicator-dot" />
          <div class="time-indicator-line" />
          <span class="time-indicator-label">{{ currentTimeStr }}</span>
        </div>

        <div
          v-for="slot in slots"
          :key="slot"
          class="slot"
          :class="{
            'slot--occupied': isOccupied(slot),
            'slot--past': isPast(slot),
            'slot--current': isCurrent(slot)
          }"
          @click="handleSlotClick(slot)"
        >
          <span class="slot-time">{{ slot }}</span>
          <template v-if="getAppointment(slot)">
            <div class="slot-content">
              <span class="slot-client">{{ getAppointment(slot)?.client_name }}</span>
              <span class="slot-service">{{ getAppointment(slot)?.services?.name || '—' }}</span>
            </div>
            <span class="slot-status-badge" :class="getAppointment(slot)?.status === 'cancelado' ? 'badge-danger' : 'badge-gold'">
              {{ getAppointment(slot)?.status }}
            </span>
          </template>
          <template v-else>
            <span class="slot-free-label">Livre — clique para agendar</span>
            <span class="slot-plus">+</span>
          </template>
        </div>
      </div>
    </div>

    <!-- FAB Button -->
    <button class="fab" @click="openNewModal" title="Novo agendamento">+</button>

    <!-- Appointment Modal -->
    <AppointmentModal
      v-if="showModal"
      :appointment="editingAppointment"
      :preselected-date="today"
      :preselected-time="preselectedTime"
      @close="closeModal"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useServicesStore } from '@/stores/servicesStore'
import AppointmentModal from '@/components/AppointmentModal.vue'

const appointmentsStore = useAppointmentsStore()
const settingsStore = useSettingsStore()
const servicesStore = useServicesStore()

const today = new Date().toISOString().split('T')[0]
const loading = ref(false)
const showModal = ref(false)
const editingAppointment = ref(null)
const preselectedTime = ref(null)
const scheduleRef = ref(null)

const now = ref(new Date())
let timer = null

onMounted(async () => {
  loading.value = true
  await appointmentsStore.loadAppointments(today)
  loading.value = false
  timer = setInterval(() => { now.value = new Date() }, 60000)
})

onUnmounted(() => clearInterval(timer))

const formattedToday = computed(() =>
  new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
)

const slots = computed(() => settingsStore.generateSlots())

const todayAppointments = computed(() =>
  appointmentsStore.appointments.filter(a => a.appointment_date === today)
)

const occupiedTimes = computed(() => appointmentsStore.getOccupiedTimes(today))

const nextAppointment = computed(() => {
  const nowTimeStr = now.value.toTimeString().substring(0, 5)
  return todayAppointments.value.find(
    a => a.status !== 'cancelado' && a.appointment_time?.substring(0, 5) >= nowTimeStr
  ) || null
})

const estimatedRevenue = computed(() =>
  todayAppointments.value
    .filter(a => a.status === 'confirmado')
    .reduce((sum, a) => sum + (a.services?.price || 0), 0)
)

const freeSlots = computed(() =>
  slots.value.filter(s => !occupiedTimes.value.includes(s)).length
)

const currentTimeStr = computed(() => now.value.toTimeString().substring(0, 5))

const currentLinePos = computed(() => {
  if (!scheduleRef.value) return null
  const nowStr = currentTimeStr.value
  const [openH, openM] = settingsStore.openTime.split(':').map(Number)
  const [closeH, closeM] = settingsStore.closeTime.split(':').map(Number)
  const [nowH, nowM] = nowStr.split(':').map(Number)
  const openMins = openH * 60 + openM
  const closeMins = closeH * 60 + closeM
  const nowMins = nowH * 60 + nowM
  if (nowMins < openMins || nowMins > closeMins) return null
  const totalMins = closeMins - openMins
  const elapsed = nowMins - openMins
  const slotHeight = 56 // px per slot
  return Math.round((elapsed / settingsStore.slotInterval) * slotHeight)
})

function isOccupied(slot) {
  return occupiedTimes.value.includes(slot)
}

function isPast(slot) {
  return slot < currentTimeStr.value
}

function isCurrent(slot) {
  const [slotH, slotM] = slot.split(':').map(Number)
  const [nowH, nowM] = currentTimeStr.value.split(':').map(Number)
  const slotMins = slotH * 60 + slotM
  const nowMins = nowH * 60 + nowM
  return nowMins >= slotMins && nowMins < slotMins + settingsStore.slotInterval
}

function getAppointment(slot) {
  return appointmentsStore.getAppointmentByDateAndTime(today, slot)
}

function handleSlotClick(slot) {
  const appt = getAppointment(slot)
  if (appt) {
    editingAppointment.value = appt
    preselectedTime.value = null
  } else {
    editingAppointment.value = null
    preselectedTime.value = slot
  }
  showModal.value = true
}

function openNewModal() {
  editingAppointment.value = null
  const free = slots.value.find(s => !occupiedTimes.value.includes(s) && s >= currentTimeStr.value)
  preselectedTime.value = free || null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAppointment.value = null
  preselectedTime.value = null
}

async function onSaved() {
  closeModal()
  loading.value = true
  await appointmentsStore.loadAppointments(today)
  loading.value = false
}

async function onDeleted() {
  closeModal()
  loading.value = true
  await appointmentsStore.loadAppointments(today)
  loading.value = false
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color var(--transition);
}

.stat-card:hover {
  border-color: rgba(201, 168, 76, 0.3);
}

.stat-card--gold {
  border-color: rgba(201, 168, 76, 0.3);
  background: linear-gradient(135deg, var(--color-bg-card), rgba(201, 168, 76, 0.04));
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-gold-muted);
  color: var(--color-gold);
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-label {
  font-size: 0.72rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  white-space: nowrap;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.stat-value--sm {
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-sub {
  display: block;
  font-family: var(--font-family);
  font-size: 0.75rem;
  color: var(--color-gold);
  font-weight: 500;
  margin-top: 2px;
}

/* Schedule */
.schedule-section {
  padding: 0;
  overflow: hidden;
}

.schedule-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.schedule-title {
  font-size: 1.1rem;
  margin-bottom: 2px;
}

.schedule-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.schedule-legend {
  display: flex;
  align-items: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-dot--occupied { background: var(--color-gold); }
.legend-dot--free { background: var(--color-border); }

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.schedule-grid {
  position: relative;
  padding: 8px 0;
}

.time-indicator {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0;
  z-index: 10;
  pointer-events: none;
}

.time-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  flex-shrink: 0;
}

.time-indicator-line {
  flex: 1;
  height: 1px;
  background: var(--color-danger);
  opacity: 0.7;
}

.time-indicator-label {
  font-size: 0.7rem;
  color: var(--color-danger);
  padding: 0 8px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.slot {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition);
}

.slot:last-child { border-bottom: none; }

.slot:hover {
  background: var(--color-bg-elevated);
}

.slot--past {
  opacity: 0.45;
}

.slot--current {
  background: var(--color-gold-muted);
  opacity: 1;
}

.slot--occupied {
  opacity: 1;
}

.slot--occupied.slot--past {
  opacity: 0.5;
}

.slot-time {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  width: 40px;
  flex-shrink: 0;
}

.slot--current .slot-time {
  color: var(--color-gold);
}

.slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.slot-client {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.slot-service {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.slot-status-badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.slot-free-label {
  flex: 1;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  opacity: 0;
  transition: opacity var(--transition);
}

.slot:hover .slot-free-label {
  opacity: 1;
}

.slot-plus {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px dashed var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--color-text-muted);
  transition: all var(--transition);
}

.slot:hover .slot-plus {
  border-color: var(--color-gold);
  color: var(--color-gold);
  background: var(--color-gold-muted);
}

/* FAB */
.fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-gold);
  color: #0a0a0a;
  font-size: 1.6rem;
  font-weight: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(201, 168, 76, 0.4);
  transition: all var(--transition);
  z-index: 200;
  border: none;
  cursor: pointer;
}

.fab:hover {
  background: var(--color-gold-dark);
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(201, 168, 76, 0.5);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .dashboard {
    gap: 16px;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .stat-card {
    padding: 14px;
    gap: 10px;
  }
  .stat-icon {
    width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
  .stat-value {
    font-size: 1.2rem;
  }
  .schedule-header {
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }
  .slot {
    padding: 0 16px;
    height: 52px;
  }
  .fab {
    bottom: 20px;
    right: 16px;
    width: 50px;
    height: 50px;
    font-size: 1.4rem;
  }
}
@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .stat-label {
    font-size: 0.65rem;
  }
}
</style>
