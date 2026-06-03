<template>
    <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-copa-blue-500 mb-8">
            Meus Palpites
        </h1>

        <!-- Estatísticas -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-gray-600 text-sm mb-2">Total de Palpites</p>
                <p class="text-3xl font-bold text-gray-800">
                    {{ stats.total }}
                </p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-gray-600 text-sm mb-2">Corretos</p>
                <p class="text-3xl font-bold text-green-600">
                    {{ stats.correct }}
                </p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-gray-600 text-sm mb-2">Incorretos</p>
                <p class="text-3xl font-bold text-red-600">
                    {{ stats.incorrect }}
                </p>
            </div>
            <div class="bg-white rounded-lg shadow-md p-6">
                <p class="text-gray-600 text-sm mb-2">Taxa de Acerto</p>
                <p class="text-3xl font-bold text-copa-blue-500">
                    {{ stats.accuracy }}%
                </p>
            </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Filtros</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Status</label
                    >
                    <select
                        v-model="filters.status"
                        @change="loadBets"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="correct">Corretos</option>
                        <option value="incorrect">Incorretos</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Tipo de Palpite</label
                    >
                    <select
                        v-model="filters.bet_type_id"
                        @change="loadBets"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    >
                        <option value="">Todos</option>
                        <option
                            v-for="type in betTypes"
                            :key="type.id"
                            :value="type.id"
                        >
                            {{ type.name }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Ordenar por</label
                    >
                    <select
                        v-model="filters.sort"
                        @change="loadBets"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    >
                        <option value="date_desc">Mais recente</option>
                        <option value="date_asc">Mais antigo</option>
                        <option value="points_desc">Maior pontuação</option>
                        <option value="points_asc">Menor pontuação</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"
            ></div>
            <p class="mt-4 text-gray-600">Carregando palpites...</p>
        </div>

        <!-- Lista de Palpites -->
        <div v-else-if="bets.length > 0" class="space-y-4">
            <div
                v-for="bet in bets"
                :key="bet.id"
                class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
                <div class="p-6">
                    <!-- Cabeçalho -->
                    <div
                        class="flex flex-wrap items-center justify-between mb-4"
                    >
                        <div class="flex items-center space-x-3 mb-2 sm:mb-0">
                            <span
                                :class="getBetStatusClass(bet.status)"
                                class="px-3 py-1 rounded-full text-xs font-semibold"
                            >
                                {{ getBetStatusText(bet.status) }}
                            </span>
                            <span class="text-sm font-medium text-gray-700">
                                {{ bet.bet_type?.name }}
                            </span>
                        </div>
                        <div v-if="bet.points_earned" class="flex items-center">
                            <svg
                                class="w-5 h-5 mr-1 text-yellow-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                ></path>
                            </svg>
                            <span
                                class="text-xl font-bold text-copa-blue-500"
                                >{{ bet.points_earned }}</span
                            >
                        </div>
                    </div>

                    <!-- Informações do Jogo -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-lg font-semibold text-gray-800">
                                {{ bet.game?.home_team }} vs {{ bet.game?.away_team }}
                            </h3>
                            <span class="text-sm text-gray-600">{{
                                bet.game?.competition?.name
                            }}</span>
                        </div>
                        <div class="flex items-center text-gray-600 text-sm">
                            <svg
                                class="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                ></path>
                            </svg>
                            <span>{{ formatDate(bet.game?.match_date) }}</span>
                        </div>
                    </div>

                    <!-- Palpite -->
                    <div class="border-t pt-4 mb-4">
                        <p class="text-sm text-gray-600 mb-1">Seu Palpite:</p>
                        <p class="text-lg font-semibold text-gray-800">
                            {{ formatBetPrediction(bet) }}
                        </p>
                    </div>

                    <!-- Resultado (se jogo finalizado) -->
                    <div
                        v-if="bet.game?.status === 'finished'"
                        class="border-t pt-4 mb-4"
                    >
                        <p class="text-sm text-gray-600 mb-1">
                            Resultado do Jogo:
                        </p>
                        <p class="text-lg font-semibold text-gray-800">
                            {{ bet.game.home_score }} x
                            {{ bet.game.away_score }}
                        </p>
                    </div>

                    <!-- Ações -->
                    <div class="border-t pt-4 flex flex-wrap gap-3">
                        <router-link
                            :to="`/games/${bet.game_id}`"
                            class="px-4 py-2 bg-copa-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-copa-blue-600 transition-colors"
                        >
                            Ver Jogo
                        </router-link>

                        <button
                            v-if="canDeleteBet(bet)"
                            @click="deleteBet(bet.id)"
                            class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </div>

            <!-- Paginação -->
            <div
                v-if="pagination.last_page > 1"
                class="flex justify-center items-center space-x-2 mt-8"
            >
                <button
                    @click="changePage(pagination.current_page - 1)"
                    :disabled="pagination.current_page === 1"
                    class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Anterior
                </button>

                <span class="px-4 py-2 text-gray-700">
                    Página {{ pagination.current_page }} de
                    {{ pagination.last_page }}
                </span>

                <button
                    @click="changePage(pagination.current_page + 1)"
                    :disabled="pagination.current_page === pagination.last_page"
                    class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                    Próxima
                </button>
            </div>
        </div>

        <!-- Sem Palpites -->
        <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
                class="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">
                Nenhum palpite encontrado
            </h3>
            <p class="text-gray-600 mb-4">Você ainda não fez nenhum palpite.</p>
            <router-link
                to="/games"
                class="inline-block px-6 py-2 bg-copa-blue-500 text-white rounded-lg font-semibold hover:bg-copa-blue-600 transition-colors"
            >
                Ver Jogos Disponíveis
            </router-link>
        </div>
    </div>
</template>

<script setup>
import api from "@/services/api";
import { useToastStore } from "@/stores/toast";
import { logger } from "@/utils/logger";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const toast = useToastStore();

const bets = ref([]);
const betTypes = ref([]);
const loading = ref(false);
const filters = ref({
    status: "",
    bet_type_id: "",
    sort: "date_desc",
});

const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
});

