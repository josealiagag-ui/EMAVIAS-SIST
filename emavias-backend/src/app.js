const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase } = require('./database');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/obras', require('./routes/obras'));
app.use('/api/despachos', require('./routes/despachos'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EMAVÍAS API funcionando correctamente', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Initialize database and start server
initDatabase();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 EMAVÍAS API corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/obras`);
  console.log(`   GET    /api/obras/:id`);
  console.log(`   POST   /api/obras`);
  console.log(`   PUT    /api/obras/:id`);
  console.log(`   DELETE /api/obras/:id`);
  console.log(`   GET    /api/obras/stats/summary`);
  console.log(`   GET    /api/despachos`);
  console.log(`   GET    /api/despachos/:id`);
  console.log(`   POST   /api/despachos`);
  console.log(`   PUT    /api/despachos/:id`);
  console.log(`   DELETE /api/despachos/:id`);
  console.log(`   GET    /api/despachos/stats/by-obra`);
});

module.exports = app;
