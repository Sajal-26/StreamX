import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from '../styles/Profile.module.css'; // Reusing some styles
import { ChevronLeft } from 'lucide-react';

const ProfilePage = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    const { fetchProfile } = useAuthStore();
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfile(profileId);
            if (data) {
                setProfileData(data);
            } else {
                // Optionally navigate to a 'not found' page or home
                navigate('/home');
            }
        };

        if (profileId) {
            loadProfile();
        }
    }, [profileId, fetchProfile, navigate]);

    if (!profileData) {
        return <div className={styles.loading}>Loading Profile...</div>;
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container} style={{ maxWidth: '700px' }}>
                <main className={styles.content} style={{ width: '100%' }}>
                    <div className={styles.profileHeader}>
                        <img
                            src={profileData.picture || 'https://placehold.co/128x128/1f2937/ffffff?text=User'}
                            alt="Profile"
                            className={styles.profilePic}
                            style={{ width: '150px', height: '150px', border: '4px solid #4b5563' }}
                        />
                        <h3 style={{ marginTop: '1rem' }}>{profileData.name}</h3>
                        <p>{profileData.email}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '2rem', paddingTop: '2rem', textAlign: 'center' }}>
                        {/* You can add other public info here, like a bio or public watchlists in the future */}
                        <p style={{color: 'var(--color-muted-text)'}}>Public Profile</p>
                    </div>
                     <div style={{textAlign: 'center', marginTop: '2rem'}}>
                        <button onClick={() => navigate(-1)} style={{all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-muted-text)'}}>
                            <ChevronLeft size={18} /> Back
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;