import { create } from "zustand";
import axios from "axios";
import { showSuccessToast, showErrorToast } from '../components/Toast';
import Cookies from 'js-cookie';
import { UAParser } from "ua-parser-js";

const API_BASE = "/api";

const getBrowserInstanceId = () => {
    let instanceId = localStorage.getItem('browserInstanceId');
    if (!instanceId) {
        if (self.crypto && self.crypto.randomUUID) {
            instanceId = self.crypto.randomUUID();
        } else {
            console.warn('crypto.randomUUID not available. Using a fallback method.');
            instanceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }
        localStorage.setItem('browserInstanceId', instanceId);
    }
    return instanceId;
};

export const getDeviceInfo = () => {
    const parser = new UAParser();
    const result = parser.getResult();
    const browserInstanceId = getBrowserInstanceId();
    const deviceId = `${result.os.name || 'UnknownOS'}-${result.browser.name || 'UnknownBrowser'}-${browserInstanceId}`;

    return {
        deviceId: deviceId,
        name: result.device.model || result.device.type || "Desktop",
        os: `${result.os.name || "Unknown OS"} ${result.os.version || ""}`.trim(),
        browser: `${result.browser.name || "Unknown Browser"} ${result.browser.version || ""}`.trim(),
        location: null
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

    logout: async () => {
      const wasLoggedIn = !!get().user;

      localStorage.removeItem('user-info');
      Cookies.remove('token');
      delete axios.defaults.headers.common['Authorization'];
      set({ user: null, token: null, error: null });

      if (wasLoggedIn) {
        showSuccessToast("You have been logged out.");
        try {
          await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
        } catch (err) {
          console.error("Server logout cleanup failed:", err.response?.data?.message || err.message);
        }
      }
    },
    
    login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
            const device = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/login`, { email, password, device }, { withCredentials: true });
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
            const device = getDeviceInfo();
            await axios.post(`${API_BASE}/signup-request`, { username, email, password, device }, { withCredentials: true });
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
            const device = getDeviceInfo();
            const res = await axios.post(`${API_BASE}/auth-google`, { token: googleIdToken, device }, { withCredentials: true });
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

axios.interceptors.request.use(
  (config) => {
    if (config.url.startsWith('/api') || config.url.startsWith(API_BASE)) {
      const deviceInfo = getDeviceInfo();
      config.headers['x-device-id'] = deviceInfo.deviceId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasUser = !!useAuthStore.getState().user;

    if (hasUser && error.response && error.response.status === 401) {
      const message = error.response.data.message || 'Your session has expired. Please log in again.';
      showErrorToast(message);
      useAuthStore.getState().logout();
      
      return new Promise(() => {}); 
    }
    return Promise.reject(error);
  }
);

const initialToken = Cookies.get('token');
if (initialToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

export default useAuthStore;