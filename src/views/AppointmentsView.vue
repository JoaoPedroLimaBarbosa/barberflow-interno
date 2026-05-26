<template>
  <div class="appointments-view">
    <!-- Weekly Calendar -->
    <div class="card calendar-card">
      <div class="calendar-header">
        <button class="nav-btn" @click="prevWeek">&#8592;</button>
        <div class="week-label">
          <h2 class="week-title">{{ weekLabel }}</h2>
          <button class="today-btn" @click="goToday">Hoje</button>
        </div>
        <button class="nav-btn" @click="nextWeek">&#8594;</button>
      </div>

      <div class="week-days">
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="week-day"
          :class="{
            'week-day--selected': day.date === selectedDate,
            'week-day--today': day.date === today,
            'week-day--sunday': day.isSunday,
            'week-day--holiday': day.isHoliday
          }"
          @click="selectDay(day)"
        >
          <span class="week-day-name">{{ day.shortName }}</span>
          <span class="week-day-num">{{ day.dayNum }}</span>
          <div class="week-day-count">
            <span v-if="getCountForDay(day.date) > 0" class="count-badge">
              {{ getCountForDay(day.date) }}
            </span>
            <span v-else-if="day.isHoliday" class="holiday-indicator" title="Feriado">F</span>
            <span v-else-if="day.isSunday" class="sunday-indicator">—</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Day Schedule -->
    <div class="card schedule-card">
      <div class="schedule-header">
        <div>
          <h2 class="schedule-title">
            {{ formattedSelected }}
          </h2>
          <p class="schedule-meta">
            {{ dayAppointments.length }} agendamento{{ dayAppointments.length !== 1 ? 's' : '' }} —
            {{ freeSlots }} vago{{ freeSlots !== 1 ? 's' : '' }}
          </p>
        </div>
        <button class="btn btn-primary btn-sm" @click="openNewModal">+ Novo</button>
      </div>

      <div v-if="loading" class="loading-state">Carregando...</div>

      <div v-else class="schedule-grid">
        <div
          v-for="slot in slots"
          :key="slot"
          class="slot"
          :class="{
            'slot--occupied': isOccupied(slot),
            'slot--past': isPast(slot) && selectedDate === today
          }"
          @click="handleSlotClick(slot)"
        >
          <span class="slot-time">{{ slot }}</span>
          <template v-if="getAppointment(slot)">
            <div class="slot-content">
              <span class="slot-client">{{ getAppointment(slot).client_name }}</span>
              <span class="slot-service">{{ getAppointment(slot).services?.name || '—' }}</span>
            </div>
            <span class="slot-badge" :class="getAppointment(slot).status === 'cancelado' ? 'badge-danger' : 'badge-gold'">
              {{ getAppointment(slot).status }}
            </span>
          </template>
          <template v-else>
            <span class="slot-free-label">Livre</span>
            <span class="slot-plus">+</span>
          </template>
        </div>

        <div v-if="slots.length === 0" class="empty-state">
          <div class="empty-state-icon">◷</div>
          <p class="empty-state-text">Nenhum horário configurado.</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <AppointmentModal
      v-if="showModal"
      :appointment="editingAppointment"
      :preselected-date="selectedDate"
      :preselected-time="preselectedTime"
      @close="closeModal"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHolidaysStore } from '@/stores/holidaysStore'
import { supabase } from '@/lib/supabase'
import AppointmentModal from '@/components/AppointmentModal.vue'

const appointmentsStore = useAppointmentsStore()
const settingsStore = useSettingsStore()
const holidaysStore = useHolidaysStore()

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const weekOffset = ref(0)
const loading = ref(false)
const showModal = ref(false)
const editingAppointment = ref(null)
const preselectedTime = ref(null)

// weekly appointments cache: date -> list
const weekAppointmentsCache = ref({})

onMounted(() => loadWeekAppointments())

const weekDays = computed(() => {
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const dayOfWeek = now.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset + weekOffset.value * 7)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const { feriado } = holidaysStore.isFeriado(dateStr)
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      shortName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      isSunday: d.getDay() === 0,
      isHoliday: feriado
    })
  }
  return days
})

const weekLabel = computed(() => {
  if (weekDays.value.length < 2) return ''
  const first = new Date(weekDays.value[0].date + 'T12:00:00')
  const last = new Date(weekDays.value[6].date + 'T12:00:00')
  const opts = { day: 'numeric', month: 'short' }
  return `${first.toLocaleDateString('pt-BR', opts)} – ${last.toLocaleDateString('pt-BR', opts)}`
})

