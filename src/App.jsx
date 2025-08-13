// src/App.jsx

import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage'; // Import the new component
import { Toast } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/useAuthStore';

function App() {
  const { user } = useAuthStore();

  return (
    <>
      <Toast />
      <Router>
        <Routes>
          {/* ... other routes */}
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <AuthPage />} />
          
          {/* FIX: Add the new route for resetting the password */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile/:profileId" element={<ProfilePage />} />
          </Route>
          {/* ... other routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;