const express = require('express');
const bcrypt = require('bcryptjs');
const adminModule = require('../firebase/admin');
const db = adminModule.db;
const { generateToken, authenticateToken } = require('../middleware/auth');

console.log('Auth routes loaded, db:', db ? 'defined' : 'undefined');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    let userData = null;
    let userId = null;

    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const key of Object.keys(users)) {
        if (users[key].username === username) {
          userId = key;
          userData = users[key];
          break;
        }
      }
    }

    if (!userData) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: userId,
      username: userData.username,
      role: userData.role,
      name: userData.name,
      patientRef: userData.patientRef || null
    });

    res.json({
      token,
      user: {
        id: userId,
        username: userData.username,
        role: userData.role,
        name: userData.name,
        patientRef: userData.patientRef || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email, phone } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    let duplicateFound = false;
    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const key of Object.keys(users)) {
        if (users[key].username === username) {
          duplicateFound = true;
          break;
        }
      }
    }
    if (duplicateFound) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const patientsRef = db.ref('patients');
    const newPatientRef = patientsRef.push();
    const patientId = newPatientRef.key;

    await newPatientRef.set({
      name,
      email: email || '',
      phone: phone || '',
      createdAt: Date.now()
    });

    const newUserRef = usersRef.push();
    const userId = newUserRef.key;

    await newUserRef.set({
      username,
      password: hashedPassword,
      role: 'patient',
      name,
      patientRef: patientId,
      createdAt: Date.now()
    });

    const token = generateToken({
      id: userId,
      username,
      role: 'patient',
      name,
      patientRef: patientId
    });

    res.status(201).json({
      token,
      user: {
        id: userId,
        username,
        role: 'patient',
        name,
        patientRef: patientId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/seed', async (req, res) => {
  try {
    const hashedDentist = await bcrypt.hash('dentist123', 10);
    const hashedCashier = await bcrypt.hash('cashier123', 10);

    const usersRef = db.ref('users');
    await usersRef.set({
      dentist: {
        username: 'dentist',
        password: hashedDentist,
        role: 'dentist',
        name: 'Dr. Smith'
      },
      cashier: {
        username: 'cashier',
        password: hashedCashier,
        role: 'cashier',
        name: 'Jane Doe'
      }
    });

    res.json({ message: 'Users seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
