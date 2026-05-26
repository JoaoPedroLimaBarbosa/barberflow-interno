import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref([])
  const loading = ref(false)

  async function loadAppointments(date = null) {
    loading.value = true
    try {
      let query = supabase
        .from('appointments')
        .select('*, services(id, name, price, duration)')
        .order('appointment_time', { ascending: true })
      if (date) {
        query = query.eq('appointment_date', date)
      }
      const { data, error } = await query
      if (error) throw error
      appointments.value = data || []
      return data || []
    } catch (e) {
      console.error('Erro ao carregar agendamentos:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createAppointment(payload) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([payload])
        .select('*, services(id, name, price, duration)')
        .single()
      if (error) throw error
      appointments.value.push(data)
      appointments.value.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
      return data
    } catch (e) {
      console.error('Erro ao criar agendamento:', e)
      throw e
    }
  }

  async function updateAppointment(id, payload) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id)
        .select('*, services(id, name, price, duration)')
        .single()
      if (error) throw error
      const idx = appointments.value.findIndex(a => a.id === id)
      if (idx !== -1) appointments.value[idx] = data
      return data
    } catch (e) {
      console.error('Erro ao atualizar agendamento:', e)
      throw e
    }
  }

  async function deleteAppointment(id) {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
      if (error) throw error
      appointments.value = appointments.value.filter(a => a.id !== id)
    } catch (e) {
      console.error('Erro ao excluir agendamento:', e)
      throw e
    }
  }

  function getOccupiedTimes(date) {
    return appointments.value
      .filter(a => a.appointment_date === date && a.status !== 'cancelado')
      .map(a => a.appointment_time?.substring(0, 5))
  }

  function getAppointmentByDateAndTime(date, time) {
    return appointments.value.find(
      a => a.appointment_date === date && a.appointment_time?.substring(0, 5) === time
    ) || null
  }

  return {
    appointments,
    loading,
    loadAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getOccupiedTimes,
    getAppointmentByDateAndTime
  }
})
