<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-copa-blue-500">Galeria de Campeões</h1>
      <button
        @click="openModal()"
        class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 transition-colors"
      >
        + Novo Campeão
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
    </div>

    <!-- Lista de Campeões -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="champion in champions"
        :key="champion.id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div class="aspect-video bg-gray-100 overflow-hidden">
          <img
            :src="champion.image_url"
            :alt="champion.title"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-lg font-bold text-gray-900">{{ champion.title }}</h3>
            <span
              :class="champion.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
              class="px-2 py-1 rounded text-xs font-semibold ml-2 whitespace-nowrap"
            >
              {{ champion.is_active ? 'Ativo' : 'Inativo' }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mb-4">Ordem: {{ champion.display_order }}</p>

          <div class="flex justify-end space-x-2 pt-3 border-t">
            <button
              @click="openModal(champion)"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Editar
            </button>
            <button
              @click="deleteChampion(champion.id)"
              class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sem Campeões -->
    <div v-if="!loading && champions.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Nenhum campeão cadastrado</h3>
      <p class="text-gray-600">Adicione fotos à galeria de campeões.</p>
    </div>

    <!-- Modal de Formulário -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
      <div class="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            {{ editingChampion ? 'Editar Campeão' : 'Novo Campeão' }}
          </h2>

          <form @submit.prevent="saveChampion" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
              <input
                v-model="form.title"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="Ex: Campeão Bolão Copa 2024"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Foto {{ editingChampion ? '(deixe vazio para manter atual)' : '*' }}
              </label>
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                @change="onFileSelected"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
              />
              <p class="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, WebP, GIF. Máximo 5MB.</p>
            </div>

            <!-- Preview -->
            <div v-if="imagePreview" class="mt-2">
              <p class="text-sm font-medium text-gray-700 mb-1">Preview:</p>
              <img
                :src="imagePreview"
                alt="Preview"
                class="w-full h-48 object-cover rounded-lg border"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ordem de Exibição</label>
              <input
                v-model.number="form.display_order"
                type="number"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                placeholder="0"
              />
              <p class="text-xs text-gray-500 mt-1">Números menores aparecem primeiro</p>
            </div>

            <div class="flex items-center">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="mr-2"
                id="is_active"
              />
              <label for="is_active" class="text-sm font-medium text-gray-700">
                Ativo (visível para usuários)
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
                :disabled="saving"
                class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg hover:bg-copa-blue-600 disabled:opacity-50"
              >
                {{ saving ? 'Salvando...' : (editingChampion ? 'Atualizar' : 'Criar') }}
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
const champions = ref([])
const showModal = ref(false)
const editingChampion = ref(null)
const loading = ref(true)
const saving = ref(false)
const selectedFile = ref(null)
const imagePreview = ref(null)
const fileInput = ref(null)

const form = ref({
  title: '',
  display_order: 0,
  is_active: true,
})

const loadChampions = async () => {
  loading.value = true
  try {
    const response = await api.get('/champions/all')
    champions.value = response.data
  } catch (error) {
    logger.error('Erro ao carregar galeria:', error)
    toast.error('Erro ao carregar galeria de campeões')
  } finally {
    loading.value = false
  }
}

const onFileSelected = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      event.target.value = ''
      return
    }
    selectedFile.value = file
    imagePreview.value = URL.createObjectURL(file)
  }
}

const openModal = (champion = null) => {
  selectedFile.value = null
  imagePreview.value = null

  if (champion) {
    editingChampion.value = champion
    form.value = {
      title: champion.title,
      display_order: champion.display_order,
      is_active: champion.is_active,
    }
    imagePreview.value = champion.image_url
  } else {
    editingChampion.value = null
    form.value = {
      title: '',
      display_order: 0,
      is_active: true,
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingChampion.value = null
  selectedFile.value = null
  imagePreview.value = null
}

const saveChampion = async () => {
  if (!editingChampion.value && !selectedFile.value) {
    toast.error('Selecione uma imagem')
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('title', form.value.title)
    formData.append('display_order', String(form.value.display_order))
    formData.append('is_active', String(form.value.is_active))

    if (selectedFile.value) {
      formData.append('image', selectedFile.value)
    }

    if (editingChampion.value) {
      await api.put(`/champions/${editingChampion.value.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Campeão atualizado com sucesso')
    } else {
      await api.post('/champions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Campeão adicionado com sucesso')
    }

    await loadChampions()
    closeModal()
  } catch (error) {
    logger.error('Erro ao salvar campeão:', error)
    toast.error('Erro ao salvar: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const deleteChampion = async (id) => {
  const confirmed = await toast.confirm({
    title: 'Excluir campeão',
    message: 'Tem certeza que deseja excluir este campeão da galeria?',
    confirmText: 'Excluir',
  })
  if (!confirmed) return

  try {
    await api.delete(`/champions/${id}`)
    toast.success('Campeão removido com sucesso')
    await loadChampions()
  } catch (error) {
    logger.error('Erro ao excluir campeão:', error)
    toast.error('Erro ao excluir campeão')
  }
}

onMounted(() => {
  loadChampions()
})
</script>
