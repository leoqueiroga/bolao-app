<template>
  <div class="container mx-auto px-4 py-6">
    <h1 class="text-3xl font-bold text-copa-blue-500 mb-8">Meu Perfil</h1>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
      <p class="mt-4 text-gray-600">Carregando perfil...</p>
    </div>

    <!-- Erro ao carregar -->
    <div v-else-if="!user" class="text-center py-12">
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
        <p class="text-yellow-800 mb-4">⚠️ Não foi possível carregar as informações do perfil.</p>
        <button @click="retryLoad" class="btn-primary">
          Tentar novamente
        </button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Card de Perfil -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="text-center mb-6">
            <!-- Avatar com foto ou iniciais -->
            <div v-if="user?.avatar_url && !avatarError" class="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-copa-blue-500">
              <img :src="user.avatar_url" :alt="user.name" class="w-full h-full object-cover" @error="handleAvatarError" />
            </div>
            <div v-else class="w-24 h-24 bg-copa-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold">
              {{ userInitials }}
            </div>
            
            <h2 class="mt-4 text-xl font-semibold text-gray-800">{{ user?.name }}</h2>
            <p class="text-gray-600">{{ user?.email }}</p>
            <span class="inline-block mt-2 px-3 py-1 bg-copa-blue-100 text-copa-blue-700 rounded-full text-sm">
              {{ userLevel }}
            </span>
          </div>

          <div class="border-t pt-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Total de Pontos</span>
              <span class="font-semibold text-copa-blue-500">{{ user?.total_points || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">XP</span>
              <span class="font-semibold text-blue-500">{{ user?.experience_points || user?.xp || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Level</span>
              <span class="font-semibold text-purple-500">{{ user?.level || 1 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Membro desde</span>
              <span class="font-semibold text-gray-700">{{ formatDate(user?.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Estatísticas e Configurações -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Estatísticas -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Estatísticas</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-copa-blue-500">{{ stats.totalBets }}</div>
              <div class="text-sm text-gray-600">Total de Palpites</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-green-500">{{ stats.correctBets }}</div>
              <div class="text-sm text-gray-600">Acertos</div>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
              <div class="text-2xl font-bold text-blue-500">{{ stats.accuracy }}%</div>
              <div class="text-sm text-gray-600">Taxa de Acerto</div>
            </div>

          </div>
        </div>

        <!-- Editar Perfil -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Editar Perfil</h3>

          <div v-if="successMessage" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {{ successMessage }}
          </div>
          <div v-if="errorMessage" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {{ errorMessage }}
          </div>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p class="mt-1 text-xs text-gray-500">O e-mail não pode ser alterado</p>
            </div>
            <button
              type="submit"
              :disabled="updating"
              class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {{ updating ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </form>
        </div>

        <!-- Informações adicionais -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Sobre sua conta</h3>
          <div class="space-y-3 text-sm text-gray-600">
            <p>✓ Autenticado via Google</p>
            <p>✓ Suas estatísticas são atualizadas automaticamente</p>
            <p>✓ Suas estatísticas são atualizadas automaticamente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { logger } from '@/utils/logger'
import { computed, onMounted, ref } from 'vue'

const authStore = useAuthStore()

const loading = ref(true)
const updating = ref(false)
const user = ref(null)
const avatarError = ref(false)
const stats = ref({
  totalBets: 0,
  correctBets: 0,
  accuracy: 0,
})

const form = ref({
  name: '',
  email: ''
})

const successMessage = ref('')
const errorMessage = ref('')

const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const userLevel = computed(() => {
  // Usar o level da tabela profiles se existir
  if (user.value?.level) {
    const levelNames = {
      1: 'Novato',
      2: 'Iniciante', 
      3: 'Experiente',
      4: 'Mestre',
      5: 'Lendário'
    }
    return levelNames[user.value.level] || `Nível ${user.value.level}`
  }
  
  // Fallback para cálculo baseado em XP
  const xp = user.value?.experience_points || user.value?.xp || 0
  if (xp >= 10000) return 'Lendário'
  if (xp >= 5000) return 'Mestre'
  if (xp >= 2000) return 'Experiente'
  if (xp >= 500) return 'Iniciante'
  return 'Novato'
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const loadProfile = async () => {
  try {
    // Tentar carregar do backend
    const response = await api.get('/auth/profile')
    user.value = response.data
    form.value.name = user.value.name
    form.value.email = user.value.email
  } catch (error) {
    logger.error('Erro ao carregar perfil do backend:', error)
    
    // Fallback: usar dados do authStore
    if (authStore.user) {
      user.value = authStore.user
      form.value.name = authStore.user.name || ''
      form.value.email = authStore.user.email || ''
    }
  }
}

const loadStats = async () => {
  try {
    const betsResponse = await api.get('/bets')
    const bets = betsResponse.data
    const totalBets = bets.length
    const correctBets = bets.filter(b => b.status === 'correct').length
    const accuracy = totalBets > 0 ? Math.round((correctBets / totalBets) * 100) : 0
    stats.value = { totalBets, correctBets, accuracy }
  } catch (error) {
    logger.error('Erro ao carregar estatísticas:', error)
    stats.value = { totalBets: 0, correctBets: 0, accuracy: 0 }
  }
}

const updateProfile = async () => {
  successMessage.value = ''
  errorMessage.value = ''
  updating.value = true

  try {
    await api.put('/auth/profile', { name: form.value.name })
    successMessage.value = 'Perfil atualizado com sucesso!'
    await loadProfile()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Erro ao atualizar perfil'
  } finally {
    updating.value = false
  }
}

const handleAvatarError = () => {
  avatarError.value = true
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadProfile(), loadStats()])
  loading.value = false
})

const retryLoad = async () => {
  loading.value = true
  avatarError.value = false
  await Promise.all([loadProfile(), loadStats()])
  loading.value = false
}
</script>
