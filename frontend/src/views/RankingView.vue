<template>
    <div class="container mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-copa-blue-500 mb-8">
            Ranking Geral
        </h1>

        <!-- Filtros -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Ano</label
                    >
                    <select
                        v-model="selectedYear"
                        @change="loadRanking"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    >
                        <option :value="currentYear">
                            {{ currentYear }} (Atual)
                        </option>
                        <option
                            v-for="year in availableYears"
                            :key="year"
                            :value="year"
                        >
                            {{ year }}
                        </option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Competição</label
                    >
                    <select
                        v-model="selectedCompetition"
                        @change="loadRanking"
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    >
                        <option value="">Todas</option>
                        <option
                            v-for="comp in competitions"
                            :key="comp.id"
                            :value="comp.id"
                        >
                            {{ comp.name }}
                        </option>
                    </select>
                </div>

                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                        >Buscar Jogador</label
                    >
                    <input
                        type="text"
                        v-model="searchQuery"
                        @input="filterRanking"
                        placeholder="Digite o nome do jogador..."
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-copa-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="text-center py-12">
            <div
                class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"
            ></div>
            <p class="mt-4 text-gray-600">Carregando ranking...</p>
        </div>

        <!-- Ranking -->
        <div
            v-else-if="filteredRanking.length > 0"
            class="bg-white rounded-lg shadow-md overflow-hidden"
        >
            <!-- Top 3 Pódio -->
            <div
                v-if="filteredRanking.length >= 1"
                class="bg-gradient-to-r from-copa-blue-500 to-copa-blue-600 p-8 mb-6"
            >
                <h2 class="text-2xl font-bold text-white text-center mb-6">
                    Pódio
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- 2º Lugar -->
                    <div
                        v-if="filteredRanking.length >= 2"
                        class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center order-2 md:order-1"
                    >
                        <div class="text-6xl mb-2">🥈</div>
                        <!-- Avatar 2º lugar -->
                        <div class="flex justify-center mb-3">
                            <div
                                v-if="filteredRanking[1].avatar_url"
                                class="w-16 h-16 rounded-full overflow-hidden border-4 border-white"
                            >
                                <img
                                    :src="filteredRanking[1].avatar_url"
                                    :alt="filteredRanking[1].name"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div
                                v-else
                                class="w-16 h-16 rounded-full bg-white flex items-center justify-center"
                            >
                                <span
                                    class="text-gray-600 font-bold text-2xl"
                                    >{{
                                        filteredRanking[1].name
                                            .charAt(0)
                                            .toUpperCase()
                                    }}</span
                                >
                            </div>
                        </div>
                        <div class="text-white">
                            <p class="text-lg font-bold mb-1">
                                {{ filteredRanking[1].name }}
                            </p>
                            <p class="text-3xl font-bold">
                                {{ filteredRanking[1].total_points }}
                            </p>
                            <p class="text-sm opacity-90">pontos</p>
                        </div>
                    </div>

                    <!-- 1º Lugar -->
                    <div
                        class="bg-yellow-400 rounded-lg p-6 text-center transform md:scale-110 order-1 md:order-2"
                    >
                        <div class="text-7xl mb-2">🥇</div>
                        <!-- Avatar 1º lugar -->
                        <div class="flex justify-center mb-3">
                            <div
                                v-if="filteredRanking[0].avatar_url"
                                class="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-600"
                            >
                                <img
                                    :src="filteredRanking[0].avatar_url"
                                    :alt="filteredRanking[0].name"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div
                                v-else
                                class="w-20 h-20 rounded-full bg-white flex items-center justify-center"
                            >
                                <span
                                    class="text-yellow-600 font-bold text-3xl"
                                    >{{
                                        filteredRanking[0].name
                                            .charAt(0)
                                            .toUpperCase()
                                    }}</span
                                >
                            </div>
                        </div>
                        <div class="text-gray-900">
                            <p class="text-xl font-bold mb-1">
                                {{ filteredRanking[0].name }}
                            </p>
                            <p class="text-4xl font-bold">
                                {{ filteredRanking[0].total_points }}
                            </p>
                            <p class="text-sm">pontos</p>
                        </div>
                    </div>

                    <!-- 3º Lugar -->
                    <div
                        v-if="filteredRanking.length >= 3"
                        class="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center order-3"
                    >
                        <div class="text-6xl mb-2">🥉</div>
                        <!-- Avatar 3º lugar -->
                        <div class="flex justify-center mb-3">
                            <div
                                v-if="filteredRanking[2].avatar_url"
                                class="w-16 h-16 rounded-full overflow-hidden border-4 border-white"
                            >
                                <img
                                    :src="filteredRanking[2].avatar_url"
                                    :alt="filteredRanking[2].name"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div
                                v-else
                                class="w-16 h-16 rounded-full bg-white flex items-center justify-center"
                            >
                                <span
                                    class="text-gray-600 font-bold text-2xl"
                                    >{{
                                        filteredRanking[2].name
                                            .charAt(0)
                                            .toUpperCase()
                                    }}</span
                                >
                            </div>
                        </div>
                        <div class="text-white">
                            <p class="text-lg font-bold mb-1">
                                {{ filteredRanking[2].name }}
                            </p>
                            <p class="text-3xl font-bold">
                                {{ filteredRanking[2].total_points }}
                            </p>
                            <p class="text-sm opacity-90">pontos</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabela de Ranking -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th
                                class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Posição
                            </th>
                            <th
                                class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Jogador
                            </th>
                            <th
                                class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Pontos
                            </th>
                            <th
                                class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Palpites
                            </th>
                            <th
                                class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Acertos
                            </th>
                            <th
                                class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Precisão
                            </th>
                            <th
                                class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                            >
                                Nível
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <tr
                            v-for="(entry, index) in paginatedRanking"
                            :key="entry.user_id"
                            :class="{
                                'bg-green-50': entry.user_id === currentUserId,
                            }"
                            class="hover:bg-gray-50 transition-colors cursor-pointer"
                            @click="openUserDetails(entry)"
                        >
                            <!-- Posição -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <span
                                        v-if="
                                            index +
                                                (currentPage - 1) *
                                                    itemsPerPage <
                                            3
                                        "
                                        class="text-2xl mr-2"
                                    >
                                        {{
                                            index +
                                                (currentPage - 1) *
                                                    itemsPerPage ===
                                            0
                                                ? "🥇"
                                                : index +
                                                        (currentPage - 1) *
                                                            itemsPerPage ===
                                                    1
                                                  ? "🥈"
                                                  : "🥉"
                                        }}
                                    </span>
                                    <span
                                        class="text-lg font-semibold text-gray-900"
                                    >
                                        {{
                                            index +
                                            1 +
                                            (currentPage - 1) * itemsPerPage
                                        }}º
                                    </span>
                                </div>
                            </td>

                            <!-- Jogador -->
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <!-- Avatar com foto ou iniciais -->
                                    <div
                                        v-if="entry.avatar_url"
                                        class="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border-2 border-copa-blue-500"
                                    >
                                        <img
                                            :src="entry.avatar_url"
                                            :alt="entry.name"
                                            class="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div
                                        v-else
                                        class="flex-shrink-0 h-10 w-10 bg-copa-blue-500 rounded-full flex items-center justify-center"
                                    >
                                        <span
                                            class="text-white font-semibold text-lg"
                                        >
                                            {{
                                                entry.name
                                                    .charAt(0)
                                                    .toUpperCase()
                                            }}
                                        </span>
                                    </div>
                                    <div class="ml-4">
                                        <div
                                            class="text-sm font-medium text-gray-900"
                                        >
                                            {{ entry.name }}
                                            <span
                                                v-if="
                                                    entry.user_id ===
                                                    currentUserId
                                                "
                                                class="ml-2 text-xs text-copa-blue-500 font-semibold"
                                                >(Você)</span
                                            >
                                        </div>
                                        <div
                                            v-if="entry.current_streak > 0"
                                            class="text-xs text-gray-500"
                                        >
                                            🔥
                                            {{ entry.current_streak }} acertos
                                            seguidos
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <!-- Pontos -->
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <div
                                    class="text-lg font-bold text-copa-blue-500"
                                >
                                    {{ entry.total_points }}
                                </div>
                            </td>

                            <!-- Palpites -->
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <div class="text-sm text-gray-900">
                                    {{ entry.total_bets }}
                                </div>
                            </td>

                            <!-- Acertos -->
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <div
                                    class="text-sm text-green-600 font-semibold"
                                >
                                    {{ entry.correct_bets }}
                                </div>
                            </td>

                            <!-- Precisão -->
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <div
                                    class="text-sm font-semibold"
                                    :class="{
                                        'text-green-600': entry.accuracy >= 70,
                                        'text-yellow-600':
                                            entry.accuracy >= 50 &&
                                            entry.accuracy < 70,
                                        'text-red-600': entry.accuracy < 50,
                                    }"
                                >
                                    {{ entry.accuracy }}%
                                </div>
                            </td>

                            <!-- Nível -->
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                    class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-copa-blue-100 text-copa-blue-800"
                                >
                                    Nível {{ entry.level }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Paginação -->
            <div
                v-if="totalPages > 1"
                class="bg-gray-50 px-6 py-4 border-t border-gray-200"
            >
                <div class="flex justify-center items-center space-x-2">
                    <button
                        @click="currentPage--"
                        :disabled="currentPage === 1"
                        class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        Anterior
                    </button>

                    <span class="px-4 py-2 text-gray-700">
                        Página {{ currentPage }} de {{ totalPages }}
                    </span>

                    <button
                        @click="currentPage++"
                        :disabled="currentPage === totalPages"
                        class="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>

        <!-- Sem Dados -->
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                ></path>
            </svg>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">
                Nenhum ranking disponível
            </h3>
            <p class="text-gray-600">
                Ainda não há jogadores no ranking para o ano selecionado.
            </p>
        </div>

        <!-- Modal de Detalhes do Jogador -->
        <div
            v-if="showUserModal"
            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            @click.self="closeUserModal"
        >
            <div
                class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center">
                            <div
                                v-if="selectedUser?.avatar_url"
                                class="w-14 h-14 rounded-full overflow-hidden border-2 border-copa-blue-500 mr-4"
                            >
                                <img
                                    :src="selectedUser.avatar_url"
                                    :alt="selectedUser.name"
                                    class="w-full h-full object-cover"
                                />
                            </div>
                            <div
                                v-else
                                class="w-14 h-14 rounded-full bg-copa-blue-500 flex items-center justify-center mr-4"
                            >
                                <span class="text-white font-bold text-2xl">{{
                                    selectedUser?.name?.charAt(0).toUpperCase()
                                }}</span>
                            </div>
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">
                                    {{ selectedUser?.name }}
                                </h2>
                                <p class="text-gray-600">
                                    {{ selectedUser?.position }}º lugar no
                                    ranking
                                </p>
                            </div>
                        </div>
                        <button
                            @click="closeUserModal"
                            class="text-gray-400 hover:text-gray-600"
                        >
                            <svg
                                class="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12"
                                ></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Loading -->
                    <div v-if="loadingUserDetails" class="text-center py-12">
                        <div
                            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-copa-blue-500"
                        ></div>
                        <p class="mt-2 text-gray-600">Carregando detalhes...</p>
                    </div>

                    <!-- Detalhes -->
                    <div v-else-if="userDetails">
                        <!-- Resumo -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div
                                class="bg-copa-blue-50 rounded-lg p-4 text-center"
                            >
                                <p
                                    class="text-3xl font-bold text-copa-blue-600"
                                >
                                    {{ userDetails.summary.total_points }}
                                </p>
                                <p class="text-sm text-gray-600">Pontos</p>
                            </div>
                            <div class="bg-blue-50 rounded-lg p-4 text-center">
                                <p class="text-3xl font-bold text-blue-600">
                                    {{ userDetails.summary.total_bets }}
                                </p>
                                <p class="text-sm text-gray-600">Palpites</p>
                            </div>
                            <div class="bg-green-50 rounded-lg p-4 text-center">
                                <p class="text-3xl font-bold text-green-600">
                                    {{ userDetails.summary.correct_bets }}
                                </p>
                                <p class="text-sm text-gray-600">Acertos</p>
                            </div>
                            <div
                                class="bg-purple-50 rounded-lg p-4 text-center"
                            >
                                <p class="text-3xl font-bold text-purple-600">
                                    {{ userDetails.summary.games_with_bets }}
                                </p>
                                <p class="text-sm text-gray-600">Jogos</p>
                            </div>
                        </div>

                        <!-- Lista de Jogos -->
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">
                            Detalhamento por Jogo
                        </h3>

                        <div
                            v-if="userDetails.games.length === 0"
                            class="text-center py-8 text-gray-500"
                        >
                            Nenhuma aposta calculada ainda.
                        </div>

                        <div v-else class="space-y-4">
                            <div
                                v-for="gameData in userDetails.games"
                                :key="gameData.game.id"
                                class="border rounded-lg overflow-hidden"
                            >
                                <!-- Cabeçalho do Jogo -->
                                <div
                                    class="bg-gray-50 px-4 py-3 flex justify-between items-center"
                                >
                                    <div>
                                        <p class="font-semibold text-gray-800">
                                            {{ gameData.game.home_team }}
                                            {{
                                                gameData.game.home_score
                                            }}
                                            x {{ gameData.game.away_score }}
                                            {{ gameData.game.away_team }}
                                        </p>
                                        <p class="text-sm text-gray-500">
                                            {{
                                                gameData.game.competition?.name
                                            }}
                                            •
                                            {{
                                                formatDate(
                                                    gameData.game.match_date,
                                                )
                                            }}
                                        </p>
                                    </div>
                                    <div class="text-right">
                                        <p
                                            class="text-lg font-bold"
                                            :class="
                                                gameData.total_points > 0
                                                    ? 'text-copa-blue-600'
                                                    : 'text-gray-400'
                                            "
                                        >
                                            +{{ gameData.total_points }} pts
                                        </p>
                                    </div>
                                </div>

                                <!-- Apostas do Jogo -->
                                <div class="divide-y">
                                    <div
                                        v-for="bet in gameData.bets"
                                        :key="bet.id"
                                        class="px-4 py-3 flex justify-between items-center"
                                    >
                                        <div class="flex items-center">
                                            <span
                                                :class="
                                                    bet.status === 'correct'
                                                        ? 'bg-green-100 text-green-800'
                                                        : bet.status === 'pending'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : 'bg-red-100 text-red-800'
                                                "
                                                class="px-2 py-1 rounded text-xs font-medium mr-3"
                                            >
                                                {{
                                                    bet.status === "correct"
                                                        ? "✓"
                                                        : bet.status === "pending"
                                                          ? "⏳"
                                                          : "✗"
                                                }}
                                            </span>
                                            <div>
                                                <p
                                                    class="font-medium text-gray-800"
                                                >
                                                    {{ bet.bet_type?.name }}
                                                </p>
                                                <p
                                                    class="text-sm text-gray-500"
                                                >
                                                    {{ formatPrediction(bet) }}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p
                                                class="font-semibold"
                                                :class="
                                                    bet.points_earned > 0
                                                        ? 'text-copa-blue-600'
                                                        : 'text-gray-400'
                                                "
                                            >
                                                +{{ bet.points_earned }} pts
                                            </p>
                                            <p class="text-xs text-gray-400">
                                                {{
                                                    bet.bet_type?.default_points
                                                }}
                                                pts base
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fechar -->
                    <div class="mt-6 flex justify-end">
                        <button
                            @click="closeUserModal"
                            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import api from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { computed, onMounted, ref } from "vue";

const authStore = useAuthStore();

const ranking = ref([]);
const competitions = ref([]);
const loading = ref(false);
const selectedYear = ref(new Date().getFullYear());
const selectedCompetition = ref("");
const currentYear = new Date().getFullYear();
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 20;

// Modal de detalhes do usuário
const showUserModal = ref(false);
const selectedUser = ref(null);
const userDetails = ref(null);
const loadingUserDetails = ref(false);

const availableYears = computed(() => {
    const years = [];
    for (let year = currentYear - 1; year >= currentYear - 5; year--) {
        years.push(year);
    }
    return years;
});

const currentUserId = computed(() => authStore.user?.id);

const filteredRanking = computed(() => {
    if (!searchQuery.value) return ranking.value;

    const query = searchQuery.value.toLowerCase();
    return ranking.value.filter((entry) =>
        entry.name.toLowerCase().includes(query),
    );
});

const totalPages = computed(() => {
    return Math.ceil(filteredRanking.value.length / itemsPerPage);
});

const paginatedRanking = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRanking.value.slice(start, end);
});

