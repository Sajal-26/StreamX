import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from '../styles/Profile.module.css';
import { User, Key, Save, Edit, Camera, Trash2, X, Shield, Monitor, LogOut, Upload, ChevronLeft, Mars, Venus, Transgender } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';
import profileAvatars from '../assets/profileData.json';
import { showErrorToast } from '../components/Toast';

const ProfilePage = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    const { user, fetchProfile, updateProfile, logout } = useAuthStore();

    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    const [isProfilePicModalOpen, setProfilePicModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfile(profileId);
            if (data) {
                const formattedData = {
                    ...data,
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
                };
                setProfileData(formattedData);
                setFormData(formattedData);
                setIsOwnProfile(user?._id === data._id);
            } else {
                navigate('/home');
            }
        };
        if (profileId && user) {
            loadProfile();
        }
    }, [profileId, user, fetchProfile, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result?.toString() || '');
                setAvatarModalOpen(false);
            });
            reader.readAsDataURL(e.target.files[0]);
            e.target.value = null;
        }
    };

    const handleAvatarSelect = (url) => {
        setFormData(prev => ({ ...prev, picture: url }));
        setAvatarModalOpen(false);
    };

    const handleCropComplete = (croppedImage) => {
        setFormData(prev => ({ ...prev, picture: croppedImage }));
        setImageToCrop(null);
    };

    const handleRemovePicture = () => {
        setFormData(prev => ({ ...prev, picture: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProfile(profileId, formData);
        if (success) {
            const data = await fetchProfile(profileId);
            if (data) {
                const formattedData = {
                    ...data,
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
                };
                setProfileData(formattedData);
                setFormData(formattedData);
            }
        }
    };

    if (!profileData) {
        return <div className={styles.loading}>Loading...</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings formData={formData} setFormData={setFormData} handleChange={handleChange} handleSubmit={handleSubmit} />;
            case 'security':
                return <SecuritySettings user={profileData} />;
            case 'devices':
                return <DeviceManager />;
            default:
                return <ProfileSettings formData={formData} setFormData={setFormData} handleChange={handleChange} handleSubmit={handleSubmit} />;
        }
    };

    return (
        <>
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                />
            )}
            {isAvatarModalOpen && (
                <AvatarGallery
                    currentAvatar={formData.picture}
                    onSelect={handleAvatarSelect}
                    onClose={() => setAvatarModalOpen(false)}
                    onUploadClick={() => fileInputRef.current?.click()}
                />
            )}
            {isProfilePicModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setProfilePicModalOpen(false)}>
                    <div className={styles.profilePicModalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={() => setProfilePicModalOpen(false)}>
                            <X size={24} />
                        </button>
                        <img src={formData.picture} alt="Profile Preview" className={styles.modalImage} />
                    </div>
                </div>
            )}

            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <aside className={styles.sidebar}>
                        <div className={styles.profileHeader}>
                            <div className={styles.profilePicContainer}>
                                <img
                                    src={formData.picture || 'https://placehold.co/128x128/1f2937/ffffff?text=User'}
                                    alt="Profile"
                                    className={styles.profilePic}
                                    onClick={() => formData.picture && setProfilePicModalOpen(true)}
                                />
                                {isOwnProfile && (
                                    <button className={styles.editPictureButton} onClick={() => setAvatarModalOpen(true)}>
                                        <Camera size={16} />
                                    </button>
                                )}
                            </div>
                            <h3>{profileData.name}</h3>
                            <p>{profileData.email}</p>
                        </div>
                        <nav className={styles.nav}>
                            <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? styles.active : ''}>
                                <User size={18} /> Profile
                            </button>
                            <button onClick={() => setActiveTab('security')} className={activeTab === 'security' ? styles.active : ''}>
                                <Shield size={18} /> Security
                            </button>
                            <button onClick={() => setActiveTab('devices')} className={activeTab === 'devices' ? styles.active : ''}>
                                <Monitor size={18} /> Devices
                            </button>
                        </nav>
                        <div className={styles.sidebarFooter}>
                            <button onClick={() => navigate('/home')}>
                                <ChevronLeft size={18} /> Back to Home
                            </button>
                            <button onClick={logout}>
                                <LogOut size={18} /> Logout
                            </button>
                        </div>
                    </aside>
                    <main className={styles.content}>
                        {renderContent()}
                    </main>
                </div>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
            />
        </>
    );
};

