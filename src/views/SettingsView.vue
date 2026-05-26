<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">Configurações</h1>
      <p class="page-subtitle">Ajuste os horários e preferências da barbearia</p>
    </div>

    <div class="settings-grid">
      <!-- Horários -->
      <div class="card settings-card">
        <div class="settings-card-header">
          <span class="settings-card-icon">🕐</span>
          <div>
            <h2 class="settings-card-title">Horário de Funcionamento</h2>
            <p class="settings-card-desc">Define os slots disponíveis para agendamento</p>
          </div>
        </div>
        <div class="divider" />
        <div class="settings-fields">
          <div class="form-group">
            <label class="form-label">Horário de Abertura</label>
            <input type="time" class="form-input" v-model="form.open_time" />
          </div>
          <div class="form-group">
            <label class="form-label">Horário de Fechamento</label>
            <input type="time" class="form-input" v-model="form.close_time" />
          </div>
          <div class="form-group">
            <label class="form-label">Intervalo entre Slots</label>
            <select class="form-input" v-model="form.slot_interval">
              <option :value="15">15 minutos</option>
              <option :value="20">20 minutos</option>
              <option :value="30">30 minutos</option>
              <option :value="45">45 minutos</option>
              <option :value="60">1 hora</option>
            </select>
          </div>
        </div>
        <div class="slots-preview">
          <p class="slots-preview-label">Preview dos horários gerados:</p>
          <div class="slots-list">
            <span class="slot-chip" v-for="slot in previewSlots" :key="slot">{{ slot }}</span>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="card settings-card">
        <div class="settings-card-header">
          <span class="settings-card-icon">💈</span>
          <div>
            <h2 class="settings-card-title">Informações do Sistema</h2>
            <p class="settings-card-desc">Dados gerais do BarberFlow</p>
          </div>
        </div>
        <div class="divider" />
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">Versão</span>
            <span class="info-value">1.0.0</span>
          </div>
          <div class="info-row">
            <span class="info-label">Banco de dados</span>
            <span class="info-value badge badge-success">Conectado</span>
          </div>
          <div class="info-row">
            <span class="info-label">Total de serviços</span>
            <span class="info-value">{{ servicesStore.services.length }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Slots por dia</span>
            <span class="info-value">{{ previewSlots.length }} horários</span>
          </div>
          <div class="info-row">
            <span class="info-label">Desenvolvido por</span>
            <a class="info-value" href="https://instagram.com/joaopedrojp_15" target="_blank">@joaopedrojp_15</a>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-actions">
      <button class="btn btn-ghost" @click="resetForm" :disabled="saving">
        Cancelar alterações
      </button>
      <button class="btn btn-primary" @click="saveSettings" :disabled="saving">
        <span v-if="saving">Salvando...</span>
        <span v-else>💾 Salvar configurações</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useServicesStore } from '@/stores/servicesStore'
import { useToast } from 'vue-toastification'

const settingsStore = useSettingsStore()
const servicesStore = useServicesStore()
const toast = useToast()
const saving = ref(false)

const form = ref({
  open_time: settingsStore.openTime,
  close_time: settingsStore.closeTime,
  slot_interval: settingsStore.slotInterval
})

watch(() => settingsStore.openTime, v => form.value.open_time = v)
watch(() => settingsStore.closeTime, v => form.value.close_time = v)
watch(() => settingsStore.slotInterval, v => form.value.slot_interval = v)

const previewSlots = computed(() => {
  const slots = []
  const [startH, startM] = form.value.open_time.split(':').map(Number)
  const [endH, endM] = form.value.close_time.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  for (let m = startMinutes; m < endMinutes; m += Number(form.value.slot_interval)) {
    const h = Math.floor(m / 60).toString().padStart(2, '0')
    const min = (m % 60).toString().padStart(2, '0')
    slots.push(`${h}:${min}`)
  }
  return slots
})

function resetForm() {
  form.value = {
    open_time: settingsStore.openTime,
    close_time: settingsStore.closeTime,
    slot_interval: settingsStore.slotInterval
  }
}

async function saveSettings() {
  if (form.value.open_time >= form.value.close_time) {
    toast.error('O horário de abertura deve ser antes do fechamento!')
    return
  }
  saving.value = true
  try {
    await settingsStore.updateSettings(form.value)
    toast.success('Configurações salvas com sucesso!')
  } catch {
    toast.error('Erro ao salvar configurações.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings-page {
  padding: 28px;
  max-width: 900px;
}
.page-header {
  margin-bottom: 28px;
}
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
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}
.settings-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.settings-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.settings-card-icon {
  font-size: 1.6rem;
  line-height: 1;
  margin-top: 2px;
}
.settings-card-title {
  font-family: var(--font-family);
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}
.settings-card-desc {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.settings-fields {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.slots-preview {
  background: var(--color-bg-elevated);
  border-radius: var(--border-radius-sm);
  padding: 12px;
}
.slots-preview-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.slots-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.slot-chip {
  background: var(--color-gold-muted);
  color: var(--color-gold);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 0.75rem;
  font-weight: 500;
}
.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}
.info-label {
  color: var(--color-text-muted);
}
.info-value {
  color: var(--color-text);
  font-weight: 500;
}
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .settings-actions {
    flex-direction: column;
  }
  .settings-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>