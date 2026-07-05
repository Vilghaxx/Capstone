import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../context/AuthContext';
import { STATUS_COLORS, STATUS_LABELS } from './InteractiveDentalChart';
import Timeline from './Timeline';
import styles from '../styles/Modal.module.css';

const PROCEDURES = [
  'Filling', 'Root Canal', 'Crown', 'Extraction', 'Cleaning',
  'Whitening', 'Sealant', 'Implant', 'Bridge', 'Veneer',
  'X-Ray', 'Consultation', 'Follow-up', 'Other'
];

const ToothModal = ({ patientId, toothNumber, toothData, onClose, onUpdate }) => {
  const { isDentist } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    procedure: '',
    notes: '',
    cost: '',
    followUpDate: ''
  });

  useEffect(() => {
    loadTreatments();
  }, [patientId, toothNumber]);

  const loadTreatments = async () => {
    try {
      const data = await apiFetch(`/treatments/tooth/${patientId}/${toothNumber}`);
      setTreatments(data);
    } catch (error) {
      console.error('Failed to load treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiFetch(`/teeth/${patientId}/${toothNumber}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAddTreatment = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/treatments', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          toothNumber,
          ...formData,
          cost: parseFloat(formData.cost) || 0
        })
      });
      setShowAddForm(false);
      setFormData({ procedure: '', notes: '', cost: '', followUpDate: '' });
      loadTreatments();
      onUpdate?.();
    } catch (error) {
      console.error('Failed to add treatment:', error);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Tooth #{toothNumber}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Status</h3>
            <div className={styles.statusGrid}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  className={`${styles.statusBtn} ${toothData?.status === value ? styles.active : ''}`}
                  style={{ 
                    background: toothData?.status === value ? STATUS_COLORS[value] : '#f5f5f5',
                    color: toothData?.status === value ? 'white' : '#666'
                  }}
                  onClick={() => isDentist && handleStatusChange(value)}
                  disabled={!isDentist}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3>Treatment History</h3>
            {loading ? (
              <p className={styles.loading}>Loading...</p>
            ) : treatments.length === 0 ? (
              <p className={styles.empty}>No treatments recorded</p>
            ) : (
              <Timeline treatments={treatments} />
            )}
          </div>

          {isDentist && (
            <div className={styles.section}>
              {!showAddForm ? (
                <button 
                  className={styles.addBtn}
                  onClick={() => setShowAddForm(true)}
                >
                  + Add Treatment
                </button>
              ) : (
                <form onSubmit={handleAddTreatment} className={styles.form}>
                  <h3>New Treatment</h3>
                  
                  <div className={styles.formGroup}>
                    <label>Procedure *</label>
                    <select
                      value={formData.procedure}
                      onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                      required
                    >
                      <option value="">Select procedure</option>
                      {PROCEDURES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Clinical notes..."
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Cost (₱)</label>
                      <input
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Follow-up Date</label>
                      <input
                        type="date"
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                      Save Treatment
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToothModal;
