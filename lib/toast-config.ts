import { toast, ToastOptions } from 'react-hot-toast';

// Monochrome theme colors matching website design
const TOAST_STYLES = {
    success: {
        background: '#ffffff',
        color: '#000000',
        border: '1px solid #e4e4e7',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    error: {
        background: '#18181b',
        color: '#ffffff',
        border: '1px solid #ef4444',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    loading: {
        background: '#27272a',
        color: '#ffffff',
        border: '1px solid #3f3f46',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    info: {
        background: '#18181b',
        color: '#a1a1aa',
        border: '1px solid #52525b',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
};

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
    duration: 3000,
    position: 'top-center',
    style: {
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
    },
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
        ...DEFAULT_TOAST_OPTIONS,
        style: {
            ...DEFAULT_TOAST_OPTIONS.style,
            ...TOAST_STYLES.success,
        },
        ...options,
    });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
        ...DEFAULT_TOAST_OPTIONS,
        style: {
            ...DEFAULT_TOAST_OPTIONS.style,
            ...TOAST_STYLES.error,
        },
        ...options,
    });
};

export const showLoadingToast = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
        ...DEFAULT_TOAST_OPTIONS,
        style: {
            ...DEFAULT_TOAST_OPTIONS.style,
            ...TOAST_STYLES.loading,
        },
        ...options,
    });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
    return toast(message, {
        ...DEFAULT_TOAST_OPTIONS,
        style: {
            ...DEFAULT_TOAST_OPTIONS.style,
            ...TOAST_STYLES.info,
        },
        ...options,
    });
};

// For dismissing toasts
export const dismissToast = (toastId?: string) => {
    if (toastId) {
        toast.dismiss(toastId);
    } else {
        toast.dismiss();
    }
};

// For updating existing toasts (useful for loading -> success/error flow)
export const updateToast = (
    toastId: string,
    type: 'success' | 'error',
    message: string,
    options?: ToastOptions
) => {
    if (type === 'success') {
        toast.success(message, {
            id: toastId,
            ...DEFAULT_TOAST_OPTIONS,
            style: {
                ...DEFAULT_TOAST_OPTIONS.style,
                ...TOAST_STYLES.success,
            },
            ...options,
        });
    } else {
        toast.error(message, {
            id: toastId,
            ...DEFAULT_TOAST_OPTIONS,
            style: {
                ...DEFAULT_TOAST_OPTIONS.style,
                ...TOAST_STYLES.error,
            },
            ...options,
        });
    }
};
