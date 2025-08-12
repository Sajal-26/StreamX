import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
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
          {/* Default route redirects based on auth state */}
          <Route path="/" element={<Navigate to={user ? "/home" : "/auth"} replace />} />

          {/* Auth route, redirects to home if user is already logged in */}
          <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <AuthPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile/:profileId" element={<ProfilePage />} />
            {/* You can add more protected routes here */}
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