const formattedSelected = computed(() => {
  return new Date(selectedDate.value + 'T12:00:00')
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const slots = computed(() => settingsStore.generateSlots())

const dayAppointments = computed(() =>
  (weekAppointmentsCache.value[selectedDate.value] || [])
)

const occupiedTimes = computed(() =>
  dayAppointments.value
    .filter(a => a.status !== 'cancelado')
    .map(a => a.appointment_time?.substring(0, 5))
)

const freeSlots = computed(() =>
  slots.value.filter(s => !occupiedTimes.value.includes(s)).length
)

const currentTimeStr = computed(() => new Date().toTimeString().substring(0, 5))

function getCountForDay(date) {
  return (weekAppointmentsCache.value[date] || []).filter(a => a.status !== 'cancelado').length
}

function isOccupied(slot) {
  return occupiedTimes.value.includes(slot)
}

function isPast(slot) {
  return slot < currentTimeStr.value
}

function getAppointment(slot) {
  return dayAppointments.value.find(a => a.appointment_time?.substring(0, 5) === slot) || null
}

async function loadWeekAppointments() {
  loading.value = true
  try {
    await Promise.all(weekDays.value.map(async (day) => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(id, name, price, duration)')
        .eq('appointment_date', day.date)
        .order('appointment_time', { ascending: true })
      if (!error) weekAppointmentsCache.value[day.date] = data || []
    }))
  } finally {
    loading.value = false
  }
}

function selectDay(day) {
  selectedDate.value = day.date
}

function prevWeek() {
  weekOffset.value--
  loadWeekAppointments()
}

function nextWeek() {
  weekOffset.value++
  loadWeekAppointments()
}

function goToday() {
  weekOffset.value = 0
  selectedDate.value = today
  loadWeekAppointments()
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
  preselectedTime.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingAppointment.value = null
  preselectedTime.value = null
}

async function onSaved() {
  closeModal()
  await loadWeekAppointments()
}

async function onDeleted() {
  closeModal()
  await loadWeekAppointments()
}
</script>

<style scoped>
.appointments-view {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calendar-card {
  padding: 0;
  overflow: hidden;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.week-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.week-title {
  font-size: 0.95rem;
  font-family: var(--font-family);
  font-weight: 500;
  color: var(--color-text);
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.today-btn {
  font-size: 0.75rem;
  color: var(--color-gold);
  background: var(--color-gold-muted);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 20px;
  padding: 3px 12px;
  cursor: pointer;
  transition: background var(--transition);
}

.today-btn:hover {
  background: var(--color-gold-muted-hover);
}

.week-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.week-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 8px;
  cursor: pointer;
  border-right: 1px solid var(--color-border);
  transition: background var(--transition);
}

.week-day:last-child {
  border-right: none;
}

.week-day:hover {
  background: var(--color-bg-elevated);
}

.week-day--selected {
  background: var(--color-gold-muted);
}

.week-day--sunday, .week-day--holiday {
  opacity: 0.5;
  pointer-events: none;
}

.week-day-name {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
  font-weight: 500;
}

.week-day--selected .week-day-name {
  color: var(--color-gold);
}

.week-day--today .week-day-name {
  color: var(--color-gold);
}

.week-day-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  font-family: var(--font-display);
}

.week-day--selected .week-day-num {
  color: var(--color-gold);
}

.week-day-count {
  min-height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-badge {
  background: var(--color-gold);
  color: #0a0a0a;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 7px;
}

.holiday-indicator, .sunday-indicator {
  font-size: 0.65rem;
  color: var(--color-text-muted);
}

/* Schedule */
.schedule-card {
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
  font-size: 1rem;
  text-transform: capitalize;
  margin-bottom: 3px;
}

.schedule-meta {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.schedule-grid {
  padding: 8px 0;
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
.slot:hover { background: var(--color-bg-elevated); }

.slot--occupied { }
.slot--past { opacity: 0.4; }

.slot-time {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  width: 40px;
  flex-shrink: 0;
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

.slot-badge {
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

.slot:hover .slot-free-label { opacity: 1; }

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

@media (max-width: 600px) {
  .week-day-name { font-size: 0.6rem; }
  .week-day-num { font-size: 0.9rem; }
  .week-day { padding: 10px 4px; }
  .slot { padding: 0 16px; }
  .schedule-header { flex-direction: column; gap: 12px; }
}
</style>
