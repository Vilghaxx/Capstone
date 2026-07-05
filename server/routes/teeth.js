const express = require('express');
const { db } = require('../firebase/admin');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const teethRef = db.ref(`teeth/${patientId}`);
    const snapshot = await teethRef.once('value');
    
    if (!snapshot.exists()) {
      const defaultTeeth = {};
      for (let i = 1; i <= 32; i++) {
        defaultTeeth[i] = {
          status: 'healthy',
          lastTreatment: null,
          lastTreatmentDate: null
        };
      }
      return res.json(defaultTeeth);
    }
    
    res.json(snapshot.val());
  } catch (error) {
    console.error('Get teeth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:patientId/:toothNumber', authenticateToken, async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const toothRef = db.ref(`teeth/${patientId}/${toothNumber}`);
    const snapshot = await toothRef.once('value');
    
    if (!snapshot.exists()) {
      return res.json({
        status: 'healthy',
        lastTreatment: null,
        lastTreatmentDate: null
      });
    }
    
    res.json(snapshot.val());
  } catch (error) {
    console.error('Get tooth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:patientId/:toothNumber', authenticateToken, requireRole('dentist'), async (req, res) => {
  try {
    const { patientId, toothNumber } = req.params;
    const { status, lastTreatment, notes } = req.body;
    
    const validStatuses = ['healthy', 'treated', 'needs-attention', 'urgent'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const toothRef = db.ref(`teeth/${patientId}/${toothNumber}`);
    const updateData = {
      ...(status && { status }),
      ...(lastTreatment && { lastTreatment }),
      ...(lastTreatment && { lastTreatmentDate: Date.now() }),
      ...(notes !== undefined && { notes }),
      updatedAt: Date.now()
    };

    await toothRef.update(updateData);
    res.json({ message: 'Tooth updated successfully', ...updateData });
  } catch (error) {
    console.error('Update tooth error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
