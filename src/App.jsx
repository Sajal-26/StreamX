import { useEffect, useState, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Settings from './pages/Settings';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import ServerDownPage from './pages/ServerDownPage';
import { Toast } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/useAuthStore';
import Layout from './components/Layout';
import Loader from './components/Loader';
import io from 'socket.io-client';

export const SocketContext = createContext(null);

const PlaceholderPage = ({ title }) => (
  <div style={{ color: 'white', textAlign: 'center', padding: '150px 20px', minHeight: '100vh', background: '#0f0f10' }}>
    <h1>{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

function App() {
  const { user, logout, isLoading, deviceId } = useAuthStore();
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get('/api/health');
        setIsServerOnline(true);
      } catch (error) {
        console.error("Server health check failed:", error);
        setIsServerOnline(false);
      } finally {
        setIsCheckingServer(false);
      }
    };
    checkServerStatus();
  }, []);

  useEffect(() => {
    if (!user || !isServerOnline) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.MODE === 'production'
      ? undefined
      : import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    const newSocket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server with socket ID:', newSocket.id);
      newSocket.emit('register', { userId: user._id });
    });

    newSocket.on('force-logout', (data) => {
      console.log('Force logout event received from server for device:', data.deviceId);
      if (data.deviceId === deviceId) {
        logout({ isForced: true });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server.');
    });

    return () => {
      console.log('Disconnecting socket...');
      newSocket.disconnect();
    };
  }, [user, logout, isServerOnline, deviceId]);

  if (isCheckingServer) {
    return <Loader />;
  }

  if (!isServerOnline) {
    return <ServerDownPage />;
  }

  return (
    <SocketContext.Provider value={socket}>
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
    </SocketContext.Provider>
  );
}

export default App;