<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold text-copa-blue-500 mb-8 text-center">Galeria de Campeões</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
    </div>

    <!-- Galeria -->
    <div v-else-if="champions.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="champion in champions"
        :key="champion.id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
        @click="openLightbox(champion)"
      >
        <div class="aspect-video bg-gray-100 overflow-hidden">
          <img
            :src="champion.image_url"
            :alt="champion.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div class="p-4 text-center">
          <h3 class="text-lg font-bold text-gray-900">{{ champion.title }}</h3>
        </div>
      </div>
    </div>

    <!-- Sem Campeões -->
    <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-xl font-semibold text-gray-800 mb-2">Nenhum campeão cadastrado ainda</h3>
      <p class="text-gray-600">A galeria de campeões será preenchida em breve.</p>
    </div>

    <!-- Lightbox -->
    <div
      v-if="lightboxChampion"
      class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      @click.self="closeLightbox"
    >
      <button
        @click="closeLightbox"
        class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
        aria-label="Fechar"
      >
        &times;
      </button>
      <div class="max-w-4xl w-full">
        <img
          :src="lightboxChampion.image_url"
          :alt="lightboxChampion.title"
          class="w-full max-h-[80vh] object-contain rounded-lg"
        />
        <p class="text-white text-center text-xl font-bold mt-4">{{ lightboxChampion.title }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

const champions = ref([])
const loading = ref(true)
const lightboxChampion = ref(null)

const loadChampions = async () => {
  loading.value = true
  try {
    const response = await api.get('/champions')
    champions.value = response.data
  } catch (error) {
    logger.error('Erro ao carregar galeria de campeões:', error)
  } finally {
    loading.value = false
  }
}

const openLightbox = (champion) => {
  lightboxChampion.value = champion
}

const closeLightbox = () => {
  lightboxChampion.value = null
}

onMounted(() => {
  loadChampions()
})
</script>
