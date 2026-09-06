const express = require('express');
const { db } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/obras - list all obras (with optional filters)
router.get('/', (req, res) => {
  try {
    const { estado, tipo, year, search } = req.query;
    let query = 'SELECT * FROM obras WHERE 1=1';
    const params = [];

    if (estado) { query += ' AND estado = ?'; params.push(estado); }
    if (tipo)   { query += ' AND tipo = ?';   params.push(tipo); }
    if (year)   { query += ' AND strftime(\'%Y\', fecha) = ?'; params.push(year); }
    if (search) {
      query += ' AND (codigo LIKE ? OR ubicacion LIKE ? OR zona LIKE ? OR unidad LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    query += ' ORDER BY fecha DESC';

    const obras = db.prepare(query).all(...params);
    res.json({ data: obras, total: obras.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/obras/:id - get single obra
router.get('/:id', (req, res) => {
  try {
    const obra = db.prepare('SELECT * FROM obras WHERE id = ?').get(req.params.id);
    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });
    res.json({ data: obra });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/obras - create obra
router.post('/', (req, res) => {
  try {
    const { fecha, codigo, unidad, ubicacion, zona, longitud, ancho, area, tipo, grupo, estado, personal, horas, boleta_mezcla, cant_mezcla, tipo_ligante, cant_ligante, observaciones } = req.body;

    if (!fecha || !codigo || !unidad || !ubicacion || !zona || !tipo) {
      return res.status(400).json({ error: 'Campos requeridos: fecha, codigo, unidad, ubicacion, zona, tipo' });
    }

    // Check duplicate codigo
    const existing = db.prepare('SELECT id FROM obras WHERE codigo = ?').get(codigo);
    if (existing) return res.status(409).json({ error: `El código ${codigo} ya existe` });

    const stmt = db.prepare(`
      INSERT INTO obras (fecha,codigo,unidad,ubicacion,zona,longitud,ancho,area,tipo,grupo,estado,personal,horas,boleta_mezcla,cant_mezcla,tipo_ligante,cant_ligante,observaciones)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const result = stmt.run(fecha, codigo, unidad, ubicacion, zona, longitud||0, ancho||1, area||0, tipo, grupo||'', estado||'Planificado', personal||0, horas||8, boleta_mezcla||'', cant_mezcla||0, tipo_ligante||'', cant_ligante||0, observaciones||'');

    const newObra = db.prepare('SELECT * FROM obras WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Obra creada exitosamente', data: newObra });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/obras/:id - update obra
router.put('/:id', (req, res) => {
  try {
    const obra = db.prepare('SELECT * FROM obras WHERE id = ?').get(req.params.id);
    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

    const { fecha, codigo, unidad, ubicacion, zona, longitud, ancho, area, tipo, grupo, estado, personal, horas, boleta_mezcla, cant_mezcla, tipo_ligante, cant_ligante, observaciones } = req.body;

    // Check duplicate codigo (excluding current)
    if (codigo && codigo !== obra.codigo) {
      const existing = db.prepare('SELECT id FROM obras WHERE codigo = ? AND id != ?').get(codigo, req.params.id);
      if (existing) return res.status(409).json({ error: `El código ${codigo} ya existe` });
    }

    db.prepare(`
      UPDATE obras SET
        fecha = ?, codigo = ?, unidad = ?, ubicacion = ?, zona = ?,
        longitud = ?, ancho = ?, area = ?, tipo = ?, grupo = ?, estado = ?,
        personal = ?, horas = ?, boleta_mezcla = ?, cant_mezcla = ?,
        tipo_ligante = ?, cant_ligante = ?, observaciones = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fecha ?? obra.fecha, codigo ?? obra.codigo, unidad ?? obra.unidad,
      ubicacion ?? obra.ubicacion, zona ?? obra.zona,
      longitud ?? obra.longitud, ancho ?? obra.ancho, area ?? obra.area,
      tipo ?? obra.tipo, grupo ?? obra.grupo, estado ?? obra.estado,
      personal ?? obra.personal, horas ?? obra.horas,
      boleta_mezcla ?? obra.boleta_mezcla, cant_mezcla ?? obra.cant_mezcla,
      tipo_ligante ?? obra.tipo_ligante, cant_ligante ?? obra.cant_ligante,
      observaciones ?? obra.observaciones,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM obras WHERE id = ?').get(req.params.id);
    res.json({ message: 'Obra actualizada exitosamente', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/obras/:id - delete obra
router.delete('/:id', (req, res) => {
  try {
    const obra = db.prepare('SELECT * FROM obras WHERE id = ?').get(req.params.id);
    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

    db.prepare('DELETE FROM obras WHERE id = ?').run(req.params.id);
    res.json({ message: 'Obra eliminada exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/obras/stats/summary - dashboard stats
router.get('/stats/summary', (req, res) => {
  try {
    const totalObras = db.prepare('SELECT COUNT(*) as cnt FROM obras').get().cnt;
    const totalArea  = db.prepare('SELECT SUM(area) as s FROM obras').get().s || 0;
    const porEstado  = db.prepare("SELECT estado, COUNT(*) as cnt FROM obras GROUP BY estado").all();
    const porTipo    = db.prepare("SELECT tipo, COUNT(*) as cnt FROM obras GROUP BY tipo").all();
    const recientes  = db.prepare("SELECT * FROM obras ORDER BY fecha DESC LIMIT 5").all();

    res.json({ data: { totalObras, totalArea, porEstado, porTipo, recientes } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
