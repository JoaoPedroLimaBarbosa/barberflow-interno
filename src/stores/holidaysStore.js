import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHolidaysStore = defineStore('holidays', () => {
  const holidays = ref([])
  const loadedYear = ref(null)
  const loading = ref(false)

  async function loadHolidays(year = new Date().getFullYear()) {
    if (loadedYear.value === year) return
    loading.value = true
    try {
      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
      if (!res.ok) throw new Error('Falha ao carregar feriados')
      const data = await res.json()
      holidays.value = data
      loadedYear.value = year
    } catch (e) {
      console.error('Erro ao buscar feriados:', e)
      holidays.value = []
    } finally {
      loading.value = false
    }
  }

  function isFeriado(date) {
    // date expected as 'YYYY-MM-DD'
    const found = holidays.value.find(h => h.date === date)
    if (found) {
      return { feriado: true, nome: found.name }
    }
    return { feriado: false, nome: null }
  }

  return { holidays, loadedYear, loading, loadHolidays, isFeriado }
})
