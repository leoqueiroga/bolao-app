<template>
    <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 class="text-2xl sm:text-3xl font-bold text-copa-blue-500">Gerenciar Jogos</h1>
            <div class="flex space-x-3">
                <button @click="syncExternalIds" :disabled="syncing"
                    class="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm sm:text-base disabled:opacity-50"
                    title="Sincronizar IDs externos (football-data.org)">
                    {{ syncing ? '⏳' : '🔗' }} Sync API
                </button>
                <button @click="loadGames"
                    class="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors text-sm sm:text-base">
                    🔄
                </button>
                <button @click="openModal()"
                    class="px-4 sm:px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 transition-colors text-sm sm:text-base">
                    + Novo Jogo
                </button>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select v-model="filters.status" @change="loadGames"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500">
                        <option value="">Todos</option>
                        <option value="scheduled">Agendados</option>
                        <option value="in_progress">Ao vivo</option>
                        <option value="finished">Finalizados</option>
                        <option value="cancelled">Cancelados</option>
                        <option value="postponed">Adiados</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Competição</label>
                    <select v-model="filters.competition_id" @change="loadGames"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500">
                        <option value="">Todas</option>
                        <option v-for="comp in competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
                    </select>
                </div>
            </div>
            <div v-if="errorMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p class="text-red-700 text-sm font-medium">{{ errorMessage }}</p>
            </div>
        </div>

        <!-- Lista de Jogos -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div v-if="loadingGames" class="p-12 text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
                <p class="mt-4 text-gray-600">Carregando jogos...</p>
            </div>

            <template v-else-if="games.length > 0">
                <!-- Mobile: Cards -->
                <div class="block md:hidden">
                    <div v-for="game in games" :key="game.id" class="border-b border-gray-200 p-4">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <div class="font-semibold text-gray-900">{{ game.home_team }} vs {{ game.away_team }}</div>
                                <div class="text-sm text-gray-500">{{ game.competition?.name }}</div>
                            </div>
                            <span :class="getStatusClass(game.status)"
                                class="px-2 py-1 rounded text-xs font-semibold ml-2 flex-shrink-0">
                                {{ getStatusText(game.status) }}
                            </span>
                        </div>
                        <div class="text-sm text-gray-600 mb-2">
                            📅 {{ formatDate(game.match_date) }}
                            <span v-if="game.home_score !== null"> · {{ game.home_score }} × {{ game.away_score }}</span>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-3">
                            <button @click="openModal(game)" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Editar</button>
                            <button v-if="game.bets_locked || game.status === 'in_progress'" @click="temporaryUnlock(game)"
                                :disabled="unlockingGameId === game.id"
                                class="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50">
                                {{ unlockingGameId === game.id ? 'Liberando...' : isTemporarilyUnlocked(game) ? `🔓 ${getRemainingMinutes(game)}min` : '🔓 10min' }}
                            </button>
                            <button v-if="game.status === 'finished'" @click="recalculatePoints(game)"
                                :disabled="recalculatingGameId === game.id"
                                class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm disabled:opacity-50">
                                {{ recalculatingGameId === game.id ? 'Calculando...' : 'Recalcular' }}
                            </button>
                            <button @click="deleteGame(game.id)" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Excluir</button>
                        </div>
                    </div>
                </div>

                <!-- Desktop: Tabela -->
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jogo</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Data</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Competição</th>
                                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Placar</th>
                                <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="game in games" :key="game.id" class="hover:bg-gray-50">
                                <td class="px-6 py-4 font-semibold text-gray-900">
                                    {{ game.home_team }} vs {{ game.away_team }}
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-700">{{ formatDate(game.match_date) }}</td>
                                <td class="px-6 py-4 text-sm text-gray-700">{{ game.competition?.name }}</td>
                                <td class="px-6 py-4 text-sm text-gray-700">
                                    <span v-if="game.home_score !== null">{{ game.home_score }} × {{ game.away_score }}</span>
                                    <span v-else class="text-gray-400">—</span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span :class="getStatusClass(game.status)" class="px-2 py-1 rounded text-xs font-semibold">
                                        {{ getStatusText(game.status) }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex justify-end gap-2 flex-wrap">
                                        <button @click="openModal(game)" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Editar</button>
                                        <button v-if="game.bets_locked || game.status === 'in_progress'" @click="temporaryUnlock(game)"
                                            :disabled="unlockingGameId === game.id"
                                            class="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50">
                                            {{ unlockingGameId === game.id ? 'Liberando...' : isTemporarilyUnlocked(game) ? `🔓 ${getRemainingMinutes(game)}min` : '🔓 10min' }}
                                        </button>
                                        <button v-if="game.status === 'finished'" @click="recalculatePoints(game)"
                                            :disabled="recalculatingGameId === game.id"
                                            class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm disabled:opacity-50">
                                            {{ recalculatingGameId === game.id ? 'Calculando...' : 'Recalcular' }}
                                        </button>
                                        <button @click="deleteGame(game.id)" class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Excluir</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>

            <div v-else class="p-12 text-center">
                <p class="text-xl font-semibold text-gray-800 mb-2">Nenhum jogo encontrado</p>
                <p class="text-gray-600">Adicione um novo jogo para começar.</p>
            </div>
        </div>

        <!-- Modal de Formulário -->
        <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="closeModal">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-6">
                        {{ editingGame ? 'Editar Jogo' : 'Novo Jogo' }}
                    </h2>

                    <form @submit.prevent="saveGame" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Time da Casa *</label>
                                <input v-model="form.home_team" type="text" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                                    placeholder="Ex: Brasil" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Time Visitante *</label>
                                <input v-model="form.away_team" type="text" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                                    placeholder="Ex: Argentina" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Logo Time da Casa (URL)</label>
                                <input v-model="form.home_logo_url" type="text"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                                    placeholder="https://..." />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Logo Time Visitante (URL)</label>
                                <input v-model="form.away_logo_url" type="text"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                                    placeholder="https://..." />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Competição *</label>
                                <select v-model="form.competition_id" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500">
                                    <option value="">Selecione</option>
                                    <option v-for="comp in competitions" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Data e Hora *</label>
                                <input v-model="form.match_date" type="datetime-local" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500" />
                                <p class="text-xs text-gray-500 mt-1">Horário local de Brasília (UTC-3)</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                <select v-model="form.status" required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500">
                                    <option value="scheduled">Agendado</option>
                                    <option value="in_progress">Ao vivo</option>
                                    <option value="finished">Finalizado</option>
                                    <option value="cancelled">Cancelado</option>
                                    <option value="postponed">Adiado</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Estádio</label>
                                <input v-model="form.stadium" type="text"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500"
                                    placeholder="Nome do estádio" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Gols Time da Casa</label>
                                <input v-model.number="form.home_score" type="number" min="0"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Gols Time Visitante</label>
                                <input v-model.number="form.away_score" type="number" min="0"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Multiplicador de Pontos</label>
                                <input v-model.number="form.score_multiplier" type="number" step="0.5" min="1"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500" />
                            </div>
                            <div class="flex items-center space-x-4">
                                <label class="flex items-center">
                                    <input v-model="form.is_knockout" type="checkbox" class="mr-2" />
                                    <span class="text-sm font-medium text-gray-700">Mata-mata</span>
                                </label>
                                <label class="flex items-center">
                                    <input v-model="form.bets_locked" type="checkbox" class="mr-2" />
                                    <span class="text-sm font-medium text-gray-700">Travar Palpites</span>
                                </label>
                            </div>
                        </div>

                        <div v-if="saveError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {{ saveError }}
                        </div>

                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" @click="closeModal" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" :disabled="saving"
                                class="px-6 py-2 bg-copa-blue-500 text-white rounded-lg hover:bg-copa-blue-600 disabled:opacity-50 flex items-center gap-2">
                                <svg v-if="saving" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {{ saving ? 'Salvando...' : editingGame ? 'Atualizar' : 'Criar' }}
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
const games = ref([])
const competitions = ref([])
const showModal = ref(false)
const editingGame = ref(null)
const loadingGames = ref(false)
const saving = ref(false)
const saveError = ref(null)
const errorMessage = ref(null)
const recalculatingGameId = ref(null)
const unlockingGameId = ref(null)
const syncing = ref(false)
const filters = ref({ status: '', competition_id: '' })

const emptyForm = () => ({
    home_team: '',
    home_logo_url: '',
    away_team: '',
    away_logo_url: '',
    competition_id: '',
    match_date: '',
    stadium: '',
    home_score: null,
    away_score: null,
    score_multiplier: 1,
    status: 'scheduled',
    is_knockout: false,
    bets_locked: false,
})

const form = ref(emptyForm())

const loadGames = async () => {
    loadingGames.value = true
    errorMessage.value = null
    try {
        const params = {}
        if (filters.value.status) params.status = filters.value.status
        if (filters.value.competition_id) params.competition_id = filters.value.competition_id
        const response = await api.get('/games', { params })
        games.value = response.data
    } catch (error) {
        logger.error('Erro ao carregar jogos:', error)
        errorMessage.value = 'Erro ao carregar jogos'
    } finally {
        loadingGames.value = false
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

const openModal = (game = null) => {
    saveError.value = null
    if (game) {
        editingGame.value = game
        const d = new Date(game.match_date)
        const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        form.value = {
            home_team: game.home_team || '',
            home_logo_url: game.home_logo_url || '',
            away_team: game.away_team || '',
            away_logo_url: game.away_logo_url || '',
            competition_id: game.competition_id || '',
            match_date: localDate,
            stadium: game.stadium || '',
            home_score: game.home_score,
            away_score: game.away_score,
            score_multiplier: game.score_multiplier || 1,
            status: game.status || 'scheduled',
            is_knockout: game.is_knockout || false,
            bets_locked: game.bets_locked || false,
        }
    } else {
        editingGame.value = null
        form.value = emptyForm()
    }
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
    editingGame.value = null
    saveError.value = null
}

const saveGame = async () => {
    saving.value = true
    saveError.value = null
    try {
        const payload = {
            ...form.value,
            match_date: new Date(form.value.match_date + ':00').toISOString(),
        }
        if (payload.home_logo_url === '') delete payload.home_logo_url
        if (payload.away_logo_url === '') delete payload.away_logo_url
        if (payload.stadium === '') delete payload.stadium
        if (payload.home_score === null) delete payload.home_score
        if (payload.away_score === null) delete payload.away_score

        if (editingGame.value) {
            await api.put(`/games/${editingGame.value.id}`, payload)
        } else {
            await api.post('/games', payload)
        }
        await loadGames()
        closeModal()
    } catch (error) {
        logger.error('Erro ao salvar jogo:', error)
        saveError.value = error.response?.data?.message || 'Erro ao salvar jogo'
    } finally {
        saving.value = false
    }
}

const deleteGame = async (id) => {
    const confirmed = await toast.confirm({
        title: 'Excluir jogo',
        message: 'Tem certeza que deseja excluir este jogo?',
        confirmText: 'Excluir',
    })
    if (!confirmed) return
    try {
        await api.delete(`/games/${id}`)
        await loadGames()
    } catch (error) {
        logger.error('Erro ao excluir jogo:', error)
        toast.error('Erro ao excluir jogo')
    }
}

const temporaryUnlock = async (game) => {
    unlockingGameId.value = game.id
    try {
        await api.post(`/games/${game.id}/temporary-unlock`)
        await loadGames()
    } catch (error) {
        logger.error('Erro ao liberar palpites:', error)
        toast.error('Erro ao liberar palpites')
    } finally {
        unlockingGameId.value = null
    }
}

const syncExternalIds = async () => {
    syncing.value = true
    try {
        const response = await api.post('/games/sync-external-ids')
        const { mapped, unmapped } = response.data
        toast.success?.(`Sincronização concluída: ${mapped} vinculados, ${unmapped} não encontrados`)
        await loadGames()
    } catch (error) {
        logger.error('Erro ao sincronizar IDs externos:', error)
        toast.error('Erro ao sincronizar com a API football-data.org')
    } finally {
        syncing.value = false
    }
}

const recalculatePoints = async (game) => {
    recalculatingGameId.value = game.id
    try {
        await api.post(`/games/${game.id}/recalculate-points`)
        await loadGames()
        toast.success?.('Pontos recalculados com sucesso!')
    } catch (error) {
        logger.error('Erro ao recalcular pontos:', error)
        toast.error('Erro ao recalcular pontos')
    } finally {
        recalculatingGameId.value = null
    }
}

const isTemporarilyUnlocked = (game) => {
    return game.bets_unlock_until && new Date(game.bets_unlock_until) > new Date()
}

const getRemainingMinutes = (game) => {
    if (!game.bets_unlock_until) return 0
    const remaining = new Date(game.bets_unlock_until) - new Date()
    return Math.max(0, Math.ceil(remaining / 60000))
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
    const map = { scheduled: 'bg-blue-100 text-blue-800', in_progress: 'bg-red-100 text-red-800', finished: 'bg-gray-100 text-gray-800', postponed: 'bg-yellow-100 text-yellow-800', cancelled: 'bg-red-100 text-red-800' }
    return map[status] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
    loadGames()
    loadCompetitions()
})
</script>