const stats = computed(() => {
    const total = bets.value.length;
    const correct = bets.value.filter((b) => b.status === "correct").length;
    const incorrect = bets.value.filter((b) => b.status === "incorrect").length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, incorrect, accuracy };
});

const loadBets = async (page = 1) => {
    loading.value = true;
    try {
        const params = {
            page,
            ...filters.value,
        };

        const response = await api.get("/bets", { params });
        bets.value = response.data.data || response.data;

        if (response.data.current_page) {
            pagination.value = {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            };
        }
    } catch (error) {
        logger.error("Erro ao carregar palpites:", error);
    } finally {
        loading.value = false;
    }
};

const loadBetTypes = async () => {
    try {
        const response = await api.get("/bet-types");
        betTypes.value = response.data;
    } catch (error) {
        logger.error("Erro ao carregar tipos de palpite:", error);
    }
};

const changePage = (page) => {
    if (page >= 1 && page <= pagination.value.last_page) {
        loadBets(page);
    }
};

const deleteBet = async (betId) => {
    const confirmed = await toast.confirm({
        title: "Excluir palpite",
        message: "Tem certeza que deseja excluir este palpite?",
        confirmText: "Excluir",
    });
    if (!confirmed) return;

    try {
        await api.delete(`/bets/${betId}`);
        await loadBets(pagination.value.current_page);
    } catch (error) {
        logger.error("Erro ao excluir palpite:", error);
        toast.error("Erro ao excluir palpite. Tente novamente.");
    }
};

const canDeleteBet = (bet) => {
    // Desbloqueio temporário permite editar/deletar
    const isUnlocked = bet.game?.bets_unlock_until && new Date(bet.game.bets_unlock_until) > new Date();
    if (isUnlocked) return true;
    return bet.game?.status === "scheduled" && !bet.game?.bets_locked;
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

const getBetStatusText = (status) => {
    const statusMap = {
        pending: "Pendente",
        correct: "Correto",
        incorrect: "Incorreto",
        cancelled: "Cancelado",
    };
    return statusMap[status] || status;
};

const getBetStatusClass = (status) => {
    const classMap = {
        pending: "bg-yellow-500 text-white",
        correct: "bg-green-500 text-white",
        incorrect: "bg-red-500 text-white",
        cancelled: "bg-gray-500 text-white",
    };
    return classMap[status] || "bg-gray-300 text-gray-700";
};

const formatBetPrediction = (bet) => {
    const prediction = bet.prediction;

    if (!prediction) return "N/A";

    if (bet.bet_type?.type === "exact_score") {
        return `${prediction.home_score} × ${prediction.away_score}`;
    } else if (bet.bet_type?.type === "result") {
        const resultMap = { home_win: "Casa vence", draw: "Empate", away_win: "Visitante vence" };
        return resultMap[prediction.result] || prediction.result;
    }

    return JSON.stringify(prediction);
};

onMounted(() => {
    loadBets();
    loadBetTypes();
});
</script>
