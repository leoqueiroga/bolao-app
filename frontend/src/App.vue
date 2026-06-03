<template>
  <div id="app" class="flex flex-col min-h-screen">
    <ToastNotification />
    <ConfirmModal />

    <div v-if="!authStore.initialized" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-copa-blue-500 to-copa-blue-700">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p class="mt-4 text-white font-semibold">Carregando...</p>
      </div>
    </div>

    <template v-else>
      <div :class="[authStore.isAuthenticated ? 'bg-gray-50' : '', 'flex-1']">
        <Navbar v-if="authStore.isAuthenticated" />
        <main :class="authStore.isAuthenticated ? 'container mx-auto px-4 py-8' : ''">
          <RouterView :key="$route.fullPath" />
        </main>
      </div>

      <footer v-if="authStore.isAuthenticated" class="bg-copa-blue-700 text-white py-4 mt-auto">
        <div class="container mx-auto px-4 text-center">
          <p class="text-sm">
            Feito com 💙 para o <span class="font-semibold">Bolão Copa do Mundo</span>
          </p>
          <p class="text-xs mt-1 text-copa-blue-200">
            por Leonardo Queiroga Ramirez •
            <a href="https://leozao.dev" target="_blank" rel="noopener noreferrer" class="underline hover:text-white transition-colors">
              leozao.dev
            </a>
          </p>
        </div>
      </footer>
    </template>
  </div>
</template>

<script setup>
import ConfirmModal from '@/components/ConfirmModal.vue';
import Navbar from '@/components/Navbar.vue';
import ToastNotification from '@/components/ToastNotification.vue';
import { useAuthStore } from '@/stores/auth';
import { RouterView } from 'vue-router';

const authStore = useAuthStore()
</script>
