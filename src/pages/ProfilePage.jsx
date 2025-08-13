import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from '../styles/Profile.module.css';
import { ChevronLeft, Mail, Cake, User, CalendarPlus } from 'lucide-react';

const ProfilePage = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, fetchProfile } = useAuthStore();
    const [profileData, setProfileData] = useState(null);
    const [coverStyle, setCoverStyle] = useState({});
    const imgRef = useRef(null);

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfile(profileId);
            if (data) {
                setProfileData(data);
            } else {
                navigate('/home');
            }
        };

        if (profileId) {
            loadProfile();
        }
    }, [profileId, fetchProfile, navigate]);

    const handleImageLoad = () => {
        if (imgRef.current && window.ColorThief) {
            const colorThief = new window.ColorThief();
            try {
                const dominantColor = colorThief.getColor(imgRef.current);
                const [r, g, b] = dominantColor;
                const gradient = `linear-gradient(45deg, rgba(${r},${g},${b},0.6), var(--color-bg-dark) 70%)`;
                setCoverStyle({ background: gradient });
            } catch (error) {
                console.error('Error getting color from image:', error);
                setCoverStyle({ background: 'linear-gradient(45deg, #1f2937, #dc2626)' });
            }
        }
    };

    if (!profileData) {
        return <div className={styles.loading}>Loading Profile...</div>;
    }

    const isOwnProfile = currentUser?._id === profileData._id;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatGender = (gender) => {
        if (!gender) return 'Not specified';
        return gender.charAt(0).toUpperCase() + gender.slice(1).replace(/_/g, ' ');
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.profilePageContainer}>
                <header className={styles.profileHeaderNew}>
                    <div className={styles.profileCover} style={coverStyle}>
                    </div>
                    <div className={styles.profileAvatarContainer}>
                        <img
                            ref={imgRef}
                            src={profileData.picture || 'https://placehold.co/150x150/1f2937/ffffff?text=User'}
                            alt="Profile"
                            className={styles.profileAvatar}
                            onLoad={handleImageLoad}
                            crossOrigin="anonymous" 
                        />
                    </div>
                </header>

                <main className={styles.profileContent}>
                    <div className={styles.profileInfo}>
                        <h2 className={styles.profileName}>{profileData.name}</h2>
                        <p className={styles.profileEmail}>{profileData.email}</p>
                        {isOwnProfile && (
                             <button onClick={() => navigate('/settings')} className={styles.editProfileButton}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <div className={styles.profileDetails}>
                        <h3 className={styles.detailsTitle}>About {profileData.name.split(' ')[0]}</h3>
                        <div className={styles.detailGrid}>
                            <div className={styles.detailItem}>
                                <User size={20} className={styles.detailIcon} />
                                <div>
                                    <span className={styles.detailLabel}>Full Name</span>
                                    <span className={styles.detailValue}>{profileData.name}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Mail size={20} className={styles.detailIcon} />
                                <div>
                                    <span className={styles.detailLabel}>Email</span>
                                    <span className={styles.detailValue}>{profileData.email}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <Cake size={20} className={styles.detailIcon} />
                                <div>
                                    <span className={styles.detailLabel}>Birthday</span>
                                    <span className={styles.detailValue}>{formatDate(profileData.dob)}</span>
                                </div>
                            </div>
                             <div className={styles.detailItem}>
                                <User size={20} className={styles.detailIcon} />
                                <div>
                                    <span className={styles.detailLabel}>Gender</span>
                                    <span className={styles.detailValue}>{formatGender(profileData.gender)}</span>
                                </div>
                            </div>
                            <div className={styles.detailItem}>
                                <CalendarPlus size={20} className={styles.detailIcon} />
                                <div>
                                    <span className={styles.detailLabel}>Joined</span>
                                    <span className={styles.detailValue}>{formatDate(profileData.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                     <div style={{textAlign: 'center', marginTop: '2rem'}}>
                        <button onClick={() => navigate(-1)} className={styles.backButton}>
                            <ChevronLeft size={18} /> Back
                        </button>
                    </div>
                </main>
            </div>
            
            <div className={styles.activityContainer}>
                <h4>Activity</h4>
                <p>Watch history and favorite lists will appear here in the future.</p>
            </div>
        </div>
    );
};

export default ProfilePage;
