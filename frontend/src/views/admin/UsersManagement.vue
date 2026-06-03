<template>
  <div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-copa-blue-500">Gerenciamento de Usuários</h1>
      <RouterLink to="/admin" class="text-copa-blue-500 hover:text-copa-blue-600">
        ← Voltar ao Admin
      </RouterLink>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow-md p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nome ou email..."
          class="input-field"
        />
        <select v-model="filterRole" class="input-field">
          <option value="">Todos os usuários</option>
          <option value="admin">Apenas admins</option>
          <option value="user">Apenas usuários</option>
        </select>
        <div class="text-sm text-gray-600 flex items-center">
          Total: {{ filteredUsers.length }} usuário(s)
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-copa-blue-500"></div>
      <p class="mt-4 text-gray-600">Carregando usuários...</p>
    </div>

    <!-- Mensagens -->
    <div v-if="successMessage" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {{ errorMessage }}
    </div>

    <!-- Tabela de Usuários -->
    <div v-else class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-copa-blue-500 text-white">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Usuário
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Pontos
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Membro desde
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <!-- Avatar com foto ou iniciais -->
                    <div v-if="user.avatar_url" class="h-10 w-10 rounded-full overflow-hidden border-2 border-copa-blue-500">
                      <img :src="user.avatar_url" :alt="user.name" class="w-full h-full object-cover" />
                    </div>
                    <div v-else class="h-10 w-10 rounded-full bg-copa-blue-500 flex items-center justify-center text-white font-semibold">
                      {{ getUserInitials(user.name) }}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ user.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="user.role === 'admin' ? 'badge-warning' : 'badge-info'"
                  class="badge"
                >
                  {{ user.role === 'admin' ? '👑 Admin' : '👤 Usuário' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ user.total_points || user.experience_points || 0 }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ formatDate(user.created_at) }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  v-if="user.role !== 'admin'"
                  @click="toggleAdmin(user, true)"
                  :disabled="updatingUserId === user.id"
                  class="text-copa-blue-600 hover:text-copa-blue-900 font-medium mr-3 disabled:opacity-50"
                >
                  {{ updatingUserId === user.id ? '...' : '⬆️ Tornar Admin' }}
                </button>
                <button
                  v-else-if="user.id !== currentUserId"
                  @click="toggleAdmin(user, false)"
                  :disabled="updatingUserId === user.id"
                  class="text-orange-600 hover:text-orange-900 font-medium mr-3 disabled:opacity-50"
                >
                  {{ updatingUserId === user.id ? '...' : '⬇️ Remover Admin' }}
                </button>
                <span v-else class="text-gray-400 text-xs">
                  (Você mesmo)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mensagem se não houver usuários -->
      <div v-if="filteredUsers.length === 0" class="text-center py-12 text-gray-500">
        Nenhum usuário encontrado
      </div>
    </div>
  </div>
</template>

<script setup>
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()
const toast = useToastStore()

const loading = ref(true)
const users = ref([])
const searchQuery = ref('')
const filterRole = ref('')
const updatingUserId = ref(null)
const successMessage = ref('')
const errorMessage = ref('')

const currentUserId = computed(() => authStore.user?.id)

const filteredUsers = computed(() => {
  let filtered = users.value

  // Filtrar por busca
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  }

  // Filtrar por role
  if (filterRole.value) {
    filtered = filtered.filter(user => user.role === filterRole.value)
  }

  return filtered
})

const getUserInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    errorMessage.value = 'Erro ao carregar usuários'
  } finally {
    loading.value = false
  }
}

const toggleAdmin = async (user, makeAdmin) => {
  const confirmed = await toast.confirm({
    title: makeAdmin ? 'Tornar admin' : 'Remover admin',
    message: `Tem certeza que deseja ${makeAdmin ? 'tornar' : 'remover'} ${user.name} ${makeAdmin ? 'admin' : 'de admin'}?`,
    confirmText: makeAdmin ? 'Tornar admin' : 'Remover',
    variant: makeAdmin ? 'info' : 'danger',
  })
  if (confirmed) {
    updatingUserId.value = user.id
    successMessage.value = ''
    errorMessage.value = ''

    try {
      await api.patch(`/users/${user.id}/role`, {
        role: makeAdmin ? 'admin' : 'user'
      })
      
      successMessage.value = `${user.name} ${makeAdmin ? 'agora é admin' : 'não é mais admin'}!`
      await loadUsers()
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } catch (error) {
      console.error('Erro ao atualizar role:', error)
      errorMessage.value = error.response?.data?.message || 'Erro ao atualizar permissões do usuário'
    } finally {
      updatingUserId.value = null
    }
  }
}

onMounted(() => {
  loadUsers()
})
</script>
