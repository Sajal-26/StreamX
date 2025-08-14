import useAuthStore from '../store/useAuthStore';

const HomePage = () => {
  const { user } = useAuthStore();
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
      </div>
    </div>
  );
};

export default HomePage;