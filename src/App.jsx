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
import axios from 'axios';

const PlaceholderPage = ({ title }) => (
    <div style={{ color: 'white', textAlign: 'center', padding: '150px 20px', minHeight: '100vh', background: '#0f0f10' }}>
      <h1>{title}</h1>
      <p>This page is under construction.</p>
    </div>
);

function App() {
  const { user, logout, fetchDevices } = useAuthStore();

  useEffect(() => {
    if (!user) {
      return;
    }

    const checkDeviceStatus = async () => {
      try {
        const currentDevice = getDeviceInfo();
        const currentDeviceId = currentDevice.deviceId;
        const activeDevices = await fetchDevices(user._id);
        
        if (activeDevices && Array.isArray(activeDevices)) {
          const isDeviceActive = activeDevices.some(device => device.id === currentDeviceId);
          
          if (!isDeviceActive) {
            console.log("Device remotely logged out. Clearing session.");
            logout();
          }
        }
      } catch (error) {
        console.error('Failed to verify device status:', error);
      }
    };

    const updateActivity = async () => {
      try {
        await axios.get('/api/profile');
      } catch (error) {
        console.error('Failed to update activity', error);
      }
    };

    checkDeviceStatus();
    updateActivity();

    const deviceCheckInterval = setInterval(checkDeviceStatus, 60 * 1000);
    const activityUpdateInterval = setInterval(updateActivity, 5 * 60 * 1000);

    return () => {
      clearInterval(deviceCheckInterval);
      clearInterval(activityUpdateInterval);
    };
  }, [user, fetchDevices, logout]);

  return (
    <>
      <Toast />
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
              {/* Added placeholder routes from your navbar example */}
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
