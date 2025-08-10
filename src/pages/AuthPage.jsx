import { useState, useCallback } from "react";
import styles from "../styles/Auth.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import Logo from "../assets/logo.png";
import { GoogleLogin } from "@react-oauth/google";

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const { user, login, signup, loginWithGoogle, logout } = useAuthStore();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isLogin) {
            login({ email: formData.email, password: formData.password });
        } else {
            signup({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
        }

        setFormData({ username: "", email: "", password: "" });
    };


    return (
        <div className={styles.container}>
            <div className={styles.bgOverlay}></div>
            <div className={styles.card}>
                <div className={styles.brandLogo}>
                    <img
                        src={Logo}
                        alt="Cineflix Logo"
                        className={styles.logoImage}
                    />
                </div>

                {/* Tab Buttons */}
                <div className={styles.tabs}>
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`${styles.tab} ${isLogin ? styles.activeTab : ""}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`${styles.tab} ${!isLogin ? styles.activeTab : ""}`}
                    >
                        Sign Up
                    </button>
                    <motion.div
                        className={styles.tabIndicator}
                        animate={{ x: isLogin ? "0%" : "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                </div>

                {/* Form */}
                <AnimatePresence mode="wait">
                    <motion.form
                        key={isLogin ? "login" : "signup"}
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                        className={styles.form}
                    >
                        {!isLogin && (
                            <InputWithIcon
                                icon={<User size={18} />}
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                            />
                        )}

                        <InputWithIcon
                            icon={<Mail size={18} />}
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <InputWithIcon
                            icon={<Lock size={18} />}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            toggleIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            onToggle={togglePasswordVisibility}
                        />

                        <button type="submit" className={styles.submitBtn}>
                            {isLogin ? "LOGIN" : "CREATE ACCOUNT"}
                        </button>
                    </motion.form>
                </AnimatePresence>

                {/* Divider */}
                <div className={styles.divider}>
                    <span>OR</span>
                </div>
                {/* Google Auth */}
                <GoogleLogin
                    onSuccess={async (response) => {
                        const googleIdToken = response.credential;
                        console.log("Google OAuth success:", googleIdToken);
                        if (googleIdToken) {
                            loginWithGoogle(googleIdToken);
                        } else {
                            console.error("No Google ID token provided");
                        }
                    }}
                    onError={(error) => console.error("Google OAuth error:", error)}
                    theme="filled_black"
                    shape="pill" 
                />

                {/* Optional: Show Logout when logged in */}
                {user && (
                    <button
                        type="button"
                        className={styles.googleBtn}
                        style={{ marginTop: "1rem" }}
                        onClick={logout}
                    >
                        Logout ({user.name})
                    </button>
                )}
            </div>
        </div>
    );
};

const InputWithIcon = ({ icon, toggleIcon, onToggle, ...props }) => {
    return (
        <div className={styles.inputGroup}>
            <span className={styles.icon}>{icon}</span>
            <input className={styles.input} {...props} />
            {toggleIcon && (
                <span className={styles.toggle} onClick={onToggle}>
                    {toggleIcon}
                </span>
            )}
        </div>
    );
};

export default AuthPage;
