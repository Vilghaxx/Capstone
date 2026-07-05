import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/BookAppointment.module.css';

const APPOINTMENT_TYPES = ['checkup', 'cleaning', 'filling', 'extraction', 'consultation', 'root-canal', 'crown'];

const BookAppointment = () => {
  const { user, isPatient } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: '',
    time: '',
    type: 'checkup',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPatient) {
      navigate('/dashboard');
    }
  }, [isPatient, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dateTime = new Date(`${form.date}T${form.time || '09:00'}`);
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          date: dateTime.toISOString(),
          time: form.time,
          type: form.type,
          notes: form.notes
        })
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <h2>Request Submitted!</h2>
          <p>Your appointment request is pending approval. A staff member will confirm your appointment soon.</p>
          <div className={styles.successActions}>
            <button className={styles.btn} onClick={() => navigate('/my-appointments')}>
              View My Appointments
            </button>
            <button className={styles.btnOutline} onClick={() => { setSuccess(false); setForm({ date: '', time: '', type: 'checkup', notes: '' }); }}>
              Request Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bookingBox}>
        <h1>Request an Appointment</h1>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="date">Preferred Date</label>
            <input id="date" name="date" type="date" value={form.date} onChange={handleChange} min={getMinDate()} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="time">Preferred Time</label>
            <input id="time" name="time" type="time" value={form.time} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="type">Appointment Type</label>
            <select id="type" name="type" value={form.type} onChange={handleChange}>
              {APPOINTMENT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={4} placeholder="Any additional information..." />
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Submitting...' : 'Request Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