const loadRanking = async () => {
    loading.value = true;
    try {
        const params = {
            year: selectedYear.value,
        };

        if (selectedCompetition.value) {
            params.competition_id = selectedCompetition.value;
        }

        const response = await api.get("/ranking/current", { params });
        ranking.value = response.data;
        currentPage.value = 1;
    } catch (error) {
        console.error("Erro ao carregar ranking:", error);
    } finally {
        loading.value = false;
    }
};

const loadCompetitions = async () => {
    try {
        const response = await api.get("/competitions");
        competitions.value = response.data;
    } catch (error) {
        console.error("Erro ao carregar competições:", error);
    }
};

const filterRanking = () => {
    currentPage.value = 1;
};

const openUserDetails = async (entry) => {
    selectedUser.value = entry;
    showUserModal.value = true;
    loadingUserDetails.value = true;
    userDetails.value = null;

    try {
        const response = await api.get(`/ranking/user/${entry.user_id}/bets`);
        userDetails.value = response.data;
    } catch (error) {
        console.error("Erro ao carregar detalhes do usuário:", error);
    } finally {
        loadingUserDetails.value = false;
    }
};

const closeUserModal = () => {
    showUserModal.value = false;
    selectedUser.value = null;
    userDetails.value = null;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

const formatPrediction = (bet) => {
    const prediction = bet.prediction;
    const betType = bet.bet_type?.type;

    if (betType === "exact_score") {
        return `Placar: ${prediction.home_score} × ${prediction.away_score}`;
    } else if (betType === "first_goal") {
        return `Primeiro gol: ${prediction.player_name || "Jogador"}`;
    } else if (betType === "player_goal") {
        return `Gol de: ${prediction.player_name || "Jogador"}`;
    } else if (betType === "assists" || betType === "assist") {
        return `Assistência de: ${prediction.player_name || "Jogador"}`;
    }

    return JSON.stringify(prediction);
};

onMounted(() => {
    loadRanking();
    loadCompetitions();
});
</script>
