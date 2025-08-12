import { create } from "zustand";
import axios from "axios";
import { showSuccessToast, showErrorToast } from '../components/Toast';
import Cookies from 'js-cookie';

const API_BASE = "/api";

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user-info')) || null,
    token: Cookies.get('token') || null,
    isLoading: false,
    error: null,
    cooldown: 0, 

    setAuthData: (data) => {
        const { user, token } = data;
        localStorage.setItem('user-info', JSON.stringify(user));
        if (token) {
            Cookies.set('token', token, { expires: 30 });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        set({ user, token, error: null });
    },

    login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_BASE}/login`, { email, password });
            get().setAuthData({ user: res.data.user, token: Cookies.get('token') });
            showSuccessToast('Login successful! Welcome back.');
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            set({ error: serverMsg });
            showErrorToast(serverMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    signupRequest: async ({ username, email, password }) => {
        set({ isLoading: true, error: null });
        try {
            await axios.post(`${API_BASE}/signup-request`, {
                username, email, password
            });
            showSuccessToast("OTP sent to your email!");
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            set({ error: msg });
            showErrorToast(msg);
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    verifyOtp: async ({ email, otp }) => {
        set({ isLoading: true, error: null });
        try {
            const res = await axios.post(`${API_BASE}/verify-otp`, { email, otp });
            get().setAuthData({ user: res.data.user, token: Cookies.get('token') });
            showSuccessToast("OTP verified. Signup complete!");
            return true
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            set({ error: msg });
            showErrorToast(msg);
            return false
        } finally {
            set({ isLoading: false });
        }
    },

    resendOtp: async (email) => {
        try {
            const res = await axios.post(`${API_BASE}/resend-otp`, { email });
            showSuccessToast(res.data.message);

            set({ cooldown: 30 });
            const countdown = setInterval(() => {
                set((state) => {
                    if (state.cooldown <= 1) {
                        clearInterval(countdown);
                        return { cooldown: 0 };
                    }
                    return { cooldown: state.cooldown - 1 };
                });
            }, 1000);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            showErrorToast(msg);
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
            get().setAuthData({ user: res.data.user, token: Cookies.get('token') });
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
            Cookies.remove('token');
            delete axios.defaults.headers.common['Authorization'];
            set({ user: null, token: null, error: null });
        }
    },

    fetchProfile: async (profileId) => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_BASE}/profile/${profileId}`);
            return res.data;
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to fetch profile');
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProfile: async (profileId, profileData) => {
        set({ isLoading: true });
        try {
            const res = await axios.put(`${API_BASE}/profile/${profileId}`, profileData);
            const currentUser = get().user;
            if (currentUser._id === res.data._id) {
                localStorage.setItem('user-info', JSON.stringify(res.data));
                set({ user: res.data });
            }
            showSuccessToast('Profile updated successfully!');
            return true;
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to update profile');
            return false;
        } finally {
            set({ isLoading: false });
        }
    },
}));

const initialToken = Cookies.get('token');
if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export default useAuthStore;
