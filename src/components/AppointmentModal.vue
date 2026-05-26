<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">{{ appointment ? 'Editar Agendamento' : 'Novo Agendamento' }}</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <!-- Date block warning -->
        <div v-if="dateWarning" class="date-warning">
          <span class="date-warning-icon">⚠</span>
          <span>{{ dateWarning }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Nome do Cliente *</label>
          <input
            v-model="form.client_name"
            type="text"
            class="form-input"
            placeholder="Nome completo"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">Serviço *</label>
          <select v-model="form.service_id" class="form-input">
            <option value="">Selecione um serviço</option>
            <option v-for="s in servicesStore.services" :key="s.id" :value="s.id">
              {{ s.name }} — {{ formatCurrency(s.price) }} ({{ s.duration }}min)
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Data *</label>
          <input
            v-model="form.appointment_date"
            type="date"
            class="form-input"
            :min="minDate"
            @change="onDateChange"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Horário *</label>
          <select v-model="form.appointment_time" class="form-input" :disabled="!!dateWarning">
            <option value="">Selecione um horário</option>
            <option v-for="slot in availableSlots" :key="slot" :value="slot">{{ slot }}</option>
          </select>
          <span v-if="availableSlots.length === 0 && !dateWarning" class="form-hint">
            Nenhum horário disponível para esta data.
          </span>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="form.status" class="form-input">
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div class="modal-footer">
          <button v-if="appointment" class="btn btn-danger btn-sm" @click="handleDelete" :disabled="saving">
            Excluir
          </button>
          <div style="flex: 1" />
          <button class="btn btn-ghost btn-sm" @click="$emit('close')">Cancelar</button>
          <button
            class="btn btn-primary btn-sm"
            @click="handleSave"
            :disabled="saving || !!dateWarning || !isFormValid"
          >
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAppointmentsStore } from '@/stores/appointmentsStore'
import { useServicesStore } from '@/stores/servicesStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHolidaysStore } from '@/stores/holidaysStore'
import { useToast } from 'vue-toastification'

const props = defineProps({
  appointment: { type: Object, default: null },
  preselectedDate: { type: String, default: null },
  preselectedTime: { type: String, default: null }
})
const emit = defineEmits(['close', 'saved', 'deleted'])

const toast = useToast()
const appointmentsStore = useAppointmentsStore()
const servicesStore = useServicesStore()
const settingsStore = useSettingsStore()
const holidaysStore = useHolidaysStore()

const saving = ref(false)
const minDate = new Date().toISOString().split('T')[0]

const form = ref({
  client_name: '',
  service_id: '',
  appointment_date: props.preselectedDate || minDate,
  appointment_time: props.preselectedTime || '',
  status: 'confirmado'
})

onMounted(() => {
  if (props.appointment) {
    form.value = {
      client_name: props.appointment.client_name || '',
      service_id: props.appointment.service_id || '',
      appointment_date: props.appointment.appointment_date || minDate,
      appointment_time: props.appointment.appointment_time?.substring(0, 5) || '',
      status: props.appointment.status || 'confirmado'
    }
  }
})

const dateWarning = computed(() => {
  const d = form.value.appointment_date
  if (!d) return null
  const date = new Date(d + 'T12:00:00')
  if (date.getDay() === 0) return 'Domingos não são atendidos.'
  const { feriado, nome } = holidaysStore.isFeriado(d)
  if (feriado) return `Feriado nacional: ${nome}`
  return null
})

const availableSlots = computed(() => {
  const allSlots = settingsStore.generateSlots()
  const occupied = appointmentsStore.getOccupiedTimes(form.value.appointment_date)
  return allSlots.filter(slot => {
    if (props.appointment && slot === props.appointment.appointment_time?.substring(0, 5)) return true
    return !occupied.includes(slot)
  })
})

const isFormValid = computed(() =>
  form.value.client_name.trim() &&
  form.value.appointment_date &&
  form.value.appointment_time
)

function onDateChange() {
  // reload appointments for the selected date to update occupied slots
  appointmentsStore.loadAppointments(form.value.appointment_date)
  form.value.appointment_time = ''
}

async function handleSave() {
  if (!isFormValid.value || dateWarning.value) return
  saving.value = true
  try {
    const payload = {
      client_name: form.value.client_name.trim(),
      service_id: form.value.service_id || null,
      appointment_date: form.value.appointment_date,
      appointment_time: form.value.appointment_time,
      status: form.value.status
    }
    if (props.appointment) {
      await appointmentsStore.updateAppointment(props.appointment.id, payload)
      toast.success('Agendamento atualizado!')
    } else {
      await appointmentsStore.createAppointment(payload)
      toast.success('Agendamento criado!')
    }
    emit('saved')
  } catch (e) {
    toast.error('Erro ao salvar agendamento.')
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.appointment) return
  if (!confirm('Excluir este agendamento?')) return
  saving.value = true
  try {
    await appointmentsStore.deleteAppointment(props.appointment.id)
    toast.success('Agendamento excluído.')
    emit('deleted')
  } catch (e) {
    toast.error('Erro ao excluir agendamento.')
  } finally {
    saving.value = false
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<style scoped>
.date-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-danger-bg);
  border: 1px solid rgba(224, 85, 85, 0.25);
  border-radius: var(--border-radius-sm);
  color: var(--color-danger);
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.date-warning-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  margin-top: 8px;
}
</style>
