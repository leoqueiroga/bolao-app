<template>
    <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-copa-blue-500 mb-8">Painel Administrativo</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="p-3 bg-blue-100 rounded-lg inline-block mb-4">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <p class="text-gray-600 text-sm mb-2">Total de Usuários</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.total_users }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="p-3 bg-green-100 rounded-lg inline-block mb-4">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="text-gray-600 text-sm mb-2">Total de Jogos</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.total_games }}</p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="p-3 bg-yellow-100 rounded-lg inline-block mb-4">
                    <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </div>
                <p class="text-gray-600 text-sm mb-2">Total de Palpites</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.total_bets }}</p>
            </div>
        </div>

        <!-- Acesso Rápido -->
        <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Acesso Rápido</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <router-link to="/admin/games" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-center">
                        <div class="p-3 bg-copa-blue-100 rounded-lg mr-4">
                            <svg class="w-8 h-8 text-copa-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg">Gerenciar Jogos</h3>
                            <p class="text-gray-600 text-sm">Criar, editar e gerenciar jogos</p>
                        </div>
                    </div>
                </router-link>
                <router-link to="/admin/competitions" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-lg mr-4">
                            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg">Gerenciar Competições</h3>
                            <p class="text-gray-600 text-sm">Configurar campeonatos</p>
                        </div>
                    </div>
                </router-link>
                <router-link to="/admin/users" class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div class="flex items-center">
                        <div class="p-3 bg-purple-100 rounded-lg mr-4">
                            <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-900 text-lg">Gerenciar Usuários</h3>
                            <p class="text-gray-600 text-sm">Controlar permissões</p>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>

        <!-- Próximos Jogos -->
        <div class="mb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-900">Próximos Jogos</h2>
                <router-link to="/admin/games" class="text-copa-blue-500 hover:text-copa-blue-600 font-semibold">Ver Todos →</router-link>
            </div>
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jogo</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Competição</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="game in upcomingGames" :key="game.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 font-semibold text-gray-900">{{ game.home_team }} vs {{ game.away_team }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(game.match_date) }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ game.competition?.name }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="upcomingGames.length === 0" class="text-center py-8 text-gray-500">Nenhum jogo agendado</div>
            </div>
        </div>

        <!-- Últimos Palpites -->
        <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Últimos Palpites</h2>
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuário</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jogo</th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                            <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="bet in recentBets" :key="bet.id" class="hover:bg-gray-50">
                            <td class="px-6 py-4 font-semibold text-gray-900">{{ bet.user?.name }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ bet.game?.home_team }} vs {{ bet.game?.away_team }}</td>
                            <td class="px-6 py-4 text-sm text-gray-700">{{ bet.bet_type?.name }}</td>
                            <td class="px-6 py-4 text-center">
                                <span :class="getBetStatusClass(bet.status)" class="px-2 py-1 rounded text-xs font-semibold">
                                    {{ getBetStatusText(bet.status) }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="recentBets.length === 0" class="text-center py-8 text-gray-500">Nenhum palpite recente</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import api from '@/services/api'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

const stats = ref({ total_users: 0, total_games: 0, total_bets: 0 })
const upcomingGames = ref([])
const recentBets = ref([])

const loadStats = async () => {
    try {
        const [gamesRes, betsRes] = await Promise.all([
            api.get('/games'),
            api.get('/bets').catch(() => ({ data: [] })),
        ])
        stats.value = {
            total_users: 0,
            total_games: gamesRes.data?.length || 0,
            total_bets: (betsRes.data.data || betsRes.data)?.length || 0,
        }
    } catch (error) {
        logger.error('Erro ao carregar estatísticas:', error)
    }
}

const loadUpcomingGames = async () => {
    try {
        const response = await api.get('/games/upcoming')
        upcomingGames.value = response.data.slice(0, 5)
    } catch (error) {
        logger.error('Erro ao carregar próximos jogos:', error)
    }
}

const loadRecentBets = async () => {
    try {
        const response = await api.get('/bets')
        recentBets.value = (response.data.data || response.data).slice(0, 10)
    } catch (error) {
        logger.error('Erro ao carregar palpites recentes:', error)
    }
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}, ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`
}

const getBetStatusText = (status) => ({ pending: 'Pendente', correct: 'Correto', incorrect: 'Incorreto', cancelled: 'Cancelado' }[status] || status)
const getBetStatusClass = (status) => ({ pending: 'bg-yellow-500 text-white', correct: 'bg-green-500 text-white', incorrect: 'bg-red-500 text-white', cancelled: 'bg-gray-500 text-white' }[status] || 'bg-gray-300 text-gray-700')

onMounted(() => {
    loadStats()
    loadUpcomingGames()
    loadRecentBets()
})
</script>
