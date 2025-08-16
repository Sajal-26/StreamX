import { useEffect, useState, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import styles from '../styles/Navbar.module.css';
import Logo from '../assets/logo.png';
import useAuthStore from '../store/useAuthStore';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [query, setQuery] = useState('');
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [hideNavbar, setHideNavbar] = useState(false);
    const lastScrollY = useRef(0);
    const searchInputRef = useRef(null);
    const profileRef = useRef(null);


    const handleLogout = async () => {
        await logout();
        navigate('/auth');
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            console.log(`Searching for: ${query}`);
            setQuery('');
            setIsSearchActive(false);
        }
    };

    const toggleSearch = () => {
        setIsSearchActive(prev => !prev);
    };

    const toggleMenu = () => {
        if (isProfileOpen) setProfileOpen(false);
        setMenuOpen(!isMenuOpen);
    };

    const toggleProfile = () => {
        if (isMenuOpen) setMenuOpen(false);
        setProfileOpen(!isProfileOpen);
    };

    useEffect(() => {
        if (isSearchActive && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchActive]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
                setHideNavbar(true);
                setProfileOpen(false);
                setMenuOpen(false);
            } else {
                setHideNavbar(false);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const navLinks = ['Home', 'Movies', 'TV', 'Animes', 'Sports'];

    const mobileMenuVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.05
            }
        },
        exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } }
    };
    
    const mobileLinkVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 },
    };

    const profileMenuVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -10 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.15 } },
        exit: { opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.1 } }
    };

    return (
        <>
            <div className={`${styles.headerWrapper} ${hideNavbar ? styles.hidden : ''}`}>
                <header className={styles.header}>
                    <div className={styles.left}>
                        <Link to="/home" className={styles.logoLink}>
                            <img src={Logo} alt="StreamX" className={styles.logo} />
                        </Link>
                    </div>

                    <nav className={styles.navCenter}>
                        {navLinks.map((label) => {
                            const path = label === 'Home' ? '/home' : `/${label.toLowerCase().replace(/\s/g, '')}`;
                            return (
                                <NavLink
                                    key={label}
                                    to={path}
                                    className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                                >
                                    {label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className={styles.right}>
                        <form onSubmit={handleSubmit} className={`${styles.searchForm} ${isSearchActive ? styles.active : ''}`}>
                             <button type="button" onClick={toggleSearch} className={styles.searchButton}>
                                <FaSearch />
                            </button>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className={styles.searchInput}
                                onBlur={() => { if(!query) setIsSearchActive(false) }}
                            />
                        </form>

                        <div className={styles.profileContainer} ref={profileRef}>
                             <button onClick={toggleProfile} className={styles.avatarButton}>
                                {user ? (
                                    <img
                                        src={user.picture || `https://occ-0-4995-2164.1.nflxso.net/dnm/api/v6/vN7bi_My87NPKvsBoib006Llxzg/AAAABW7Wui3ZqHqBvl3R__TmY0sDZF-xBxJJinhVWRwu7OmYkF2bdwH4nqfnyT3YQ-JshQvap33bDbRLACSoadpKwbIQIBktdtHjxw.png?r=201`}
                                        alt="avatar"
                                        className={styles.avatar}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}></div>
                                )}
                            </button>
                             <AnimatePresence>
                                {isProfileOpen && (
                                    <motion.div 
                                        className={styles.profileMenu}
                                        variants={profileMenuVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <Link to={`/profile/${user?._id}`} className={styles.profileMenuItem} onClick={() => setProfileOpen(false)}>Profile</Link>
                                        <Link to="/settings" className={styles.profileMenuItem} onClick={() => setProfileOpen(false)}>Settings</Link>
                                        <button onClick={handleLogout} className={styles.profileMenuItem}>Logout</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button className={styles.menuToggle} onClick={toggleMenu}>
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                        
                    </div>
                </header>
            </div>
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.nav
                        className={styles.navMobile}
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {navLinks.map((label) => {
                             const path = label === 'Home' ? '/home' : `/${label.toLowerCase().replace(/\s/g, '')}`;
                             return (
                                <motion.div key={label} variants={mobileLinkVariants}>
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) => `${styles.navItemMobile} ${isActive ? styles.active : ''}`}
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        {label}
                                    </NavLink>
                                </motion.div>
                            );
                        })}
                    </motion.nav>
                )}
            </AnimatePresence>
        </>
    );
}