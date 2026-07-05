import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, apiFetch } from '../context/AuthContext';
import InteractiveDentalChart from '../components/InteractiveDentalChart';
import ToothModal from '../components/ToothModal';
import styles from '../styles/PatientProfile.module.css';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDentist } = useAuth();
  const [patient, setPatient] = useState(null);
  const [teeth, setTeeth] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState(null);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    try {
      const [patientData, teethData] = await Promise.all([
        apiFetch(`/patients/${id}`),
        apiFetch(`/teeth/${id}`)
      ]);
      setPatient(patientData);
      setTeeth(teethData);
    } catch (error) {
      console.error('Failed to load patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToothClick = (toothNumber) => {
    if (isDentist) {
      setSelectedTooth(toothNumber);
    }
  };

  const handleToothUpdate = () => {
    loadPatientData();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return <div className={styles.loading}>Loading patient...</div>;
  }

  if (!patient) {
    return <div className={styles.error}>Patient not found</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => navigate('/patients')}>
        ← Back to Patients
      </button>

      <div className={styles.profile}>
        <div className={styles.info}>
          <h1>{patient.name}</h1>
          <div className={styles.details}>
            <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {patient.email || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> {patient.dateOfBirth || 'N/A'}</p>
            <p><strong>Address:</strong> {patient.address || 'N/A'}</p>
            <p><strong>Added:</strong> {formatDate(patient.createdAt)}</p>
          </div>
          {patient.notes && (
            <div className={styles.notes}>
              <strong>Notes:</strong>
              <p>{patient.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.chart}>
          <h2>Dental Chart</h2>
          {isDentist ? (
            <p className={styles.hint}>Click on a tooth to view details and add treatments</p>
          ) : (
            <p className={styles.hint}>Click on a tooth to view treatment history</p>
          )}
          <InteractiveDentalChart
            teeth={teeth}
            onToothClick={handleToothClick}
            selectedTooth={selectedTooth}
          />
        </div>
      </div>

      {selectedTooth && (
        <ToothModal
          patientId={id}
          toothNumber={selectedTooth}
          toothData={teeth[selectedTooth]}
          onClose={() => setSelectedTooth(null)}
          onUpdate={handleToothUpdate}
        />
      )}
    </div>
  );
};

export default PatientProfile;
