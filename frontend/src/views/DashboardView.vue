<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-copa-blue-500">Dashboard</h1>
      <div v-if="dashboard.user" class="flex items-center space-x-4">
        <div class="text-right">
          <p class="text-lg font-semibold">{{ dashboard.user.name }}</p>
          <p class="text-sm text-gray-500">Posição {{ dashboard.stats?.ranking_position || '-' }}º</p>
        </div>
        <!-- Avatar com foto ou iniciais -->
        <div v-if="dashboard.user.avatar_url" class="w-14 h-14 rounded-full overflow-hidden border-4 border-copa-blue-500">
          <img :src="dashboard.user.avatar_url" :alt="dashboard.user.name" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-14 h-14 rounded-full bg-copa-blue-500 flex items-center justify-center border-4 border-copa-blue-300">
          <span class="text-white font-bold text-xl">{{ dashboard.user.name?.charAt(0)?.toUpperCase() || '?' }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card bg-gradient-to-br from-copa-blue-500 to-copa-blue-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Pontos Totais</h3>
        <p class="text-4xl font-bold">{{ dashboard.stats?.total_points || 0 }}</p>
      </div>

      <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Palpites Corretos</h3>
        <p class="text-4xl font-bold">{{ dashboard.stats?.correct_bets || 0 }}</p>
      </div>

      <div class="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Taxa de Acerto</h3>
        <p class="text-4xl font-bold">{{ dashboard.stats?.accuracy || 0 }}%</p>
      </div>

      <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Posição no Ranking</h3>
        <p class="text-4xl font-bold">{{ dashboard.stats?.ranking_position || '-' }}º</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Sequência Atual</h3>
        <p class="text-4xl font-bold">🔥 {{ dashboard.user?.current_streak || 0 }}</p>
      </div>

      <div class="card bg-gradient-to-br from-pink-500 to-pink-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Melhor Sequência</h3>
        <p class="text-4xl font-bold">⭐ {{ dashboard.user?.best_streak || 0 }}</p>
      </div>

      <div class="card bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
        <h3 class="text-lg font-semibold mb-2">Palpites Totais</h3>
        <p class="text-4xl font-bold">🎯 {{ dashboard.stats?.total_bets || 0 }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-copa-blue-500">Próximos Jogos</h2>
        <div v-if="dashboard.upcoming_games?.length" class="space-y-4">
          <RouterLink 
            v-for="game in dashboard.upcoming_games" 
            :key="game.id" 
            :to="`/games/${game.id}`"
            class="block border-l-4 border-copa-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <p class="font-semibold">{{ game.home_team }} vs {{ game.away_team }}</p>
            <p class="text-sm text-gray-600">{{ formatDate(game.match_date) }}</p>
            <p class="text-sm text-gray-600">{{ game.competition?.name }}</p>
          </RouterLink>
        </div>
        <p v-else class="text-gray-500">Nenhum jogo agendado</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-4 text-copa-blue-500">Últimos Palpites</h2>
        <div v-if="dashboard.recent_bets?.length" class="space-y-3">
          <div 
            v-for="bet in dashboard.recent_bets" 
            :key="bet.id" 
            class="flex justify-between items-center py-2 border-b"
          >
            <div>
              <p class="font-semibold">{{ bet.game?.home_team }} vs {{ bet.game?.away_team }}</p>
              <p class="text-sm text-gray-600">{{ bet.bet_type?.name }}</p>
            </div>
            <div class="text-right">
              <span 
                :class="[
                  'px-2 py-1 rounded text-sm font-medium',
                  bet.status === 'correct' ? 'bg-green-100 text-green-800' :
                  bet.status === 'incorrect' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ bet.status === 'correct' ? 'Acertou' : bet.status === 'incorrect' ? 'Errou' : 'Pendente' }}
              </span>
              <p v-if="bet.points_earned" class="text-sm font-semibold text-copa-blue-500 mt-1">
                +{{ bet.points_earned }} pts
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-500">Nenhum palpite realizado</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const dashboard = ref({})
const loading = ref(false)

const fetchDashboard = async () => {
  loading.value = true
  try {
    const response = await api.get('/dashboard')
    dashboard.value = response.data
  } catch (error) {
    console.error('Erro ao carregar dashboard', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${day}/${month}/${year}, ${hours}:${minutes}`
}

onMounted(() => {
  fetchDashboard()
})
</script>
