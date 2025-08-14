import styles from '../styles/Loader.module.css';

const Loader = () => {
  return (
    <div className={styles.loaderOverlay}>
      <svg className={styles.spinner} viewBox="0 0 100 100">
        <circle
          className={styles.path}
          cx="50"
          cy="50"
          r="45"
          strokeDasharray="226 283"
        />
      </svg>
    </div>
  );
};

export default Loader;
