import { create } from "zustand";
import axios from "axios";
import { showSuccessToast, showErrorToast } from '../components/Toast';
import CryptoJS from 'crypto-js';
import { UAParser } from "ua-parser-js";

const API_BASE = "/api";

export const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    const os = `${result.os.name} ${result.os.version}`;
    const browser = `${result.browser.name} ${result.browser.version}`;
    const deviceType = result.device.type || 'desktop';
    const name = `${result.os.name} on ${result.browser.name}`;

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    const renderer = gl ? gl.getParameter(gl.RENDERER) : '';
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${renderer}`;
    const deviceId = CryptoJS.SHA256(fingerprint).toString();

    return { deviceId, name, os, browser, type: deviceType };
};

const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user-info')) || null,
    isLoading: false,
    error: null,
    cooldown: 0,
    deviceId: localStorage.getItem('deviceId'),

    setAuthData: (data) => {
        const { user } = data;
        localStorage.setItem('user-info', JSON.stringify(user));
        set({ user, error: null });
    },

    logout: async (options = {}) => {
        const { redirect = false } = options;
        const wasLoggedIn = !!get().user;

        localStorage.removeItem('user-info');
        localStorage.removeItem('deviceId');
        set({ user: null, error: null });

        if (wasLoggedIn) {
            if (!redirect) {
                showSuccessToast("You have been logged out.");
            }

            try {
                await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
            } catch (err) {
                console.error("Server logout cleanup failed (this is often expected if the session was already invalid):", err.response?.data?.message || err.message);
            }

            if (redirect) {
                window.location.assign('/auth');
            }
        }
    },

    login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const device = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/login`, { email, password, device }, { withCredentials: true });
            get().setAuthData({ user: res.data.user });
            localStorage.setItem('deviceId', device.deviceId);
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
            const device = getDeviceInfo();
            await axios.post(`${API_BASE}/signup-request`, { name, email, password, device }, { withCredentials: true });
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
            const device = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/verify-otp`, { email, otp, device }, { withCredentials: true });
            get().setAuthData({ user: res.data.user });
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
            const device = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/auth-google`, { token: googleIdToken, device }, { withCredentials: true });
            get().setAuthData({ user: res.data.user });
            localStorage.setItem('deviceId', device.deviceId);
            showSuccessToast('Successfully signed in with Google!');
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Google login failed. Please try again.';
            set({ error: serverMsg });
            showErrorToast(serverMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    logoutDevice: async (deviceId) => {
        set({ isLoading: true });
        try {
            await axios.post(`${API_BASE}/logout-device`, { deviceId }, { withCredentials: true });
            showSuccessToast('Device logged out successfully!');
            return true;
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to log out device');
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProfile: async (profileId) => {
        set({ isLoading: true });
        try {
            const res = await axios.get(`${API_BASE}/profile/${profileId}`, { withCredentials: true });
            return res.data;
        } catch (error) {
            showErrorToast(error.response?.data?.message || 'Failed to fetch profile');
            console.log(error.response?.data?.message)
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
            const res = await axios.get(`${API_BASE}/devices`, {
                params: { currentDeviceId, userId },
                headers: {
                    'x-device-id': currentDeviceId
                },
                withCredentials: true
            });
            return res.data || [];
        } catch (error) {
            console.error(error.response?.data?.message || 'Failed to fetch devices');
            if (error.response?.status !== 401) {
                showErrorToast(error.response?.data?.message || 'Failed to fetch devices');
            }
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    deleteAccount: async () => {
        set({ isLoading: true });
        try {
            const userId = get().user._id;
            const res = await axios.delete(`${API_BASE}/profile/${userId}`, { withCredentials: true });
            showSuccessToast("Account Deleted Successully");
            get().logout({ redirect: true });
            return true;
        } catch (e) {
            showErrorToast(e.response?.data?.message || "Error Deleting Account");
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    updateUser: (updatedUserData) => {
        const currentUser = get().user;
        if (currentUser) {
            const newUser = { ...currentUser, ...updatedUserData };
            localStorage.setItem('user', JSON.stringify(newUser));
            set({ user: newUser });
        }
    },
}));

axios.interceptors.request.use(
    (config) => {
        const deviceInfo = getDeviceInfo();
        config.headers['x-device-id'] = deviceInfo.deviceId;
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const hasUser = !!useAuthStore.getState().user;

        if (hasUser && error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== `${API_BASE}/refresh-token`) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => axios(originalRequest));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${API_BASE}/refresh-token`, {}, { withCredentials: true });
                processQueue(null);
                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                showErrorToast('Your session has been terminated. Please log in again.');
                useAuthStore.getState().logout({ redirect: true });
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default useAuthStore;