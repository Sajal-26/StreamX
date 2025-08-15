import React from 'react';
import { HardDriveDownload } from 'lucide-react';
import Logo from '../assets/logo.png';

const ServerDownPage = () => {
    const handleRetry = () => {
        window.location.reload();
    };

    const pageStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f0f10',
        color: '#f3f4f6',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        textAlign: 'center',
        padding: '2rem',
        boxSizing: 'border-box'
    };

    const logoStyle = {
        width: '200px',
        marginBottom: '2rem',
        opacity: 0.7
    };

    const iconContainerStyle = {
        marginBottom: '2rem',
        color: '#dc2626',
        animation: 'pulse 2s infinite'
    };

    const titleStyle = {
        fontSize: '2.5rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '1rem',
        textShadow: '0 0 10px rgba(220, 38, 38, 0.5)'
    };

    const messageStyle = {
        fontSize: '1.25rem',
        color: '#a1a1aa',
        maxWidth: '500px',
        lineHeight: '1.6'
    };

    const retryButtonStyle = {
        marginTop: '2.5rem',
        padding: '0.8rem 2rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'white',
        backgroundColor: '#dc2626',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
    };

    const keyframes = `
        @keyframes pulse {
            0% {
                transform: scale(1);
                opacity: 0.7;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
            100% {
                transform: scale(1);
                opacity: 0.7;
            }
        }
    `;

    return (
        <>
            <style>{keyframes}</style>
            <div style={pageStyle}>
                <img src={Logo} alt="StreamX Logo" style={logoStyle} />
                <div style={iconContainerStyle}>
                    <HardDriveDownload size={80} strokeWidth={1.5} />
                </div>
                <h1 style={titleStyle}>Server is Currently Unavailable</h1>
                <p style={messageStyle}>
                    The server is down at the moment. We are working to get it back online. Please try again later.
                </p>
                <button
                    style={retryButtonStyle}
                    onClick={handleRetry}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Retry Connection
                </button>
            </div>
        </>
    );
};

export default ServerDownPage;