const ProfileSettings = ({ formData, setFormData, handleChange, handleSubmit }) => {
    const [isGenderDropdownOpen, setGenderDropdownOpen] = useState(false);
    const genderDropdownRef = useRef(null);

    const genderOptions = [
        { value: 'male', label: 'Male', icon: <Mars size={18} /> },
        { value: 'female', label: 'Female', icon: <Venus size={18} /> },
        { value: 'other', label: 'Other', icon: <Transgender size={18} /> },
        { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: <User size={18} /> },
    ];

    const GenderIcon = ({ gender }) => {
        const option = genderOptions.find(opt => opt.value === gender);
        return option ? <span className={styles.genderIcon}>{option.icon}</span> : <span className={styles.genderIcon}><User size={18} /></span>;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target)) {
                setGenderDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleGenderSelect = (genderValue) => {
        setFormData(prev => ({ ...prev, gender: genderValue }));
        setGenderDropdownOpen(false);
    };

    const selectedGender = genderOptions.find(opt => opt.value === formData.gender);

    return (
        <div className={styles.contentSection}>
            <h2>Profile Settings</h2>
            <p>Update your personal information.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="name">Full Name</label>
                    <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" name="email" value={formData.email || ''} disabled />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="dob">Date of Birth</label>
                    <input id="dob" type="date" name="dob" value={formData.dob || ''} onChange={handleChange} />
                </div>
                <div className={styles.inputGroup} ref={genderDropdownRef}>
                    <label>Gender</label>
                    <div className={styles.customSelectContainer}>
                        <button
                            type="button"
                            className={styles.selectTrigger}
                            onClick={() => setGenderDropdownOpen(!isGenderDropdownOpen)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <GenderIcon gender={formData.gender} />
                                <span>{selectedGender ? selectedGender.label : 'Select Gender'}</span>
                            </div>
                            <div className={`${styles.arrow} ${isGenderDropdownOpen ? styles.arrowUp : ''}`}></div>
                        </button>
                        {isGenderDropdownOpen && (
                            <div className={styles.optionsContainer}>
                                {genderOptions.map(option => (
                                    <div
                                        key={option.value}
                                        className={styles.optionItem}
                                        onClick={() => handleGenderSelect(option.value)}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <button type="submit" className={styles.saveButton}>
                    <Save size={18} /> Save Changes
                </button>
            </form>
        </div>
    )
};

const SecuritySettings = ({ user }) => {
    const { changePassword, forgotPassword } = useAuthStore();
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            showErrorToast("New passwords do not match.");
            return;
        }
        if (!passwords.newPassword) {
            showErrorToast("New password cannot be empty.");
            return;
        }
        const success = await changePassword({
            currentPassword: passwords.currentPassword,
            newPassword: passwords.newPassword
        });
        if (success) {
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    };

    const handleForgotPassword = () => {
        if (user && user.email) {
            forgotPassword(user.email);
        } else {
            showErrorToast("User email not found.");
        }
    };

    return (
        <div className={styles.contentSection}>
            <h2>Security</h2>
            <p>Change your password.</p>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="currentPassword">Current Password</label>
                    <input id="currentPassword" type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="newPassword">New Password</label>
                    <input id="newPassword" type="password" name="newPassword" value={passwords.newPassword} onChange={handleChange} />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input id="confirmPassword" type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleChange} />
                </div>
                <button type="submit" className={styles.saveButton}>
                    <Key size={18} /> Change Password
                </button>
                <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} className={styles.forgotPassword}>Forgot Password?</a>
                </p>
            </form>
        </div>
    );
};

const DeviceManager = () => {
    const { fetchDevices, logoutDevice, user } = useAuthStore();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDevices = async () => {
            try {
                const data = await fetchDevices(user?._id);
                if (data) {
                    setDevices(data);
                }
            } catch (err) {
                console.error("Failed to fetch devices", err);
            } finally {
                setLoading(false);
            }
        };

        loadDevices();
    }, [fetchDevices]);

    const handleLogoutDevice = async (deviceId) => {
        try {
            const success = await logoutDevice(deviceId);
            if (success) {
                setDevices(prev => prev.filter(d => d.id !== deviceId));
            }
        } catch (err) {
            console.error("Failed to logout device", err);
        }
    };

    if (loading) {
        return <div className={styles.loading}>Loading devices...</div>;
    }

    return (
        <div className={styles.contentSection}>
            <h2>Device Management</h2>
            <p>You are logged in to these devices. You can log out from any of them.</p>
            <div className={styles.deviceList}>
                {devices.length > 0 ? (
                    devices.map(device => (
                        <div key={device.id} className={styles.deviceItem}>
                            <Monitor size={32} />
                            <div className={styles.deviceInfo}>
                                <strong>{device.browser} on {device.os}</strong>
                                <span>{device.location} • {device.lastActive}</span>
                            </div>
                            {device.isCurrent ? (
                                <span className={styles.currentDevice}>Current device</span>
                            ) : (
                                <button
                                    className={styles.logoutButton}
                                    onClick={() => handleLogoutDevice(device.id)}
                                >
                                    Log out
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No devices found.</p>
                )}
            </div>
        </div>
    );
};

const AvatarGallery = ({ currentAvatar, onSelect, onClose, onUploadClick }) => {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}><X size={24} /></button>
                <h3>Choose Your Avatar</h3>
                <div className={styles.avatarPicker}>
                    <div className={styles.avatarPickerHeader}>
                        <div className={styles.currentAvatarDisplay}>
                            <img src={currentAvatar || 'https://placehold.co/128x128/1f2937/ffffff?text=User'} alt="Current Avatar" />
                            <span>Current</span>
                        </div>
                        <button className={styles.uploadTile} onClick={onUploadClick}>
                            <Upload size={24} />
                            <span>Upload</span>
                        </button>
                    </div>

                    <div className={styles.avatarSectionsContainer}>
                        {profileAvatars.profilPics.map(category => (
                            <div key={category.type} className={styles.avatarSection}>
                                <h4 className={styles.avatarSectionTitle}>{category.type}</h4>
                                <div className={styles.avatarGrid}>
                                    {category.avatars.map(avatar => (
                                        <div key={avatar.url} className={styles.avatarTile} onClick={() => onSelect(avatar.url)}>
                                            <img src={avatar.url} alt={avatar.name || 'avatar'} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default ProfilePage;
