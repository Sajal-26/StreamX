import { create } from "zustand";
import axios from "axios";

// const API_BASE = "https://stream-x-omega.vercel.app/api";
const API_BASE = "http://localhost:3000/api";

const useAuthStore = create((set) => ({
    user: null,

    login: async ({ email, password }) => {
        try {
            console.log("Logging in with:", { email, password });
            const res = await axios.post(`${API_BASE}/login`, { email, password }, { withCredentials: true });
            console.log("✅ Login success:", res.data);
            set({ user: res.data.user });
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            console.error("❌ Login failed:", serverMsg);
        }
    },

    signup: async ({ username, email, password }) => {
        try {
            console.log("Signing up with:", { username, email, password });
            console.log(`${API_BASE}/signup`);
            const res = await axios.post(`${API_BASE}/signup`, { username, email, password }, { withCredentials: true });
            console.log("✅ Signup success:", res.data);
            set({ user: res.data.user });
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            console.error("❌ Signup failed:", serverMsg);
        }
    },

    loginWithGoogle: async (googleIdToken) => {
        if (!googleIdToken) {
            console.error("❌ No Google ID token provided");
            return;
        }
        try {
            const res = await axios.post(
                `${API_BASE}/auth-google`,
                { token: googleIdToken },
                { withCredentials: true }
            );
            console.log("✅ Google login success:", res.data);
            set({ user: res.data.user });
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.message;
            console.error("❌ Google login failed:", serverMsg);
        }
    },

    logout: async () => {
        try {
            console.log(`${API_BASE}/logout`)
            await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
            console.log("✅ Logged out");
        } catch (err) {
            console.error("❌ Logout failed:", err.response?.data?.message || err.message);
        } finally {
            set({ user: null });
        }
    },
}));

export default useAuthStore;
