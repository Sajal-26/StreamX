import { create } from "zustand";
import axios from "axios";
import { showSuccessToast, showErrorToast } from '../components/Toast';

const API_BASE = "http://localhost:3000/api";

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user-info')) || null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,

    setAuthData: (data) => {
        const { user, token } = data;
        localStorage.setItem('user-info', JSON.stringify(user));
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token, error: null });
    },

    login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_BASE}/login`, { email, password });
            get().setAuthData(res.data);
            showSuccessToast('Login successful! Welcome back.');
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            set({ error: serverMsg });
            showErrorToast(serverMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    signup: async ({ username, email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_BASE}/signup`, { username, email, password });
            get().setAuthData(res.data);
            showSuccessToast('Signup successful! Welcome.');
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            set({ error: serverMsg });
            showErrorToast(serverMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    loginWithGoogle: async (googleIdToken) => {
        if (!googleIdToken) {
            const errorMsg = "No Google ID token provided";
            set({ error: errorMsg });
            showErrorToast(errorMsg);
            return;
        }
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_BASE}/auth-google`, { token: googleIdToken });
            get().setAuthData(res.data);
            showSuccessToast('Successfully signed in with Google!');
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Google login failed. Please try again.';
            set({ error: serverMsg });
            showErrorToast(serverMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            showSuccessToast("You have been logged out.");
        } catch (err) {
            console.error("Logout failed on server:", err.response?.data?.message || err.message);
        } finally {
            localStorage.removeItem('user-info');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            set({ user: null, token: null, error: null });
        }
    },
}));

const initialToken = localStorage.getItem('token');
if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export default useAuthStore;