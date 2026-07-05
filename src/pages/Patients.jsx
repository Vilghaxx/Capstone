import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/Patients.module.css';

const Patients = () => {
  const { isDentist } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    address: ''
  });

  useEffect(() => {
    loadPatients();
  }, [search]);

  const loadPatients = async () => {
    try {
      const endpoint = search ? `/patients?search=${encodeURIComponent(search)}` : '/patients';
      const data = await apiFetch(endpoint);
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowAddForm(false);
      setFormData({ name: '', phone: '', email: '', dateOfBirth: '', address: '' });
      loadPatients();
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Patients</h1>
        {isDentist && (
          <button className={styles.addBtn} onClick={() => setShowAddForm(true)}>
            + Add Patient
          </button>
        )}
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name, phone, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {showAddForm && (
        <div className={styles.formCard}>
          <h2>Add New Patient</h2>
          <form onSubmit={handleAddPatient}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn}>
                Add Patient
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className={styles.empty}>
          {search ? 'No patients found matching your search' : 'No patients yet. Add your first patient!'}
        </div>
      ) : (
        <div className={styles.patientList}>
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={styles.patientCard}
              onClick={() => navigate(`/patients/${patient.id}`)}
            >
              <div className={styles.patientInfo}>
                <h3>{patient.name}</h3>
                <p>Phone: {patient.phone || 'N/A'}</p>
                <p>Email: {patient.email || 'N/A'}</p>
              </div>
              <div className={styles.patientMeta}>
                <span>Added: {formatDate(patient.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Patients;
