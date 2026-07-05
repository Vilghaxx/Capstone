import styles from '../styles/Timeline.module.css';

const Timeline = ({ treatments }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '';
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  if (!treatments || treatments.length === 0) {
    return <p className={styles.empty}>No treatments recorded</p>;
  }

  return (
    <div className={styles.timeline}>
      {treatments.map((treatment, index) => (
        <div key={treatment.id} className={styles.item}>
          <div className={styles.marker}>
            <div className={styles.dot} />
            {index < treatments.length - 1 && <div className={styles.line} />}
          </div>
          
          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.procedure}>{treatment.procedure}</span>
              <span className={styles.date}>{formatDate(treatment.date)}</span>
            </div>
            
            {treatment.notes && (
              <p className={styles.notes}>{treatment.notes}</p>
            )}
            
            <div className={styles.meta}>
              {treatment.cost > 0 && (
                <span className={styles.cost}>{formatCurrency(treatment.cost)}</span>
              )}
              {treatment.dentistName && (
                <span className={styles.dentist}>by {treatment.dentistName}</span>
              )}
              {treatment.followUpDate && (
                <span className={styles.followUp}>
                  Follow-up: {formatDate(treatment.followUpDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
