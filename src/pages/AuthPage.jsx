import { useState, useRef } from "react";
import styles from "../styles/Auth.module.css";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import useAuthStore from "../store/useAuthStore";
import Logo from "../assets/logo.png";
import { GoogleLogin } from "@react-oauth/google";

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [otpStatus, setOtpStatus] = useState(null);
    const [shake, setShake] = useState(false);

    const otpRefs = useRef([]);
    const { user, login, logout, loginWithGoogle, signupRequest, verifyOtp, resendOtp, cooldown } = useAuthStore();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            login({ email: formData.email, password: formData.password });
        } else {
            const success = await signupRequest({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            });
            if (success) {
                setOtpStep(true);
                setOtpStatus(null);
            }
        }
    };

    const handleOtpChange = (e, index) => {
        const value = e.target.value;
        if (!value) return;

        const digits = value.replace(/\D/g, "").split("");

        const newOtp = [...otp];

        for (let i = 0; i < digits.length && index + i < 6; i++) {
            newOtp[index + i] = digits[i];
            if (otpRefs.current[index + i]) {
                otpRefs.current[index + i].value = digits[i];
            }
        }

        setOtp(newOtp);

        const nextIndex = index + digits.length;
        if (nextIndex < 6 && otpRefs.current[nextIndex]) {
            otpRefs.current[nextIndex].focus();
        }

        if (newOtp.every((digit) => digit !== "")) {
            handleOtpSubmit(newOtp.join(""));
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedValue = e.clipboardData.getData("text");
        const digits = pastedValue.replace(/\D/g, "").split("");

        if (digits.length === 6) {
            const newOtp = [...otp];
            for (let i = 0; i < 6; i++) {
                newOtp[i] = digits[i];
                if (otpRefs.current[i]) {
                    otpRefs.current[i].value = digits[i];
                }
            }
            setOtp(newOtp);
            handleOtpSubmit(newOtp.join(""));
        }
    };

    const handleOtpKeyDown = (e, index) => {
        const key = e.key;

        if (key === "Backspace") {
            if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
            } else if (index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                otpRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleOtpSubmit = async (otpValue) => {
        const success = await verifyOtp({ email: formData.email, otp: otpValue });

        if (!success) {
            setOtpStatus("error");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setOtp(new Array(6).fill(""));
            otpRefs.current[0].focus();
        } else {
            setOtpStatus("success");
            setTimeout(() => {
                setOtpStep(false);
                setFormData({ username: "", email: "", password: "" });
                setOtp(new Array(6).fill(""));
                setOtpStatus(null);
            }, 500);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bgOverlay}></div>
            <div className={styles.card}>
                <div className={styles.brandLogo}>
                    <img src={Logo} alt="Cineflix Logo" className={styles.logoImage} />
                </div>

                <div className={styles.tabs}>
                    <button
                        onClick={() => {
                            setIsLogin(true);
                            setOtpStep(false);
                        }}
                        className={`${styles.tab} ${isLogin ? styles.activeTab : ""}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => {
                            setIsLogin(false);
                            setOtpStep(false);
                        }}
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

                <AnimatePresence mode="wait">
                    {otpStep ? (
                        <motion.form
                            key="otp"
                            onSubmit={(e) => e.preventDefault()}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.4 }}
                            className={styles.form}
                        >
                            <InputWithIcon
                                icon={<Mail size={18} />}
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                disabled
                            />
                            <div
                                className={`${styles.otpContainer} 
                                    ${shake ? styles.shake : ""}`}
                            >
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={otp[index]}
                                        onChange={(e) => handleOtpChange(e, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                        onPaste={index === 0 ? handleOtpPaste : undefined}
                                        ref={(el) => (otpRefs.current[index] = el)}
                                        className={`${styles.otpInput}
                                                    ${otpStatus === "success" ? styles.otpSuccess : ""} 
                                                    ${otpStatus === "error" ? styles.otpError : ""}`}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => resendOtp(formData.email)}
                                disabled={cooldown > 0}
                                className={styles.submitBtn}
                            >
                                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                            </button>
                        </motion.form>
                    ) : (
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
                    )}
                </AnimatePresence>

                <div className={styles.divider}>
                    <span>OR</span>
                </div>

                <div className={styles.googleBtnContainer}>
                    <button type="button" className={styles.googleBtn}>
                        <div className={styles.googleIcon}></div>
                        <span>Sign in with Google</span>
                    </button>
                    <div className={styles.googleLoginWrapper}>
                        <GoogleLogin
                            onSuccess={async (response) => {
                                const googleIdToken = response.credential;
                                if (googleIdToken) loginWithGoogle(googleIdToken);
                            }}
                            onError={(error) => console.error("Google OAuth error:", error)}
                            text="signin_with"
                            width="300px"
                        />
                    </div>
                </div>

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

const InputWithIcon = ({ icon, toggleIcon, onToggle, ...props }) => (
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

export default AuthPage;
