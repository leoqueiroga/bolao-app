import { defineStore } from "pinia";
import { ref } from "vue";

export const useToastStore = defineStore("toast", () => {
    // Toast notifications
    const toasts = ref([]);
    let toastId = 0;

    const addToast = (message, type = "info", duration = 4000) => {
        const id = ++toastId;
        toasts.value.push({ id, message, type, duration });

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }

        return id;
    };

    const removeToast = (id) => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
    };

    const success = (message, duration) =>
        addToast(message, "success", duration);
    const error = (message, duration) => addToast(message, "error", duration);
    const warning = (message, duration) =>
        addToast(message, "warning", duration);
    const info = (message, duration) => addToast(message, "info", duration);

    // Confirm modal
    const confirmState = ref({
        show: false,
        title: "",
        message: "",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        variant: "danger",
        resolve: null,
    });

    const confirm = ({
        title = "Confirmação",
        message,
        confirmText = "Confirmar",
        cancelText = "Cancelar",
        variant = "danger",
    } = {}) => {
        return new Promise((resolve) => {
            confirmState.value = {
                show: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                resolve,
            };
        });
    };

    const resolveConfirm = (value) => {
        if (confirmState.value.resolve) {
            confirmState.value.resolve(value);
        }
        confirmState.value.show = false;
    };

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        confirmState,
        confirm,
        resolveConfirm,
    };
});
