import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import styles from '../styles/Profile.module.css';
import { User, Mail, Calendar, Key, Save, Edit, Camera, Trash2, X, Mars, Venus, Transgender } from 'lucide-react';
import ImageCropper from '../components/ImageCropper';

const ProfilePage = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    const { user, fetchProfile, updateProfile } = useAuthStore();
    const [profileData, setProfileData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
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
        return option ? option.icon : <User size={18} />;
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

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfile(profileId);
            if (data) {
                setProfileData({
                    ...data,
                    dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : ''
                });
                setIsOwnProfile(user?._id === data._id);
            } else {
                navigate('/home');
            }
        };
        loadProfile();
    }, [profileId, user, fetchProfile, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenderSelect = (genderValue) => {
        setProfileData(prev => ({ ...prev, gender: genderValue }));
        setGenderDropdownOpen(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageToCrop(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleCropComplete = (croppedImage) => {
        setProfileData(prev => ({ ...prev, picture: croppedImage }));
        setImageToCrop(null);
    };

    const handleRemovePicture = () => {
        setProfileData(prev => ({ ...prev, picture: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await updateProfile(profileId, profileData);
        if (success) {
            setIsEditing(false);
        }
    };

    if (!profileData) {
        return <div className={styles.loading}>Loading...</div>;
    }

    const selectedGender = genderOptions.find(opt => opt.value === profileData.gender);

    return (
        <>
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setImageToCrop(null)}
                />
            )}
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.profilePicContainer}>
                            <img
                                src={profileData.picture || 'https://placehold.co/128x128/1f2937/ffffff?text=User'}
                                alt="Profile"
                                className={styles.profilePic}
                                onClick={() => profileData.picture && setIsModalOpen(true)}
                            />
                            {isOwnProfile && isEditing && (
                                <div className={styles.editPictureActions}>
                                    <label htmlFor="profilePicUpload" className={styles.cameraIcon}>
                                        <Camera size={20} />
                                        <input
                                            id="profilePicUpload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {profileData.picture && (
                                        <button onClick={handleRemovePicture} className={styles.removeButton}>
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <h1 className={styles.name}>{profileData.name}</h1>
                        <p className={styles.email}>{profileData.email}</p>
                        {isOwnProfile && (
                            <button onClick={() => setIsEditing(!isEditing)} className={styles.editButton}>
                                {isEditing ? 'Cancel' : <><Edit size={16} /> Edit Profile</>}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <User size={18} />
                            <input
                                type="text"
                                name="name"
                                value={profileData.name}
                                onChange={handleChange}
                                disabled={!isEditing}
                                placeholder="Full Name"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <Mail size={18} />
                            <input
                                type="email"
                                name="email"
                                value={profileData.email}
                                disabled
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <Calendar size={18} />
                            <input
                                type="date"
                                name="dob"
                                value={profileData.dob}
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                        </div>
                        <div className={styles.inputGroup} ref={genderDropdownRef}>
                            <div className={styles.customSelectContainer}>
                                <button
                                    type="button"
                                    className={`${styles.selectTrigger} ${!isEditing ? styles.disabled : ''}`}
                                    onClick={() => isEditing && setGenderDropdownOpen(!isGenderDropdownOpen)}
                                    disabled={!isEditing}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <GenderIcon gender={profileData.gender} />
                                        <span>{selectedGender ? selectedGender.label : 'Select Gender'}</span>
                                    </div>
                                    <div className={styles.arrow}></div>
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

                        {isEditing && (
                            <>
                                <div className={styles.inputGroup}>
                                    <Key size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        onChange={handleChange}
                                        placeholder="New Password (optional)"
                                    />
                                </div>
                                <button type="submit" className={styles.saveButton}>
                                    <Save size={18} /> Save Changes
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                            <X size={24} />
                        </button>
                        <img src={profileData.picture} alt="Profile Preview" className={styles.modalImage} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ProfilePage;