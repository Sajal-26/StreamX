import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { Toast } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore, { getDeviceInfo } from './store/useAuthStore'; 

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

    const intervalId = setInterval(checkDeviceStatus, 30 * 1000);

    checkDeviceStatus();

    return () => clearInterval(intervalId);
  }, [user, fetchDevices, logout]);

  return (
    <>
      <Toast />
      <Router>
        <Routes>
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile/:profileId" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? "/home" : "/auth"} replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;