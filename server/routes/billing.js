const express = require('express');
const { db } = require('../firebase/admin');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, patientId } = req.query;
    const treatmentsRef = db.ref('treatments');
    const patientsRef = db.ref('patients');
    
    const [treatmentsSnap, patientsSnap] = await Promise.all([
      treatmentsRef.once('value'),
      patientsRef.once('value')
    ]);
    
    const patients = patientsSnap.exists() ? patientsSnap.val() : {};
    
    let treatments = [];
    if (treatmentsSnap.exists()) {
      const data = treatmentsSnap.val();
      treatments = Object.entries(data).map(([id, treatment]) => {
        const patient = patients[treatment.patientId] || {};
        return {
          id,
          ...treatment,
          patientName: patient.name || 'Unknown',
          patientPhone: patient.phone || ''
        };
      });
      
      if (patientId) {
        treatments = treatments.filter(t => t.patientId === patientId);
      }
      
      if (status === 'paid') {
        treatments = treatments.filter(t => t.paid);
      } else if (status === 'unpaid') {
        treatments = treatments.filter(t => !t.paid);
      }
      
      treatments.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    
    res.json(treatments);
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const treatmentsRef = db.ref('treatments');
    const patientRef = db.ref(`patients/${patientId}`);
    
    const [treatmentsSnap, patientSnap] = await Promise.all([
      treatmentsRef.orderByChild('patientId').equalTo(patientId).once('value'),
      patientRef.once('value')
    ]);
    
    const patient = patientSnap.exists() ? patientSnap.val() : {};
    
    let treatments = [];
    if (treatmentsSnap.exists()) {
      const data = treatmentsSnap.val();
      treatments = Object.entries(data).map(([id, treatment]) => ({
        id,
        ...treatment
      }));
      treatments.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    
    const totalCost = treatments.reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0);
    const paidAmount = treatments.filter(t => t.paid).reduce((sum, t) => sum + (parseFloat(t.cost) || 0), 0);
    
    res.json({
      patient: { id: patientId, ...patient },
      treatments,
      summary: {
        totalTreatments: treatments.length,
        totalCost,
        paidAmount,
        unpaidAmount: totalCost - paidAmount
      }
    });
  } catch (error) {
    console.error('Get patient billing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:treatmentId/pay', authenticateToken, async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    
    const treatmentRef = db.ref(`treatments/${treatmentId}`);
    const snapshot = await treatmentRef.once('value');
    
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Treatment not found' });
    }
    
    const treatment = snapshot.val();
    const paymentAmount = parseFloat(amount) || parseFloat(treatment.cost) || 0;
    
    const paymentData = {
      paid: true,
      paidAt: Date.now(),
      paidBy: req.user.id,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      paidAmount: paymentAmount
    };
    
    await treatmentRef.update(paymentData);
    
    res.json({ id: treatmentId, ...paymentData, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const treatmentsRef = db.ref('treatments');
    const snapshot = await treatmentsRef.once('value');
    
    let totalRevenue = 0;
    let collectedRevenue = 0;
    let treatmentCount = 0;
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.values(data).forEach(treatment => {
        const cost = parseFloat(treatment.cost) || 0;
        totalRevenue += cost;
        treatmentCount++;
        if (treatment.paid) {
          collectedRevenue += treatment.paidAmount || cost;
        }
      });
    }
    
    res.json({
      totalRevenue,
      collectedRevenue,
      unpaidRevenue: totalRevenue - collectedRevenue,
      treatmentCount
    });
  } catch (error) {
    console.error('Get billing summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
