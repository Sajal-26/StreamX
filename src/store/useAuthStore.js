import { create } from "zustand";
import axios from "axios";

// const API_BASE = "http://localhost:3000/api";
const API_BASE = "/api";

const useAuthStore = create((set) => ({
    user: null,

    login: async ({ email, password }) => {
        console.log("Logging in with:", { email, password });
        // When backend is ready:
        // const res = await axios.post(${API_BASE}/login, { email, password }, { withCredentials: true });
        // set({ user: res.data.user });
        set({ user: { name: "Demo User", email } });
    },

    signup: async ({ username, email, password }) => {
        console.log("Signing up with:", { username, email, password });
        // When backend is ready:
        // const res = await axios.post(${API_BASE}/signup, { username, email, password }, { withCredentials: true });
        // set({ user: res.data.user });
        set({ user: { name: username, email } });
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
            const serverMsg = err.response?.data || err.message;
            console.error("❌ Google login failed:", serverMsg);
        }
    },

    logout: async () => {
        try {
            await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
            console.log("✅ Logged out");
        } catch (err) {
            console.error("❌ Logout failed:", err.response?.data || err.message);
        } finally {
            set({ user: null });
        }
    },

    // Optional: initialize from server session (requires a /me endpoint on backend)
    // init: async () => {
    //     try {
    //         const res = await axios.get(${ API_BASE } / me, { withCredentials: true });
    //         set({ user: res.data.user });
    //     } catch {
    //         set({ user: null });
    //     }
    // },
}));

export default useAuthStore;