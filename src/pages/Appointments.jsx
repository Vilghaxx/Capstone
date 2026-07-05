import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '../context/AuthContext';
import styles from '../styles/Appointments.module.css';

const APPOINTMENT_TYPES = ['checkup', 'cleaning', 'filling', 'extraction', 'consultation', 'root-canal', 'crown'];
const TIME_SLOTS = [];
for (let h = 8; h <= 17; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 17) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const Appointments = () => {
  const { isDentist, isCashier } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [approveForm, setApproveForm] = useState({
    date: '',
    time: '',
    type: 'checkup',
    notes: ''
  });
  const [form, setForm] = useState({
    patientId: '',
    date: '',
    time: '',
    type: 'checkup',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appts, pats] = await Promise.all([
        apiFetch('/appointments'),
        apiFetch('/patients')
      ]);
      setAppointments(appts);
      setPatients(pats);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${form.date}T${form.time || '09:00'}`);
      await apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: form.patientId,
          date: dateTime.toISOString(),
          time: form.time,
          type: form.type,
          notes: form.notes
        })
      });
      setShowForm(false);
      setForm({ patientId: '', date: '', time: '', type: 'checkup', notes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiFetch(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await apiFetch(`/appointments/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  };

  const handleApprove = (apt) => {
    const dateObj = apt.date ? new Date(apt.date) : new Date();
    setApproveForm({
      date: dateObj.toISOString().split('T')[0],
      time: apt.time || dateObj.toTimeString().slice(0, 5),
      type: apt.type || 'checkup',
      notes: apt.notes || ''
    });
    setEditingRequest(apt.id);
  };

  const handleConfirmApproval = async (id) => {
    setActionLoading(id);
    try {
      const dateTime = new Date(`${approveForm.date}T${approveForm.time || '09:00'}`);
      await apiFetch(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: dateTime.toISOString(),
          time: approveForm.time,
          type: approveForm.type,
          notes: approveForm.notes,
          status: 'scheduled'
        })
      });
      setEditingRequest(null);
      loadData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelApproval = () => {
    setEditingRequest(null);
  };

  const handleDecline = async (id) => {
    if (!window.confirm('Decline this appointment request?')) return;
    setActionLoading(id);
    try {
      await apiFetch(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' })
      });
      loadData();
    } catch (error) {
      console.error('Failed to decline request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Unknown';
  };

  const groupByDate = (appts) => {
    const groups = {};
    appts.forEach(apt => {
      const key = new Date(apt.date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    const sorted = Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].date);
      const dateB = new Date(b[1][0].date);
      return dateA - dateB;
    });
    return sorted;
  };

  const getAppointmentsForDay = (dateStr) => {
    const startOfDay = new Date(dateStr).setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr).setHours(23, 59, 59, 999);
    return appointments.filter(a => a.date >= startOfDay && a.date <= endOfDay);
  };

  const dayAppointments = getAppointmentsForDay(scheduleDate);

  if (!isDentist && !isCashier) {
    return <div className={styles.container}><p>Access denied</p></div>;
  }

  if (loading) {
    return <div className={`${styles.container} ${styles.loading}`}>Loading appointments...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Appointments</h1>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'schedule' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('schedule')}
            >
              Schedule
            </button>
            <button
              className={`${styles.toggleBtn} ${viewMode === 'requests' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('requests')}
            >
              Requests
            </button>
          </div>
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Appointment'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h2>New Appointment</h2>
          <form onSubmit={handleCreate}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Patient</label>
                <select value={form.patientId} onChange={(e) => setForm({...form, patientId: e.target.value})} required>
                  <option value="">Select patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
              </div>
              <div className={styles.formGroup}>
                <label>Time</label>
                <input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} />
              </div>
              <div className={styles.formGroup}>
                <label>Type</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  {APPOINTMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.span2}`}>
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} rows={3} />
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className={styles.submitBtn}>Create Appointment</button>
            </div>
          </form>
        </div>
      )}

      {viewMode === 'list' ? (
        appointments.length === 0 ? (
          <div className={styles.empty}>No appointments found</div>
        ) : (
          <div className={styles.timeline}>
            {groupByDate(appointments).map(([dateLabel, dayAppts]) => (
              <div key={dateLabel} className={styles.dayGroup}>
                <h3 className={styles.dateHeader}>{dateLabel}</h3>
                {dayAppts.map(apt => (
                  <div key={apt.id} className={styles.appointmentCard}>
                    <div className={styles.appointmentTime}>
                      {formatTime(apt.date)}
                    </div>
                    <div className={styles.appointmentDetails}>
                      <span className={styles.patientName}>{getPatientName(apt.patientId)}</span>
                      <span className={styles.appointmentType}>{apt.type?.replace('-', ' ')}</span>
                      {apt.notes && <p className={styles.notes}>{apt.notes}</p>}
                    </div>
                    <div className={styles.appointmentActions}>
                      <select
                        className={`${styles.statusSelect} ${styles[apt.status] || ''}`}
                        value={apt.status}
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no-show">No Show</option>
                      </select>
                      {isDentist && (
                        <button className={styles.deleteBtn} onClick={() => handleDelete(apt.id)}>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      ) : viewMode === 'requests' ? (
        <div>
          {appointments.filter(a => a.status === 'pending').length > 0 && (
            <div className={styles.requestsBanner}>
              {appointments.filter(a => a.status === 'pending').length} pending request(s)
            </div>
          )}
          {appointments.filter(a => a.status === 'pending').length === 0 ? (
            <div className={styles.empty}>No pending requests</div>
          ) : (
            <div className={styles.timeline}>
              {appointments
                .filter(a => a.status === 'pending')
                .sort((a, b) => (a.date || 0) - (b.date || 0))
                .map(apt => (
                  <div key={apt.id} className={styles.requestsCard}>
                    <div className={styles.appointmentTime}>
                      {formatDate(apt.date)} {formatTime(apt.date)}
                    </div>
                    <div className={styles.appointmentDetails}>
                      <span className={styles.patientName}>{getPatientName(apt.patientId)}</span>
                      <span className={styles.appointmentType}>{apt.type?.replace('-', ' ')}</span>
                      <span className={styles.notes}>Time: {apt.time || 'Not specified'}</span>
                      {apt.notes && <p className={styles.notes}>Notes: {apt.notes}</p>}
                    </div>
                    {editingRequest === apt.id ? (
                      <div className={styles.approveForm}>
                        <div className={styles.approveFormField}>
                          <label>Date</label>
                          <input
                            type="date"
                            value={approveForm.date}
                            onChange={(e) => setApproveForm({...approveForm, date: e.target.value})}
                          />
                        </div>
                        <div className={styles.approveFormField}>
                          <label>Time</label>
                          <input
                            type="time"
                            value={approveForm.time}
                            onChange={(e) => setApproveForm({...approveForm, time: e.target.value})}
                          />
                        </div>
                        <div className={styles.approveFormField}>
                          <label>Type</label>
                          <select
                            value={approveForm.type}
                            onChange={(e) => setApproveForm({...approveForm, type: e.target.value})}
                          >
                            {APPOINTMENT_TYPES.map(t => (
                              <option key={t} value={t}>{t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                            ))}
                          </select>
                        </div>
                        <div className={styles.approveFormField}>
                          <label>Notes</label>
                          <textarea
                            rows={2}
                            value={approveForm.notes}
                            onChange={(e) => setApproveForm({...approveForm, notes: e.target.value})}
                          />
                        </div>
                        <div className={styles.approveFormActions}>
                          <button
                            className={styles.confirmBtn}
                            onClick={() => handleConfirmApproval(apt.id)}
                            disabled={actionLoading === apt.id}
                          >
                            {actionLoading === apt.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            className={styles.declineBtn}
                            onClick={handleCancelApproval}
                            disabled={actionLoading === apt.id}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.requestsActions}>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(apt)}
                          disabled={actionLoading === apt.id}
                        >
                          {actionLoading === apt.id ? '...' : 'Approve'}
                        </button>
                        <button
                          className={styles.declineBtn}
                          onClick={() => handleDecline(apt.id)}
                          disabled={actionLoading === apt.id}
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.scheduleView}>
          <div className={styles.scheduleHeader}>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.timeGrid}>
            {TIME_SLOTS.map(slot => {
              const slotAppts = dayAppointments.filter(a => {
                const aptTime = new Date(a.date);
                const aptHour = aptTime.getHours();
                const aptMin = aptTime.getMinutes();
                const [slotH, slotM] = slot.split(':').map(Number);
                return aptHour === slotH && Math.floor(aptMin / 30) * 30 === slotM;
              });

              return (
                <div key={slot} className={styles.timeSlot}>
                  <div className={styles.slotLabel}>{slot}</div>
                  <div className={styles.slotContent}>
                    {slotAppts.length === 0 ? (
                      <span className={styles.slotEmpty}>—</span>
                    ) : (
                      slotAppts.map(apt => (
                        <div key={apt.id} className={`${styles.slotAppointment} ${styles[`slot_${apt.status}`] || ''}`}>
                          <span className={styles.slotPatient}>{getPatientName(apt.patientId)}</span>
                          <span className={styles.slotType}>{apt.type?.replace('-', ' ')}</span>
                          <select
                            className={styles.slotStatus}
                            value={apt.status}
                            onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No Show</option>
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
