import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useServicesStore = defineStore('services', () => {
  const services = ref([])
  const loading = ref(false)

  async function loadServices() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      services.value = data || []
    } catch (e) {
      console.error('Erro ao carregar serviços:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createService(payload) {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      services.value.push(data)
      return data
    } catch (e) {
      console.error('Erro ao criar serviço:', e)
      throw e
    }
  }

  async function updateService(id, payload) {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      const idx = services.value.findIndex(s => s.id === id)
      if (idx !== -1) services.value[idx] = data
      return data
    } catch (e) {
      console.error('Erro ao atualizar serviço:', e)
      throw e
    }
  }

  async function deleteService(id) {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      if (error) throw error
      services.value = services.value.filter(s => s.id !== id)
    } catch (e) {
      console.error('Erro ao excluir serviço:', e)
      throw e
    }
  }

  function getServiceById(id) {
    return services.value.find(s => s.id === id) || null
  }

  return { services, loading, loadServices, createService, updateService, deleteService, getServiceById }
})
