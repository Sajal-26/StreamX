import { Toaster, toast } from 'react-hot-toast';

export const Toast = () => {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
                duration: 5000,
                style: {
                    background: '#1f2937',
                    color: '#ffffff',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    boxShadow: '0 12px 25px rgba(220, 38, 38, 0.2)',
                },

                success: {
                    duration: 3000,
                    iconTheme: {
                        primary: '#4ade80',
                        secondary: '#1f2937',
                    },
                },
                error: {
                    duration: 5000,
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#1f2937',
                    },
                },
            }}
        />
    );
};

export const showSuccessToast = (message) => {
    toast.success(<b>{message}</b>);
};

export const showErrorToast = (message) => {
    toast.error(<b>{message}</b>);
};