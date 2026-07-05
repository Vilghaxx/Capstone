const express = require('express');
const { db } = require('../firebase/admin');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || '';
    const patientsRef = db.ref('patients');
    const snapshot = await patientsRef.once('value');
    
    let patients = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      patients = Object.entries(data).map(([id, patient]) => ({
        id,
        ...patient
      }));
      
      if (search) {
        patients = patients.filter(p => 
          p.name?.toLowerCase().includes(search) || 
          p.phone?.includes(search) ||
          p.id?.includes(search)
        );
      }
    }
    
    res.json(patients);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const patientRef = db.ref(`patients/${id}`);
    const snapshot = await patientRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ id, ...snapshot.val() });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { name, phone, email, dateOfBirth, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const patientsRef = db.ref('patients');
    const newPatientRef = patientsRef.push();
    const patientId = newPatientRef.key;
    
    const patientData = {
      name,
      phone: phone || '',
      email: email || '',
      dateOfBirth: dateOfBirth || '',
      address: address || '',
      notes: notes || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await newPatientRef.set(patientData);

    const teethRef = db.ref(`teeth/${patientId}`);
    const defaultTeeth = {};
    for (let i = 1; i <= 32; i++) {
      defaultTeeth[i] = {
        status: 'healthy',
        lastTreatment: null,
        lastTreatmentDate: null
      };
    }
    await teethRef.set(defaultTeeth);

    res.status(201).json({ id: patientId, ...patientData });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, dateOfBirth, address, notes } = req.body;
    
    const patientRef = db.ref(`patients/${id}`);
    const snapshot = await patientRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updateData = {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      updatedAt: Date.now()
    };

    await patientRef.update(updateData);
    res.json({ id, message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const patientRef = db.ref(`patients/${id}`);
    const snapshot = await patientRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await patientRef.remove();
    await db.ref(`teeth/${id}`).remove();
    
    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
