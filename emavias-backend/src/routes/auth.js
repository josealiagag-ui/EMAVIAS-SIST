const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const payload = { id: user.id, username: user.username, name: user.name, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.json({
    message: 'Login exitoso',
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role }
  });
});

// GET /api/auth/me - verify token and return current user
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  res.json({ message: 'Logout exitoso' });
});

module.exports = router;
