<template>
  <Teleport to="body">
    <Transition name="confirm-backdrop">
      <div
        v-if="toastStore.confirmState.show"
        class="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="toastStore.resolveConfirm(false)"
        />

        <!-- Modal -->
        <Transition name="confirm-modal" appear>
          <div
            v-if="toastStore.confirmState.show"
            class="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <!-- Ícone -->
            <div class="flex justify-center mb-4">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="iconBgClass"
              >
                <span class="text-2xl">{{ icon }}</span>
              </div>
            </div>

            <!-- Título -->
            <h3 class="text-lg font-bold text-gray-900 text-center mb-2">
              {{ toastStore.confirmState.title }}
            </h3>

            <!-- Mensagem -->
            <p class="text-gray-600 text-center text-sm mb-6">
              {{ toastStore.confirmState.message }}
            </p>

            <!-- Botões -->
            <div class="flex gap-3">
              <button
                @click="toastStore.resolveConfirm(false)"
                class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {{ toastStore.confirmState.cancelText }}
              </button>
              <button
                @click="toastStore.resolveConfirm(true)"
                class="flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors"
                :class="confirmBtnClass"
              >
                {{ toastStore.confirmState.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
import { computed } from 'vue'

const toastStore = useToastStore()

const variant = computed(() => toastStore.confirmState.variant)

const icon = computed(() => {
  const map = {
    danger: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  }
  return map[variant.value] || map.danger
})

const iconBgClass = computed(() => {
  const map = {
    danger: 'bg-red-100',
    warning: 'bg-yellow-100',
    info: 'bg-blue-100',
  }
  return map[variant.value] || map.danger
})

const confirmBtnClass = computed(() => {
  const map = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    info: 'bg-copa-blue-500 hover:bg-copa-blue-600',
  }
  return map[variant.value] || map.danger
})
</script>

<style scoped>
.confirm-backdrop-enter-active {
  transition: opacity 0.2s ease-out;
}
.confirm-backdrop-leave-active {
  transition: opacity 0.15s ease-in;
}
.confirm-backdrop-enter-from,
.confirm-backdrop-leave-to {
  opacity: 0;
}

.confirm-modal-enter-active {
  transition: all 0.2s ease-out;
}
.confirm-modal-leave-active {
  transition: all 0.15s ease-in;
}
.confirm-modal-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.confirm-modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
