<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-copa-blue-500">Gerenciar Competições</h1>
      <button
        @click="openModal()"
        class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 transition-colors"
      >
        + Nova Competição
      </button>
    </div>

    <!-- Lista de Competições -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="competition in competitions"
        :key="competition.id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-xl font-bold text-gray-900">{{ competition.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ competition.slug }}</p>
              <p class="text-sm text-gray-500 mt-1">Ano: {{ competition.year }}</p>
            </div>
            <span
              :class="competition.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-2 py-1 rounded text-xs font-semibold"
            >
              {{ competition.is_active ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">Multiplicador de Pontos</p>
            <p class="text-2xl font-bold text-copa-blue-500">{{ competition.score_multiplier }}x</p>
          </div>

          <div class="flex justify-end space-x-2 pt-4 border-t">
            <button
              @click="openModal(competition)"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Editar
            </button>
            <button
              @click="deleteCompetition(competition.id)"
              class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sem Competições -->
    <div v-if="competitions.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Nenhuma competição encontrada</h3>
      <p class="text-gray-600">Adicione uma nova competição para começar.</p>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            {{ editingCompetition ? 'Editar Competição' : 'Nova Competição' }}
          </h2>

          <form @submit.prevent="saveCompetition" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="Ex: Campeonato Brasileiro 2024"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
              <input
                v-model="form.slug"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="Ex: brasileirao-2024"
              />
              <p class="text-xs text-gray-500 mt-1">Usado na URL (sem espaços, apenas letras minúsculas e hífens)</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ano *</label>
              <input
                v-model.number="form.year"
                type="number"
                min="2020"
                max="2100"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="Ex: 2024"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Multiplicador de Pontos *</label>
              <input
                v-model.number="form.score_multiplier"
                type="number"
                step="0.5"
                min="1"
                max="10"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="Ex: 1.0"
              />
              <p class="text-xs text-gray-500 mt-1">Multiplicador de pontos para jogos desta competição</p>
            </div>

            <div class="flex items-center">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="mr-2"
                id="is_active"
              />
              <label for="is_active" class="text-sm font-medium text-gray-700">
                Competição Ativa
              </label>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg hover:bg-copa-blue-600"
              >
                {{ editingCompetition ? 'Atualizar' : 'Criar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

const toast = useToastStore()
const competitions = ref([])
const showModal = ref(false)
const editingCompetition = ref(null)

const form = ref({
  name: '',
  slug: '',
  year: new Date().getFullYear(),
  score_multiplier: 1.0,
  is_active: true
})

const loadCompetitions = async () => {
  try {
    const response = await api.get('/competitions')
    competitions.value = response.data
  } catch (error) {
    logger.error('Erro ao carregar competições:', error)
  }
}

const openModal = (competition = null) => {
  if (competition) {
    editingCompetition.value = competition
    form.value = {
      name: competition.name,
      slug: competition.slug,
      year: competition.year,
      score_multiplier: competition.score_multiplier,
      is_active: competition.is_active
    }
  } else {
    editingCompetition.value = null
    form.value = {
      name: '',
      slug: '',
      year: new Date().getFullYear(),
      score_multiplier: 1.0,
      is_active: true
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCompetition.value = null
}

const saveCompetition = async () => {
  try {
    if (editingCompetition.value) {
      await api.put(`/competitions/${editingCompetition.value.id}`, form.value)
    } else {
      await api.post('/competitions', form.value)
    }
    await loadCompetitions()
    closeModal()
  } catch (error) {
    logger.error('Erro ao salvar competição:', error)
    toast.error('Erro ao salvar competição: ' + (error.response?.data?.message || error.message))
  }
}

const deleteCompetition = async (id) => {
  const confirmed = await toast.confirm({
    title: 'Excluir competição',
    message: 'Tem certeza que deseja excluir esta competição?',
    confirmText: 'Excluir',
  })
  if (!confirmed) return

  try {
    await api.delete(`/competitions/${id}`)
    await loadCompetitions()
  } catch (error) {
    logger.error('Erro ao excluir competição:', error)
    toast.error('Erro ao excluir competição')
  }
}

onMounted(() => {
  loadCompetitions()
})
</script>
