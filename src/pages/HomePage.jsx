import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Redirect is handled elsewhere (e.g., App.jsx)
  };

  const handleProfileClick = () => {
    navigate(`/profile/${user?._id}`);
  };

  return (
    <div style={{ 
        backgroundColor: '#0f172a', 
        color: 'white', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', color: '#e11d48', marginBottom: '1rem' }}>Welcome to StreamX</h1>
        <p style={{ fontSize: '1.25rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>
          Logged in as: <strong style={{ color: 'white' }}>{user?.name || 'User'}</strong>
        </p>
        <p style={{ fontSize: '1rem', color: '#94a3b8' }}>({user?.email})</p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            onClick={handleProfileClick}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            Profile
          </button>

          <button 
            onClick={handleLogout}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#e11d48',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
