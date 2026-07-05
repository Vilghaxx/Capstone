import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/MyAppointments.module.css';

const MyAppointments = () => {
  const { isPatient } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPatient) {
      navigate('/dashboard');
      return;
    }
    loadAppointments();
  }, [isPatient, navigate]);

  const loadAppointments = async () => {
    try {
      const data = await apiFetch('/appointments');
      data.sort((a, b) => (b.date || 0) - (a.date || 0));
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const statusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'scheduled': 'scheduled',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no-show': 'no-show'
    };
    return labels[status] || status;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusBadge = (status) => {
    const map = {
      'pending': styles.pending,
      'scheduled': styles.scheduled,
      'completed': styles.completed,
      'cancelled': styles.cancelled,
      'no-show': styles.noshow
    };
    return `${styles.badge} ${map[status] || ''}`;
  };

  if (loading) {
    return <div className={styles.loading}>Loading appointments...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Appointments</h1>
        <Link to="/book" className={styles.bookBtn}>Request New</Link>
      </div>

      {appointments.length === 0 ? (
        <div className={styles.empty}>
          <p>No appointments found.</p>
          <Link to="/book" className={styles.bookLink}>Request your first appointment</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {appointments.map(apt => (
            <div key={apt.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.date}>{formatDate(apt.date)}</span>
                <span className={statusBadge(apt.status)}>{statusLabel(apt.status)}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.detail}>
                  <span className={styles.label}>Time</span>
                  <span>{formatTime(apt.date)}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Type</span>
                  <span className={styles.type}>{apt.type?.replace('-', ' ') || 'Checkup'}</span>
                </div>
                {apt.notes && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Notes</span>
                    <span>{apt.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
