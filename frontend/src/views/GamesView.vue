<template>
    <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-copa-blue-500 mb-8">Jogos da Copa</h1>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Filtros</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select v-model="filters.status" @change="loadGames"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent">
                        <option value="">Todos</option>
                        <option value="scheduled" selected>Agendados</option>
                        <option value="in_progress">Ao vivo</option>
                        <option value="finished">Finalizados</option>
                        <option value="postponed">Adiados</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Competição</label>
                    <select v-model="filters.competition_id" @change="loadGames"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent">
                        <option value="">Todas</option>
                        <option v-for="comp in competitions" :key="comp.id" :value="comp.id">
                            {{ comp.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                    <select v-model="filters.sort" @change="loadGames"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent">
                        <option value="date_asc">Data (mais próximo)</option>
                        <option value="date_desc">Data (mais distante)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
            <p class="mt-4 text-gray-600">Carregando jogos...</p>
        </div>

        <!-- Lista de Jogos -->
        <div v-else-if="games.length > 0" class="space-y-4">
            <div v-for="game in games" :key="game.id"
                class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="p-6">
                    <div class="flex flex-wrap items-center justify-between mb-4">
                        <div class="flex items-center space-x-3 mb-2 sm:mb-0">
                            <span :class="getStatusClass(game.status)"
                                class="px-3 py-1 rounded-full text-xs font-semibold">
                                {{ getStatusText(game.status) }}
                            </span>
                            <span v-if="game.is_knockout"
                                class="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                                MATA-MATA
                            </span>
                        </div>
                        <span class="text-sm text-gray-600">{{ game.competition?.name }}</span>
                    </div>

                    <!-- Times e Placar -->
                    <div class="flex items-center justify-center my-4">
                        <div class="flex-1 text-center">
                            <img v-if="getFlagUrl(game.home_team)"
                                :src="getFlagUrl(game.home_team)"
                                :alt="game.home_team"
                                class="w-12 h-9 mx-auto mb-2 object-cover rounded shadow-sm" />
                            <div v-else class="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                                <span class="text-lg font-bold text-gray-500">{{ game.home_team?.charAt(0) }}</span>
                            </div>
                            <p class="font-bold text-gray-800">{{ game.home_team }}</p>
                        </div>

                        <div class="px-4 text-center">
                            <div v-if="game.status === 'finished' || game.status === 'in_progress'"
                                class="text-3xl font-bold text-gray-800">
                                {{ game.home_score }} × {{ game.away_score }}
                            </div>
                            <div v-else class="text-xl font-bold text-gray-400">VS</div>
                            <p class="text-xs text-gray-500 mt-1">{{ formatDate(game.match_date) }}</p>
                        </div>

                        <div class="flex-1 text-center">
                            <img v-if="getFlagUrl(game.away_team)"
                                :src="getFlagUrl(game.away_team)"
                                :alt="game.away_team"
                                class="w-12 h-9 mx-auto mb-2 object-cover rounded shadow-sm" />
                            <div v-else class="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                                <span class="text-lg font-bold text-gray-500">{{ game.away_team?.charAt(0) }}</span>
                            </div>
                            <p class="font-bold text-gray-800">{{ game.away_team }}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mt-4">
                        <span v-if="game.stadium" class="text-sm text-gray-500">🏟️ {{ game.stadium }}</span>
                        <router-link :to="`/games/${game.id}`"
                            class="px-4 py-2 bg-copa-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-copa-blue-600 transition-colors">
                            Ver Detalhes
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sem Jogos -->
        <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
            <p class="text-xl font-semibold text-gray-800 mb-2">Nenhum jogo encontrado</p>
            <p class="text-gray-600">Tente mudar os filtros.</p>
        </div>
    </div>
</template>

<script setup>
import api from '@/services/api'
import { getFlagUrl } from '@/utils/countryFlags'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

const games = ref([])
const competitions = ref([])
const loading = ref(false)
const filters = ref({ status: 'scheduled', competition_id: '', sort: 'date_asc' })

const loadGames = async () => {
    loading.value = true
    try {
        const params = {}
        if (filters.value.status) params.status = filters.value.status
        if (filters.value.competition_id) params.competition_id = filters.value.competition_id
        const response = await api.get('/games', { params })
        let data = response.data || []
        if (filters.value.sort === 'date_desc') data = [...data].reverse()
        games.value = data
    } catch (error) {
        logger.error('Erro ao carregar jogos:', error)
    } finally {
        loading.value = false
    }
}

const loadCompetitions = async () => {
    try {
        const response = await api.get('/competitions')
        competitions.value = response.data
    } catch (error) {
        logger.error('Erro ao carregar competições:', error)
    }
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year}, ${hours}:${minutes}`
}

const getStatusText = (status) => {
    const map = { scheduled: 'Agendado', in_progress: 'Ao Vivo', finished: 'Finalizado', postponed: 'Adiado', cancelled: 'Cancelado' }
    return map[status] || status
}

const getStatusClass = (status) => {
    const map = {
        scheduled: 'bg-blue-100 text-blue-800',
        in_progress: 'bg-red-100 text-red-800',
        finished: 'bg-gray-100 text-gray-800',
        postponed: 'bg-yellow-100 text-yellow-800',
        cancelled: 'bg-red-100 text-red-800',
    }
    return map[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
    loadGames()
    loadCompetitions()
})
</script>
