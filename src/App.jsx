import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Settings from './pages/Settings';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import { Toast } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore, { getDeviceInfo } from './store/useAuthStore';
import Layout from './components/Layout';
import Loader from './components/Loader'; // Import the Loader
import io from 'socket.io-client';

const PlaceholderPage = ({ title }) => (
  <div style={{ color: 'white', textAlign: 'center', padding: '150px 20px', minHeight: '100vh', background: '#0f0f10' }}>
    <h1>{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

function App() {
  const { user, logout, isLoading } = useAuthStore(); // Get isLoading state

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = io({
      path: '/socket.io',
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server with socket ID:', socket.id);
      const deviceInfo = getDeviceInfo();
      socket.emit('register', { userId: user._id, deviceId: deviceInfo.deviceId });
    });

    socket.on('force-logout', () => {
      console.log('Force logout event received from server.');
      logout({ redirect: true });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
    });

    return () => {
      console.log('Disconnecting socket...');
      socket.disconnect();
    };
  }, [user, logout]);


  return (
    <>
      <Toast />
      {isLoading && <Loader />}
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes wrapped by Layout */}
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:profileId" element={<ProfilePage />} />
              <Route path="/movies" element={<PlaceholderPage title="Movies" />} />
              <Route path="/tv" element={<PlaceholderPage title="TV" />} />
              <Route path="/animes" element={<PlaceholderPage title="Animes" />} />
              <Route path="/sports" element={<PlaceholderPage title="Sports" />} />
              <Route path="/series" element={<PlaceholderPage title="Series" />} />
              <Route path="/my-list" element={<PlaceholderPage title="My List" />} />
            </Route>
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;