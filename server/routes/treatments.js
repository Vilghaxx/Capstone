const express = require('express');
const { db } = require('../firebase/admin');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const treatmentsRef = db.ref('treatments');
    const snapshot = await treatmentsRef.orderByChild('patientId').equalTo(patientId).once('value');
    
    let treatments = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      treatments = Object.entries(data).map(([id, treatment]) => ({
        id,
        ...treatment
      }));
      treatments.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    
    res.json(treatments);
  } catch (error) {
    console.error('Get treatments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tooth/:patientId/:toothNumber', authenticateToken, async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const treatmentsRef = db.ref('treatments');
    const snapshot = await treatmentsRef.orderByChild('patientId').equalTo(patientId).once('value');
    
    let treatments = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      treatments = Object.entries(data)
        .map(([id, treatment]) => ({
          id,
          ...treatment
        }))
        .filter(t => t.toothNumber === parseInt(toothNumber));
      treatments.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    
    res.json(treatments);
  } catch (error) {
    console.error('Get tooth treatments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { patientId, toothNumber, procedure, notes, cost, followUpDate } = req.body;
    
    if (!patientId || !toothNumber || !procedure) {
      return res.status(400).json({ error: 'Patient ID, tooth number, and procedure are required' });
    }

    const treatmentsRef = db.ref('treatments');
    const newTreatmentRef = treatmentsRef.push();
    const treatmentId = newTreatmentRef.key;
    
    const treatmentData = {
      patientId,
      toothNumber: parseInt(toothNumber),
      procedure,
      notes: notes || '',
      cost: cost || 0,
      followUpDate: followUpDate || null,
      date: Date.now(),
      createdAt: Date.now(),
      dentistId: req.user.id,
      dentistName: req.user.name
    };

    await newTreatmentRef.set(treatmentData);

    const toothRef = db.ref(`teeth/${patientId}/${toothNumber}`);
    await toothRef.update({
      status: 'treated',
      lastTreatment: procedure,
      lastTreatmentDate: Date.now(),
      updatedAt: Date.now()
    });

    res.status(201).json({ id: treatmentId, ...treatmentData });
  } catch (error) {
    console.error('Create treatment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { id } = req.params;
    const { procedure, notes, cost, followUpDate } = req.body;
    
    const treatmentRef = db.ref(`treatments/${id}`);
    const snapshot = await treatmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Treatment not found' });
    }

    const updateData = {
      ...(procedure && { procedure }),
      ...(notes !== undefined && { notes }),
      ...(cost !== undefined && { cost }),
      ...(followUpDate !== undefined && { followUpDate }),
      updatedAt: Date.now()
    };

    await treatmentRef.update(updateData);
    res.json({ id, message: 'Treatment updated successfully' });
  } catch (error) {
    console.error('Update treatment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
