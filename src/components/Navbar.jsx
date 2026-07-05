import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.css';

const Navbar = () => {
  const { user, logout, isDentist, isCashier, isPatient } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.icon}>🦷</span>
        <span className={styles.title}>Dental System</span>
      </div>
      
      <div className={styles.links}>
        <Link 
          to="/dashboard" 
          className={`${styles.link} ${location.pathname === '/dashboard' ? styles.active : ''}`}
        >
          Dashboard
        </Link>
        {(isDentist || isCashier) && (
          <Link 
            to="/patients" 
            className={`${styles.link} ${location.pathname.startsWith('/patients') ? styles.active : ''}`}
          >
            Patients
          </Link>
        )}
        {(isDentist || isCashier) && (
          <Link 
            to="/billing" 
            className={`${styles.link} ${location.pathname === '/billing' ? styles.active : ''}`}
          >
            Billing
          </Link>
        )}
        {(isDentist || isCashier) && (
          <Link 
            to="/appointments" 
            className={`${styles.link} ${location.pathname === '/appointments' ? styles.active : ''}`}
          >
            Appointments
          </Link>
        )}
        {isPatient && (
          <>
            <Link 
              to="/book" 
              className={`${styles.link} ${location.pathname === '/book' ? styles.active : ''}`}
            >
              Request Appointment
            </Link>
            <Link 
              to="/my-appointments" 
              className={`${styles.link} ${location.pathname === '/my-appointments' ? styles.active : ''}`}
            >
              My Appointments
            </Link>
          </>
        )}
      </div>

      <div className={styles.userSection}>
        <span className={styles.userInfo}>
          {user?.name} <span className={styles.role}>({user?.role})</span>
        </span>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
