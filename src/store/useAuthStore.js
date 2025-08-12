import { create } from "zustand";
import axios from "axios";
import { showSuccessToast, showErrorToast } from '../components/Toast';
import Cookies from 'js-cookie';
// import UAParser from "ua-parser-js";
import { UAParser } from "ua-parser-js";

const API_BASE = "http://localhost:3000/api";

// Utility: get device/browser info
const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    return {
        deviceId: `${result.device.vendor || "Unknown"}-${result.device.model || "Unknown"}-${result.os.name || "Unknown"}-${result.browser.name || "Unknown"}`,
        name: result.device.model || result.device.type || "Unknown Device",
        os: `${result.os.name || "Unknown OS"} ${result.os.version || ""}`.trim(),
        browser: `${result.browser.name || "Unknown Browser"} ${result.browser.version || ""}`.trim(),
        location: null // Optional: can be filled from backend using IP
    };
};

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
            const deviceInfo = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/login`, { email, password, deviceInfo }, { withCredentials: true });
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

    signupRequest: async ({ name, email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const deviceInfo = getDeviceInfo();
            await axios.post(`${API_BASE}/signup-request`, { name, email, password, deviceInfo }, { withCredentials: true });
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
            const deviceInfo = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/verify-otp`, { email, otp, deviceInfo }, { withCredentials: true });
            get().setAuthData({ user: res.data.user, token: Cookies.get('token') });
            showSuccessToast("OTP verified. Signup complete!");
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

    resendOtp: async (email) => {
        try {
            const res = await axios.post(`${API_BASE}/resend-otp`, { email }, { withCredentials: true });
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
            const deviceInfo = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/auth-google`, { token: googleIdToken, deviceInfo }, { withCredentials: true });
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
            const res = await axios.get(`${API_BASE}/profile/${profileId}`, { withCredentials: true });
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
            const res = await axios.put(`${API_BASE}/profile/${profileId}`, profileData, { withCredentials: true });
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

    changePassword: async ({ currentPassword, newPassword }) => {
        set({ isLoading: true });
        try {
            const res = await axios.post(`${API_BASE}/change-password`, { currentPassword, newPassword }, { withCredentials: true });
            showSuccessToast(res.data.message);
            return true;
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to change password');
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    forgotPassword: async (email) => {
        set({ isLoading: true });
        try {
            const res = await axios.post(`${API_BASE}/forgot-password`, { email }, { withCredentials: true });
            showSuccessToast(res.data.message);
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to send reset instructions');
        } finally {
            set({ isLoading: false });
        }
    },

    fetchDevices: async (userId) => {
        set({ isLoading: true });

        const deviceInfo = getDeviceInfo();
        const currentDeviceId = deviceInfo.deviceId;

        try {
            const res = await axios.get(
                `${API_BASE}/devices`,
                {
                    params: { currentDeviceId, userId },
                    withCredentials: true
                }
            );

            set({ devices: res.data || [] });
            return res.data || [];

        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to fetch devices');
            return [];
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
