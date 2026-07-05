const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const teethRoutes = require('./routes/teeth');
const treatmentsRoutes = require('./routes/treatments');
const appointmentsRoutes = require('./routes/appointments');
const billingRoutes = require('./routes/billing');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/teeth', teethRoutes);
app.use('/api/treatments', treatmentsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
