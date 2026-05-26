import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useSettingsStore = defineStore('settings', () => {
  const openTime = ref('08:00')
  const closeTime = ref('19:00')
  const slotInterval = ref(30)
  const settingsId = ref(null)
  const loading = ref(false)

  async function loadSettings() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single()
      if (error) throw error
      if (data) {
        settingsId.value = data.id
        openTime.value = data.open_time?.substring(0, 5) || '08:00'
        closeTime.value = data.close_time?.substring(0, 5) || '19:00'
        slotInterval.value = data.slot_interval || 30
      }
    } catch (e) {
      console.error('Erro ao carregar configurações:', e)
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(payload) {
    if (!settingsId.value) return
    try {
      const { error } = await supabase
        .from('settings')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', settingsId.value)
      if (error) throw error
      if (payload.open_time !== undefined) openTime.value = payload.open_time
      if (payload.close_time !== undefined) closeTime.value = payload.close_time
      if (payload.slot_interval !== undefined) slotInterval.value = payload.slot_interval
    } catch (e) {
      console.error('Erro ao salvar configurações:', e)
      throw e
    }
  }

  // Generate time slots for a day based on settings
  function generateSlots() {
    const slots = []
    const [startH, startM] = openTime.value.split(':').map(Number)
    const [endH, endM] = closeTime.value.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    for (let m = startMinutes; m < endMinutes; m += slotInterval.value) {
      const h = Math.floor(m / 60).toString().padStart(2, '0')
      const min = (m % 60).toString().padStart(2, '0')
      slots.push(`${h}:${min}`)
    }
    return slots
  }

  return { openTime, closeTime, slotInterval, loading, loadSettings, updateSettings, generateSlots }
})
