import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/Billing.module.css';

const Billing = () => {
  const { isCashier, isDentist } = useAuth();
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, collectedRevenue: 0, unpaidRevenue: 0, treatmentCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [filter, setFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedPatient, filter]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPatient) params.append('patientId', selectedPatient);
      if (filter === 'paid') params.append('status', 'paid');
      if (filter === 'unpaid') params.append('status', 'unpaid');

      const [treatmentsData, patientsData, summaryData] = await Promise.all([
        apiFetch(`/billing?${params}`),
        apiFetch('/patients'),
        apiFetch('/billing/summary')
      ]);

      setTreatments(treatmentsData);
      setPatients(patientsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (treatmentId, amount, paymentMethod) => {
    try {
      await apiFetch(`/billing/${treatmentId}/pay`, {
        method: 'PUT',
        body: JSON.stringify({ amount, paymentMethod })
      });
      setShowPaymentModal(null);
      loadData();
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₱${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  if (!isCashier && !isDentist) {
    return <div className={styles.container}><p>Access denied</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Billing & Payments</h1>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Revenue</span>
          <span className={styles.summaryValue}>{formatCurrency(summary.totalRevenue)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Collected</span>
          <span className={`${styles.summaryValue} ${styles.collected}`}>{formatCurrency(summary.collectedRevenue)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Unpaid</span>
          <span className={`${styles.summaryValue} ${styles.unpaid}`}>{formatCurrency(summary.unpaidRevenue)}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Treatments</span>
          <span className={styles.summaryValue}>{summary.treatmentCount}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          className={styles.select}
        >
          <option value="">All Patients</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">All Payments</option>
          <option value="unpaid">Unpaid Only</option>
          <option value="paid">Paid Only</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading billing data...</div>
      ) : treatments.length === 0 ? (
        <div className={styles.empty}>No billing records found</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Procedure</th>
                <th>Tooth</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map(t => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>{t.patientName}</td>
                  <td>{t.procedure}</td>
                  <td>#{t.toothNumber}</td>
                  <td>{formatCurrency(t.cost)}</td>
                  <td>
                    <span className={`${styles.status} ${t.paid ? styles.paid : styles.unpaid}`}>
                      {t.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    {!t.paid && (
                      <button
                        className={styles.payBtn}
                        onClick={() => setShowPaymentModal(t)}
                      >
                        Record Payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          treatment={showPaymentModal}
          onClose={() => setShowPaymentModal(null)}
          onPay={handlePayment}
        />
      )}
    </div>
  );
};

const PaymentModal = ({ treatment, onClose, onPay }) => {
  const [amount, setAmount] = useState(treatment.cost);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Record Payment</h2>
        <div className={styles.modalContent}>
          <p><strong>Patient:</strong> {treatment.patientName}</p>
          <p><strong>Procedure:</strong> {treatment.procedure}</p>
          <p><strong>Tooth:</strong> #{treatment.toothNumber}</p>
          <p><strong>Total Cost:</strong> ₱${parseFloat(treatment.cost).toFixed(2)}</p>
        </div>

        <div className={styles.formGroup}>
          <label>Payment Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="insurance">Insurance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.confirmBtn} onClick={() => onPay(treatment.id, amount, paymentMethod)}>
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billing;
