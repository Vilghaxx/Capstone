const express = require('express');
const { db } = require('../firebase/admin');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { date, status } = req.query;
    const appointmentsRef = db.ref('appointments');
    const snapshot = await appointmentsRef.once('value');
    
    let appointments = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      appointments = Object.entries(data).map(([id, appointment]) => ({
        id,
        ...appointment
      }));
      appointments.sort((a, b) => (b.date || 0) - (a.date || 0));

      if (req.user.role === 'patient') {
        appointments = appointments.filter(a => a.patientId === req.user.patientRef);
      }
      
      if (date) {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        appointments = appointments.filter(a => 
          a.date >= startOfDay && a.date <= endOfDay
        );
      }
      
      if (status) {
        appointments = appointments.filter(a => a.status === status);
      }
    }
    
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const appointmentRef = db.ref(`appointments/${id}`);
    const snapshot = await appointmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointment = { id, ...snapshot.val() };

    if (req.user.role === 'patient' && appointment.patientId !== req.user.patientRef) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { patientId, date, type, time, notes } = req.body;

    let appointmentPatientId = patientId;

    if (req.user.role === 'patient') {
      if (!req.user.patientRef) {
        return res.status(400).json({ error: 'Patient profile not found' });
      }
      appointmentPatientId = req.user.patientRef;
    } else if (req.user.role === 'dentist' || req.user.role === 'cashier') {
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const appointmentsRef = db.ref('appointments');
    const newAppointmentRef = appointmentsRef.push();
    const appointmentId = newAppointmentRef.key;
    
    const initialStatus = 'pending';

    const appointmentData = {
      patientId: appointmentPatientId,
      date: new Date(date).getTime(),
      time: time || '',
      type: type || 'checkup',
      status: initialStatus,
      notes: notes || '',
      createdAt: Date.now(),
      createdBy: req.user.id
    };

    await newAppointmentRef.set(appointmentData);

    const patientRef = db.ref(`patients/${appointmentPatientId}`);
    const patientSnapshot = await patientRef.once('value');
    if (patientSnapshot.exists()) {
      appointmentData.patientName = patientSnapshot.val().name;
    }

    res.status(201).json({ id: appointmentId, ...appointmentData });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, type, status, notes } = req.body;

    if (req.user.role === 'patient') {
      return res.status(403).json({ error: 'Patients cannot update appointments' });
    }

    if (req.user.role === 'cashier' && status && !['pending', 'scheduled', 'completed', 'cancelled', 'no-show'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const appointmentRef = db.ref(`appointments/${id}`);
    const snapshot = await appointmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const validStatuses = ['pending', 'scheduled', 'completed', 'cancelled', 'no-show'];
    const updateData = {
      ...(date && { date: new Date(date).getTime() }),
      ...(time !== undefined && { time }),
      ...(type && { type }),
      ...(status && validStatuses.includes(status) ? { status } : {}),
      ...(notes !== undefined && { notes }),
      updatedAt: Date.now()
    };

    await appointmentRef.update(updateData);
    res.json({ id, message: 'Appointment updated successfully' });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const appointmentRef = db.ref(`appointments/${id}`);
    const snapshot = await appointmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await appointmentRef.remove();
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
