<template>
    <div class="container mx-auto px-4 py-6">
        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
            <p class="mt-4 text-gray-600">Carregando jogo...</p>
        </div>

        <div v-else-if="game">
            <!-- Breadcrumb + Compartilhar -->
            <div class="flex justify-between items-center mb-6">
                <nav>
                    <router-link to="/games" class="text-copa-blue-500 hover:text-copa-blue-600">
                        &larr; Voltar para Jogos
                    </router-link>
                </nav>
                <button @click="shareGame"
                    class="flex items-center space-x-2 px-4 py-2 bg-copa-blue-500 text-white rounded-lg hover:bg-copa-blue-600 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>{{ shareButtonText }}</span>
                </button>
            </div>

            <!-- Card do Jogo -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex flex-wrap items-center justify-between mb-4">
                    <div class="flex items-center space-x-3 mb-2 sm:mb-0">
                        <span :class="getStatusClass(game.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                            {{ getStatusText(game.status) }}
                        </span>
                        <span v-if="game.is_knockout" class="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-semibold">
                            MATA-MATA
                        </span>
                    </div>
                    <span class="text-sm text-gray-600 font-medium">{{ game.competition?.name }}</span>
                </div>

                <!-- Placar -->
                <div class="flex items-center justify-center mb-6">
                    <!-- Time da Casa -->
                    <div class="text-center flex-1 flex flex-col items-center">
                        <img v-if="game.home_logo_url" :src="game.home_logo_url" :alt="game.home_team"
                            class="w-20 h-20 object-contain mb-3" @error="$event.target.style.display='none'" />
                        <div v-else class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <span class="text-3xl font-bold text-gray-500">{{ game.home_team?.charAt(0) }}</span>
                        </div>
                        <div class="text-2xl font-bold text-copa-blue-500">{{ game.home_team }}</div>
                        <div v-if="game.status === 'finished' || game.status === 'in_progress'"
                            class="text-5xl font-bold text-gray-800 mt-2">
                            {{ game.home_score }}
                        </div>
                    </div>

                    <div class="px-6">
                        <div class="text-4xl font-bold text-gray-400">×</div>
                        <div v-if="game.status === 'in_progress'" class="text-xs text-red-500 font-semibold text-center mt-1">AO VIVO</div>
                    </div>

                    <!-- Time Visitante -->
                    <div class="text-center flex-1 flex flex-col items-center">
                        <img v-if="game.away_logo_url" :src="game.away_logo_url" :alt="game.away_team"
                            class="w-20 h-20 object-contain mb-3" @error="$event.target.style.display='none'" />
                        <div v-else class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <span class="text-3xl font-bold text-gray-500">{{ game.away_team?.charAt(0) }}</span>
                        </div>
                        <div class="text-2xl font-bold text-gray-700">{{ game.away_team }}</div>
                        <div v-if="game.status === 'finished' || game.status === 'in_progress'"
                            class="text-5xl font-bold text-gray-800 mt-2">
                            {{ game.away_score }}
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center text-gray-700">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{{ formatDate(game.match_date) }}</span>
                    </div>
                    <div v-if="game.stadium" class="flex items-center text-gray-700">
                        <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>{{ game.stadium }}</span>
                    </div>
                </div>

                <div v-if="game.score_multiplier > 1" class="mt-4 p-3 bg-copa-gold-100 border border-copa-gold-300 rounded-lg">
                    <p class="text-copa-gold-700 font-semibold text-center">
                        ⭐ Pontuação {{ game.score_multiplier }}x neste jogo!
                    </p>
                </div>
            </div>

            <!-- Formulário de Palpites (jogo aberto) -->
            <div v-if="canMakeBets" class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div v-if="isTemporarilyUnlocked"
                    class="mb-4 p-4 bg-orange-100 border border-orange-400 text-orange-800 rounded-lg flex items-center">
                    <span class="text-xl mr-2">⏳</span>
                    <div>
                        <p class="font-semibold">Palpites liberados temporariamente!</p>
                        <p class="text-sm">Você tem até {{ formatUnlockTime(game.bets_unlock_until) }} para fazer ou editar seus palpites.</p>
                    </div>
                </div>

                <h2 class="text-xl font-semibold text-gray-800 mb-4">Fazer Palpites</h2>

                <div v-if="successMessage" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {{ successMessage }}
                </div>
                <div v-if="errorMessage" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {{ errorMessage }}
                </div>

                <div class="space-y-6">
                    <div v-for="betType in availableBetTypes" :key="betType.id"
                        class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-gray-800">{{ betType.name }}</h3>
                            <span class="text-sm text-gray-600">{{ betType.default_points }} pontos base</span>
                        </div>
                        <p class="text-sm text-gray-600 mb-4">{{ betType.description }}</p>

                        <!-- Palpite já feito -->
                        <div v-if="getUserBetByType(betType.id)"
                            class="bg-copa-blue-50 border border-copa-blue-200 rounded-lg p-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm text-copa-blue-600 font-medium mb-1">Seu palpite:</p>
                                    <p class="text-lg font-semibold text-copa-blue-800">
                                        {{ formatBetPrediction(getUserBetByType(betType.id)) }}
                                    </p>
                                </div>
                                <button @click="deleteBet(getUserBetByType(betType.id).id)"
                                    class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors">
                                    Excluir
                                </button>
                            </div>
                        </div>

                        <!-- Placar Exato -->
                        <div v-else-if="betType.type === 'exact_score'" class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Gols {{ game.home_team }}</label>
                                <input type="number" min="0" v-model.number="bets.exact_score.home_score"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                                    placeholder="0" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Gols {{ game.away_team }}</label>
                                <input type="number" min="0" v-model.number="bets.exact_score.away_score"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                                    placeholder="0" />
                            </div>
                            <button @click="submitBet(betType.id, 'exact_score')" :disabled="!isValidExactScore"
                                class="col-span-2 px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                                Enviar Palpite
                            </button>
                        </div>

                        <!-- Resultado -->
                        <div v-else-if="betType.type === 'result'" class="space-y-3">
                            <div class="grid grid-cols-3 gap-3">
                                <button @click="bets.result.result = 'home_win'"
                                    :class="bets.result.result === 'home_win' ? 'bg-copa-blue-500 text-white' : 'bg-gray-100'"
                                    class="px-3 py-3 rounded-lg font-semibold hover:bg-copa-blue-100 transition-colors text-sm">
                                    {{ game.home_team }} vence
                                </button>
                                <button @click="bets.result.result = 'draw'"
                                    :class="bets.result.result === 'draw' ? 'bg-copa-blue-500 text-white' : 'bg-gray-100'"
                                    class="px-3 py-3 rounded-lg font-semibold hover:bg-copa-blue-100 transition-colors text-sm">
                                    Empate
                                </button>
                                <button @click="bets.result.result = 'away_win'"
                                    :class="bets.result.result === 'away_win' ? 'bg-copa-blue-500 text-white' : 'bg-gray-100'"
                                    class="px-3 py-3 rounded-lg font-semibold hover:bg-copa-blue-100 transition-colors text-sm">
                                    {{ game.away_team }} vence
                                </button>
                            </div>
                            <button @click="submitBet(betType.id, 'result')" :disabled="!bets.result.result"
                                class="w-full px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                                Enviar Palpite
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Palpites bloqueados / em progresso / finalizado -->
            <div v-else-if="game.bets_locked || game.status === 'in_progress' || game.status === 'finished'" class="mb-6">
                <div v-if="game.bets_locked && game.status === 'scheduled'"
                    class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                    <h2 class="text-xl font-semibold text-yellow-800 mb-2">Palpites Travados</h2>
                    <p class="text-yellow-700">Os palpites foram travados pois o jogo está prestes a começar.</p>
                </div>

                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4">Palpites dos Participantes</h2>

                    <div v-if="loadingAllBets" class="text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-copa-blue-500"></div>
                    </div>
                    <div v-else-if="allGameBets.length === 0" class="text-center py-8 text-gray-500">
                        Nenhum palpite foi feito para este jogo.
                    </div>
                    <div v-else class="space-y-6">
                        <div v-for="betType in availableBetTypes" :key="betType.id"
                            class="border border-gray-200 rounded-lg overflow-hidden">
                            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 class="font-semibold text-gray-800">{{ betType.name }}</h3>
                                <p class="text-sm text-gray-600">{{ getBetsByType(betType.id).length }} palpites</p>
                            </div>
                            <div v-if="getBetsByType(betType.id).length === 0" class="p-4 text-center text-gray-500 text-sm">
                                Nenhum palpite nesta categoria.
                            </div>
                            <div v-else class="divide-y divide-gray-100">
                                <div v-for="bet in getBetsByType(betType.id)" :key="bet.id"
                                    class="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div class="flex items-center space-x-3">
                                        <div v-if="bet.user?.avatar_url"
                                            class="w-10 h-10 rounded-full overflow-hidden border-2 border-copa-blue-500">
                                            <img :src="bet.user.avatar_url" :alt="bet.user.name" class="w-full h-full object-cover" />
                                        </div>
                                        <div v-else class="w-10 h-10 rounded-full bg-copa-blue-500 flex items-center justify-center">
                                            <span class="text-white font-semibold">{{ bet.user?.name?.charAt(0)?.toUpperCase() || '?' }}</span>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-800">{{ bet.user?.name || 'Usuário' }}</p>
                                            <p class="text-sm text-gray-600">{{ formatBetPrediction(bet) }}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span :class="getBetStatusClass(bet.status)"
                                            class="px-3 py-1 rounded-full text-xs font-semibold">
                                            {{ getBetStatusText(bet.status) }}
                                        </span>
                                        <span v-if="bet.points_earned" class="text-copa-blue-600 font-semibold">
                                            +{{ bet.points_earned }} pts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumo dos meus palpites -->
            <div v-if="canMakeBets && userBets.length > 0" class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Resumo dos Seus Palpites</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="bet in userBets" :key="bet.id"
                        class="bg-copa-blue-50 border border-copa-blue-200 rounded-lg p-4">
                        <h3 class="font-semibold text-copa-blue-800 mb-1">{{ bet.bet_type?.name }}</h3>
                        <p class="text-copa-blue-700">{{ formatBetPrediction(bet) }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Erro -->
        <div v-else class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p class="text-red-700">Jogo não encontrado.</p>
            <router-link to="/games" class="mt-4 inline-block text-copa-blue-500 hover:text-copa-blue-600">
                Voltar para Jogos
            </router-link>
        </div>
    </div>
</template>

<script setup>
import api from '@/services/api'
import { useToastStore } from '@/stores/toast'
import { logger } from '@/utils/logger'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const toast = useToastStore()

const loading = ref(true)
const game = ref(null)
const availableBetTypes = ref([])
const userBets = ref([])
const allGameBets = ref([])
const loadingAllBets = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const shareButtonText = ref('Compartilhar')

const bets = ref({
    exact_score: { home_score: null, away_score: null },
    result: { result: null },
})

const isTemporarilyUnlocked = computed(() => {
    const unlockUntil = game.value?.bets_unlock_until
    return unlockUntil && new Date(unlockUntil) > new Date()
})

const formatUnlockTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const canMakeBets = computed(() => {
    if (isTemporarilyUnlocked.value) return true
    return game.value?.status === 'scheduled' && !game.value?.bets_locked
})

const isValidExactScore = computed(() => {
    const { home_score, away_score } = bets.value.exact_score
    return home_score !== null && away_score !== null && home_score >= 0 && away_score >= 0
})

const loadGame = async () => {
    try {
        const response = await api.get(`/games/${route.params.id}`)
        game.value = response.data
    } catch (error) {
        logger.error('Erro ao carregar jogo:', error)
    }
}

const loadBetTypes = async () => {
    try {
        const response = await api.get('/bet-types')
        availableBetTypes.value = response.data.filter((bt) => bt.is_active)
    } catch (error) {
        logger.error('Erro ao carregar tipos de palpite:', error)
    }
}

const loadUserBets = async () => {
    try {
        const response = await api.get(`/bets/game/${route.params.id}`)
        userBets.value = response.data
    } catch (error) {
        logger.error('Erro ao carregar palpites:', error)
    }
}

const loadAllGameBets = async () => {
    loadingAllBets.value = true
    try {
        const response = await api.get(`/bets/game/${route.params.id}/all`)
        allGameBets.value = response.data
    } catch (error) {
        allGameBets.value = []
    } finally {
        loadingAllBets.value = false
    }
}

const getUserBetByType = (betTypeId) => userBets.value.find((b) => b.bet_type_id === betTypeId)
const getBetsByType = (betTypeId) => allGameBets.value.filter((b) => b.bet_type_id === betTypeId)

const submitBet = async (betTypeId, betKey) => {
    successMessage.value = ''
    errorMessage.value = ''
    try {
        await api.post('/bets', {
            game_id: game.value.id,
            bet_type_id: betTypeId,
            prediction: bets.value[betKey],
        })
        successMessage.value = 'Palpite enviado com sucesso!'
        if (betKey === 'exact_score') bets.value.exact_score = { home_score: null, away_score: null }
        else if (betKey === 'result') bets.value.result.result = null
        await loadUserBets()
        setTimeout(() => { successMessage.value = '' }, 3000)
    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Erro ao enviar palpite'
    }
}

const deleteBet = async (betId) => {
    const confirmed = await toast.confirm({
        title: 'Excluir palpite',
        message: 'Tem certeza que deseja excluir este palpite?',
        confirmText: 'Excluir',
    })
    if (!confirmed) return
    try {
        await api.delete(`/bets/${betId}`)
        successMessage.value = 'Palpite excluído com sucesso!'
        await loadUserBets()
        setTimeout(() => { successMessage.value = '' }, 3000)
    } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Erro ao excluir palpite'
    }
}

