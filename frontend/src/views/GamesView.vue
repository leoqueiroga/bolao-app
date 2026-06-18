<template>
    <div class="container mx-auto px-4 py-6">
        <div class="flex flex-wrap items-center justify-between mb-8">
            <h1 class="text-3xl font-bold text-copa-blue-500">Jogos da Copa</h1>
            <button @click="shareTodayGames"
                class="flex items-center space-x-2 px-4 py-2 bg-copa-blue-500 text-white rounded-lg hover:bg-copa-blue-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{{ shareButtonText }}</span>
            </button>
        </div>

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
                :class="['rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow', getBetStatusBorder(game)]">
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
                            <!-- Badge de status do palpite -->
                            <span :class="getBetStatusBadge(game).class"
                                class="px-3 py-1 rounded-full text-xs font-semibold">
                                {{ getBetStatusBadge(game).text }}
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
                            <p class="font-bold text-gray-800">{{ getTeamName(game.home_team) }}</p>
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
                            <p class="font-bold text-gray-800">{{ getTeamName(game.away_team) }}</p>
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
import { getFlagUrl, getTeamName } from '@/utils/countryFlags'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

const games = ref([])
const competitions = ref([])
const userBets = ref([])
const loading = ref(false)
const filters = ref({ status: 'scheduled', competition_id: '', sort: 'date_asc' })
const shareButtonText = ref('Jogos do Dia')

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

const loadUserBets = async () => {
    try {
        const response = await api.get('/bets')
        userBets.value = response.data.data || response.data || []
    } catch (error) {
        logger.error('Erro ao carregar palpites do usuário:', error)
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

/**
 * Retorna o status do palpite para um jogo:
 * - 'bet': já palpitou (verde)
 * - 'pending': ainda pode palpitar (amarelo)
 * - 'missed': perdeu o prazo (vermelho)
 */
const getBetStatus = (game) => {
    const hasBet = userBets.value.some(bet => bet.game_id === game.id)
    if (hasBet) return 'bet'

    // Jogo ainda aceita palpites
    const isUnlocked = game.bets_unlock_until && new Date(game.bets_unlock_until) > new Date()
    if ((game.status === 'scheduled' && !game.bets_locked) || isUnlocked) return 'pending'

    // Jogo travado/ao vivo/finalizado sem palpite
    return 'missed'
}

const getBetStatusBorder = (game) => {
    const status = getBetStatus(game)
    const map = {
        bet: 'border-l-4 border-l-green-500 bg-green-50/40',
        pending: 'border-l-4 border-l-yellow-400 bg-yellow-50/40',
        missed: 'border-l-4 border-l-red-400 bg-red-50/40',
    }
    return map[status] || ''
}

const getBetStatusBadge = (game) => {
    const status = getBetStatus(game)
    const map = {
        bet: { class: 'bg-green-100 text-green-800', text: '✓ Palpite feito' },
        pending: { class: 'bg-yellow-100 text-yellow-800', text: '⚠ Sem palpite' },
        missed: { class: 'bg-red-100 text-red-800', text: '✗ Prazo perdido' },
    }
    return map[status] || { class: '', text: '' }
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

const shareTodayGames = async () => {
    // Filtra jogos do dia de hoje
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const todayGames = games.value.filter(game => {
        const gameDate = new Date(game.match_date)
        const gameDateStr = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, '0')}-${String(gameDate.getDate()).padStart(2, '0')}`
        return gameDateStr === todayStr
    })

    if (todayGames.length === 0) {
        shareButtonText.value = 'Sem jogos hoje'
        setTimeout(() => { shareButtonText.value = 'Jogos do Dia' }, 2000)
        return
    }

    const dateFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
    let message = `⚽ Jogos do dia ${dateFormatted}\n\n`

    todayGames.forEach((game, index) => {
        const home = getTeamName(game.home_team)
        const away = getTeamName(game.away_team)
        const gameDate = new Date(game.match_date)
        const hours = String(gameDate.getHours()).padStart(2, '0')
        const minutes = String(gameDate.getMinutes()).padStart(2, '0')

        message += `🕐 ${hours}:${minutes} - ${home} × ${away}`
        if (game.status === 'finished') message += ` (${game.home_score} × ${game.away_score})`
        else if (game.status === 'in_progress') message += ` 🔴 ${game.home_score} × ${game.away_score}`
        if (game.competition?.name) message += ` [${game.competition.name}]`
        if (index < todayGames.length - 1) message += '\n'
    })

    message += `\n\n💰 Faça seus palpites!\n🔗 ${window.location.origin}/games`

    try {
        await navigator.clipboard.writeText(message)
        shareButtonText.value = '✓ Copiado!'
        setTimeout(() => { shareButtonText.value = 'Jogos do Dia' }, 2000)
    } catch {
        shareButtonText.value = 'Jogos do Dia'
    }
}

onMounted(() => {
    loadGames()
    loadCompetitions()
    loadUserBets()
})
</script>
