import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const { user, isDentist, isCashier, isPatient } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patients: 0, appointments: 0, treatments: 0 });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (isPatient) {
        const appointments = await apiFetch('/appointments');
        setStats({ patients: 0, appointments: appointments.length, treatments: 0 });
        const upcoming = appointments
          .filter(a => a.status === 'scheduled' || a.status === 'pending')
          .sort((a, b) => (b.date || 0) - (a.date || 0))
          .slice(0, 5);
        setRecentAppointments(upcoming);
        return;
      }

      const [patients, appointments] = await Promise.all([
        apiFetch('/patients'),
        apiFetch('/appointments')
      ]);

      setStats({
        patients: patients.length,
        appointments: appointments.length,
        treatments: 0
      });

      const upcoming = appointments
        .filter(a => a.status === 'scheduled')
        .sort((a, b) => a.date - b.date)
        .slice(0, 5);
      setRecentAppointments(upcoming);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h1>Welcome, {user?.name}</h1>
        <p>Role: {user?.role}</p>
      </div>

      <div className={styles.stats}>
        {!isPatient && (
          <div className={styles.statCard} onClick={() => navigate('/patients')}>
            <span className={styles.statNumber}>{stats.patients}</span>
            <span className={styles.statLabel}>Patients</span>
          </div>
        )}
        {(isDentist || isCashier) && (
          <div className={styles.statCard} onClick={() => navigate('/appointments')}>
            <span className={styles.statNumber}>{stats.appointments}</span>
            <span className={styles.statLabel}>Appointments</span>
          </div>
        )}
        {isPatient && (
          <div className={styles.statCard} onClick={() => navigate('/my-appointments')}>
            <span className={styles.statNumber}>{stats.appointments}</span>
            <span className={styles.statLabel}>Appointments</span>
          </div>
        )}
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actions}>
          {!isPatient && (
            <button className={styles.actionBtn} onClick={() => navigate('/patients')}>
              View Patients
            </button>
          )}
          {(isDentist || isCashier) && (
            <button className={styles.actionBtn} onClick={() => navigate('/appointments')}>
              Manage Appointments
            </button>
          )}
          {isPatient && (
            <>
              <button className={styles.actionBtn} onClick={() => navigate('/book')}>
                Request Appointment
              </button>
              <button className={styles.actionBtn} onClick={() => navigate('/my-appointments')}>
                My Appointments
              </button>
            </>
          )}
        </div>
      </div>

      {recentAppointments.length > 0 && (
        <div className={styles.upcoming}>
          <h2>Upcoming Appointments</h2>
          <div className={styles.appointmentList}>
            {recentAppointments.map((apt) => (
              <div key={apt.id} className={styles.appointmentItem}>
                <div className={styles.appointmentDate}>
                  {formatDate(apt.date)}
                </div>
                <div className={styles.appointmentInfo}>
                  <span className={styles.appointmentType}>{apt.type}</span>
                  {!isPatient && (
                    <span className={styles.appointmentPatient}>Patient ID: {apt.patientId}</span>
                  )}
                </div>
                <span className={`${styles.status} ${styles[apt.status]}`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