const formatBetPrediction = (bet) => {
    const { type } = bet.bet_type || {}
    const p = bet.prediction
    if (!p) return 'N/A'
    if (type === 'exact_score') return `${p.home_score} × ${p.away_score}`
    if (type === 'result') {
        const map = { home_win: `${game.value?.home_team} vence`, draw: 'Empate', away_win: `${game.value?.away_team} vence` }
        return map[p.result] || p.result
    }
    return JSON.stringify(p)
}

const shareGame = async () => {
    if (!game.value) return
    const g = game.value
    let message = `⚽ ${g.competition?.name || 'Copa'}\n${g.home_team} × ${g.away_team}\n📅 ${formatDate(g.match_date)}`
    if (g.status === 'finished') message += `\n📊 Placar: ${g.home_score} × ${g.away_score}`
    else if (g.status === 'in_progress') message += `\n🔴 AO VIVO: ${g.home_score} × ${g.away_score}`
    else message += `\n💰 Faça seu palpite!`
    message += `\n\n🔗 ${window.location.href}`
    try {
        await navigator.clipboard.writeText(message)
        shareButtonText.value = '✓ Copiado!'
        setTimeout(() => { shareButtonText.value = 'Compartilhar' }, 2000)
    } catch {
        shareButtonText.value = 'Compartilhar'
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
    const map = { scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-red-100 text-red-800 animate-pulse', finished: 'bg-gray-100 text-gray-800', postponed: 'bg-yellow-100 text-yellow-800', cancelled: 'bg-red-100 text-red-800' }
    return map[status] || 'bg-gray-100 text-gray-800'
}

const getBetStatusText = (status) => ({ pending: 'Pendente', correct: 'Correto', incorrect: 'Incorreto' }[status] || status)
const getBetStatusClass = (status) => ({ pending: 'bg-yellow-500 text-white', correct: 'bg-green-500 text-white', incorrect: 'bg-red-500 text-white' }[status] || 'bg-gray-300 text-gray-700')

onMounted(async () => {
    loading.value = true
    await Promise.all([loadGame(), loadBetTypes()])
    loading.value = false
    if (game.value) {
        await loadUserBets()
        if (game.value.bets_locked || game.value.status === 'in_progress' || game.value.status === 'finished') {
            loadAllGameBets()
        }
    }
})
</script>
