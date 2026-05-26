<template>
  <div class="services-view">
    <div class="services-header">
      <div>
        <h1 class="services-title">Serviços</h1>
        <p class="services-sub">{{ servicesStore.services.length }} serviço{{ servicesStore.services.length !== 1 ? 's' : '' }} cadastrado{{ servicesStore.services.length !== 1 ? 's' : '' }}</p>
      </div>
      <button class="btn btn-primary" @click="openNewModal">+ Novo Serviço</button>
    </div>

    <!-- Loading -->
    <div v-if="servicesStore.loading" class="loading-state">Carregando serviços...</div>

    <!-- Empty -->
    <div v-else-if="servicesStore.services.length === 0" class="empty-state card">
      <div class="empty-state-icon">✦</div>
      <p class="empty-state-text">Nenhum serviço cadastrado ainda.</p>
      <button class="btn btn-ghost" style="margin-top: 16px" @click="openNewModal">Cadastrar primeiro serviço</button>
    </div>

    <!-- Services Grid -->
    <div v-else class="services-grid">
      <div
        v-for="service in servicesStore.services"
        :key="service.id"
        class="service-card card"
      >
        <div class="service-card-top">
          <div class="service-icon">✦</div>
          <div class="service-actions">
            <button class="action-btn" @click="openEditModal(service)" title="Editar">✎</button>
            <button class="action-btn action-btn--danger" @click="handleDelete(service)" title="Excluir">✕</button>
          </div>
        </div>
        <h3 class="service-name">{{ service.name }}</h3>
        <div class="service-details">
          <div class="service-detail">
            <span class="service-detail-label">Preço</span>
            <span class="service-detail-value service-price">{{ formatCurrency(service.price) }}</span>
          </div>
          <div class="service-detail">
            <span class="service-detail-label">Duração</span>
            <span class="service-detail-value">{{ service.duration }}min</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">{{ editingService ? 'Editar Serviço' : 'Novo Serviço' }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Nome *</label>
            <input v-model="form.name" type="text" class="form-input" placeholder="Nome do serviço" />
          </div>
          <div class="form-group">
            <label class="form-label">Preço (R$) *</label>
            <input v-model="form.price" type="number" step="0.01" min="0" class="form-input" placeholder="0,00" />
          </div>
          <div class="form-group">
            <label class="form-label">Duração (minutos) *</label>
            <input v-model="form.duration" type="number" min="1" class="form-input" placeholder="30" />
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost btn-sm" @click="closeModal">Cancelar</button>
            <button
              class="btn btn-primary btn-sm"
              @click="handleSave"
              :disabled="saving || !isFormValid"
            >
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useServicesStore } from '@/stores/servicesStore'
import { useToast } from 'vue-toastification'

const servicesStore = useServicesStore()
const toast = useToast()

const showModal = ref(false)
const editingService = ref(null)
const saving = ref(false)

const form = ref({ name: '', price: '', duration: '' })

const isFormValid = computed(() =>
  form.value.name.trim() &&
  Number(form.value.price) >= 0 &&
  Number(form.value.duration) > 0
)

function openNewModal() {
  editingService.value = null
  form.value = { name: '', price: '', duration: '' }
  showModal.value = true
}

function openEditModal(service) {
  editingService.value = service
  form.value = { name: service.name, price: service.price, duration: service.duration }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingService.value = null
}

async function handleSave() {
  if (!isFormValid.value) return
  saving.value = true
  try {
    const payload = {
      name: form.value.name.trim(),
      price: parseFloat(form.value.price),
      duration: parseInt(form.value.duration)
    }
    if (editingService.value) {
      await servicesStore.updateService(editingService.value.id, payload)
      toast.success('Serviço atualizado!')
    } else {
      await servicesStore.createService(payload)
      toast.success('Serviço criado!')
    }
    closeModal()
  } catch (e) {
    toast.error('Erro ao salvar serviço.')
  } finally {
    saving.value = false
  }
}

async function handleDelete(service) {
  if (!confirm(`Excluir "${service.name}"?`)) return
  try {
    await servicesStore.deleteService(service.id)
    toast.success('Serviço excluído.')
  } catch (e) {
    toast.error('Erro ao excluir serviço.')
  }
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
</script>

<style scoped>
.services-view {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.services-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.services-title {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.services-sub {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 60px 24px;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.service-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: border-color var(--transition), transform var(--transition);
}

.service-card:hover {
  border-color: rgba(201, 168, 76, 0.35);
  transform: translateY(-2px);
}

.service-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.service-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-gold-muted);
  color: var(--color-gold);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.action-btn:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

.action-btn--danger:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
}

.service-name {
  font-size: 1rem;
  font-family: var(--font-display);
  font-weight: 600;
}

.service-details {
  display: flex;
  gap: 20px;
}

.service-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.service-detail-label {
  font-size: 0.68rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.service-detail-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}

.service-price {
  color: var(--color-gold);
}

/* Reuse modal styles from global */
.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  margin-top: 8px;
}

@media (max-width: 480px) {
  .services-header {
    flex-direction: column;
  }
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>
