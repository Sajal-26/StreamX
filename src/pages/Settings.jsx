import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from '../styles/Profile.module.css';
import { User, Key, Save, Camera, X, Shield, Monitor, LogOut, Upload, ChevronLeft, Mars, Venus, Transgender, Trash2, AlertTriangle } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';
import profileAvatars from '../assets/profileData.json';
import { showErrorToast } from '../components/Toast';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#e50914',
    },
    background: {
      paper: '#1c1c1e',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#2e2e32',
            },
            '&:hover fieldset': {
              borderColor: '#b91c1c',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#dc2626',
            },
          },
        },
      },
    },
  },
});

const Settings = () => {
    const navigate = useNavigate();
    const { user, fetchProfile, updateProfile, logout, deleteAccount } = useAuthStore();

    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('profile');

    const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
    const [isProfilePicModalOpen, setProfilePicModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfile(user._id);
            if (data) {
                const formattedData = {
                    ...data,
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
                };
                setProfileData(formattedData);
                setFormData(formattedData);
            } else {
                logout();
                navigate('/auth');
            }
        };
        if (user?._id) {
            loadProfile();
        }
    }, [user, fetchProfile, navigate, logout]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProfile(user._id, formData);
        if (success) {
            const data = await fetchProfile(user._id);
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

    const handleConfirmDelete = async () => {
        await deleteAccount();
        setDeleteModalOpen(false);
        // Note: handle navigation/logout after deletion
        // inside your useAuthStore's deleteAccount function.
    };

    if (!profileData) {
        return null;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings 
                            formData={formData} 
                            setFormData={setFormData} 
                            handleChange={handleChange} 
                            handleSubmit={handleSubmit}
                            onDeleteClick={() => setDeleteModalOpen(true)} 
                        />;
            case 'security':
                return <SecuritySettings user={profileData} />;
            case 'devices':
                return <DeviceManager />;
            default:
                return <ProfileSettings 
                            formData={formData} 
                            setFormData={setFormData} 
                            handleChange={handleChange} 
                            handleSubmit={handleSubmit}
                            onDeleteClick={() => setDeleteModalOpen(true)}
                        />;
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
            {isDeleteModalOpen && (
                <DeleteConfirmationModal 
                    onClose={() => setDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                />
            )}

            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <aside className={styles.sidebar}>
                        <div className={styles.profileHeader}>
                            <div className={styles.profilePicContainer}>
                                <img
                                    src={formData.picture || 'https://occ-0-4995-2164.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW7Wui3ZqHqBvl3R__TmY0sDZF-xBxJJinhVWRwu7OmYkF2bdwH4nqfnyT3YQ-JshQvap33bDbRLACSoadpKwbIQIBktdtHjxw.png?r=201'}
                                    alt="Profile"
                                    className={styles.profilePic}
                                    onClick={() => formData.picture && setProfilePicModalOpen(true)}
                                />
                                <button className={styles.editPictureButton} onClick={() => setAvatarModalOpen(true)}>
                                    <Camera size={16} />
                                </button>
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

const ProfileSettings = ({ formData, setFormData, handleChange, handleSubmit, onDeleteClick }) => {
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
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <ThemeProvider theme={darkTheme}>
                            <DatePicker
                                label="Date of Birth"
                                value={formData.dob ? dayjs(formData.dob) : null}
                                onChange={(newValue) => {
                                    setFormData(prev => ({ ...prev, dob: newValue ? newValue.format('YYYY-MM-DD') : '' }));
                                }}
                                views={['year', 'month', 'day']}
                                maxDate={dayjs()}
                                slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                            />
                        </ThemeProvider>
                    </LocalizationProvider>
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
            <div className={styles.dangerZone}>
                <h3 className={styles.dangerZoneTitle}>Danger Zone</h3>
                <div className={styles.dangerZoneContent}>
                    <p>Deleting your account is a permanent action and cannot be undone.</p>
                    <button onClick={onDeleteClick} className={styles.deleteButton}>
                        <Trash2 size={18} /> Delete My Account
                    </button>
                </div>
            </div>
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
            if (!user?._id) return;
            setLoading(true);
            try {
                const data = await fetchDevices(user._id);
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
    }, [fetchDevices, user?._id]);

    const handleLogoutDevice = async (deviceId) => {
        const success = await logoutDevice(deviceId);
        if (success) {
            setDevices(prev => prev.filter(d => d.id !== deviceId));
        }
    };

    if (loading) {
        return null;
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
                    <p>No active sessions found.</p>
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
                            <img src={currentAvatar || 'https://occ-0-4995-2164.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW7Wui3ZqHqBvl3R__TmY0sDZF-xBxJJinhVWRwu7OmYkF2bdwH4nqfnyT3YQ-JshQvap33bDbRLACSoadpKwbIQIBktdtHjxw.png?r=201'} alt="Current Avatar" />
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

const DeleteConfirmationModal = ({ onClose, onConfirm }) => {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.confirmationModalContent} onClick={e => e.stopPropagation()}>
                <AlertTriangle size={48} color="#f87171" />
                <h3>Are you sure?</h3>
                <p>This action is irreversible. All your data will be permanently deleted.</p>
                <div className={styles.confirmationModalActions}>
                    <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
                    <button onClick={onConfirm} className={styles.confirmButton}>Delete Account</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;