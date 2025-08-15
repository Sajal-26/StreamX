import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../components/Toast';
import styles from '../styles/Auth.module.css';
import Logo from '../assets/logo.png';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            showErrorToast("Passwords do not match.");
            return;
        }
        if (!token || !email) {
            showErrorToast("Invalid reset link. Please request a new one.");
            return;
        }

        try {
            const res = await axios.post('/api/reset-password', {
                email,
                token,
                newPassword: password
            });
            showSuccessToast(res.data.message);
            navigate('/auth');
        } catch (err) {
            showErrorToast(err.response?.data?.message || "Failed to reset password.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.bgOverlay}></div>
            <div className={styles.card}>
                <div className={styles.brandLogo}>
                    <img src={Logo} alt="StreamX Logo" className={styles.logoImage} />
                </div>
                <h3 style={{color: 'white', textAlign: 'center', marginBottom: '1.5rem'}}>Reset Your Password</h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                        required
                    />
                    <button type="submit" className={styles.submitBtn}>
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;