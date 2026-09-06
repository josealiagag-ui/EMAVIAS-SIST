const express = require('express');
const { db } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/despachos - list all despachos (with optional filters)
router.get('/', (req, res) => {
  try {
    const { codigo_obra, tipo_mezcla, year, search } = req.query;
    let query = `
      SELECT d.*, o.ubicacion as obra_ubicacion, o.zona as obra_zona, o.estado as obra_estado
      FROM despachos d
      LEFT JOIN obras o ON d.codigo_obra = o.codigo
      WHERE 1=1
    `;
    const params = [];

    if (codigo_obra) { query += ' AND d.codigo_obra = ?'; params.push(codigo_obra); }
    if (tipo_mezcla) { query += ' AND d.tipo_mezcla = ?'; params.push(tipo_mezcla); }
    if (year)        { query += " AND strftime('%Y', d.fecha) = ?"; params.push(year); }
    if (search) {
      query += ' AND (d.n_boleta LIKE ? OR d.conductor LIKE ? OR d.codigo_obra LIKE ? OR d.volqueta LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    query += ' ORDER BY d.fecha DESC, d.hora DESC';

    const despachos = db.prepare(query).all(...params);
    res.json({ data: despachos, total: despachos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/despachos/:id - get single despacho
router.get('/:id', (req, res) => {
  try {
    const despacho = db.prepare(`
      SELECT d.*, o.ubicacion as obra_ubicacion, o.zona as obra_zona
      FROM despachos d
      LEFT JOIN obras o ON d.codigo_obra = o.codigo
      WHERE d.id = ?
    `).get(req.params.id);
    if (!despacho) return res.status(404).json({ error: 'Despacho no encontrado' });
    res.json({ data: despacho });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/despachos - create despacho
router.post('/', (req, res) => {
  try {
    const { fecha, hora, n_boleta, volqueta, conductor, vol_m3, tipo_mezcla, temperatura, planta, responsable, codigo_obra, destino } = req.body;

    if (!fecha || !hora || !n_boleta || !volqueta || !conductor || !tipo_mezcla || !codigo_obra) {
      return res.status(400).json({ error: 'Campos requeridos: fecha, hora, n_boleta, volqueta, conductor, tipo_mezcla, codigo_obra' });
    }

    // Check duplicate boleta
    const existing = db.prepare('SELECT id FROM despachos WHERE n_boleta = ?').get(n_boleta);
    if (existing) return res.status(409).json({ error: `La boleta ${n_boleta} ya está registrada` });

    // Get obra_id if obra exists
    const obra = db.prepare('SELECT id FROM obras WHERE codigo = ?').get(codigo_obra);

    const stmt = db.prepare(`
      INSERT INTO despachos (fecha,hora,n_boleta,volqueta,conductor,vol_m3,tipo_mezcla,temperatura,planta,responsable,codigo_obra,destino,obra_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const result = stmt.run(fecha, hora, n_boleta, volqueta, conductor, vol_m3||0, tipo_mezcla, temperatura||0, planta||'', responsable||'', codigo_obra, destino||'', obra ? obra.id : null);

    const newDespacho = db.prepare('SELECT * FROM despachos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Despacho creado exitosamente', data: newDespacho });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/despachos/:id - update despacho
router.put('/:id', (req, res) => {
  try {
    const despacho = db.prepare('SELECT * FROM despachos WHERE id = ?').get(req.params.id);
    if (!despacho) return res.status(404).json({ error: 'Despacho no encontrado' });

    const { fecha, hora, n_boleta, volqueta, conductor, vol_m3, tipo_mezcla, temperatura, planta, responsable, codigo_obra, destino } = req.body;

    // Check duplicate boleta (excluding current)
    if (n_boleta && n_boleta !== despacho.n_boleta) {
      const existing = db.prepare('SELECT id FROM despachos WHERE n_boleta = ? AND id != ?').get(n_boleta, req.params.id);
      if (existing) return res.status(409).json({ error: `La boleta ${n_boleta} ya está registrada` });
    }

    const obra = codigo_obra ? db.prepare('SELECT id FROM obras WHERE codigo = ?').get(codigo_obra) : null;

    db.prepare(`
      UPDATE despachos SET
        fecha = ?, hora = ?, n_boleta = ?, volqueta = ?, conductor = ?,
        vol_m3 = ?, tipo_mezcla = ?, temperatura = ?, planta = ?,
        responsable = ?, codigo_obra = ?, destino = ?, obra_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      fecha ?? despacho.fecha, hora ?? despacho.hora, n_boleta ?? despacho.n_boleta,
      volqueta ?? despacho.volqueta, conductor ?? despacho.conductor,
      vol_m3 ?? despacho.vol_m3, tipo_mezcla ?? despacho.tipo_mezcla,
      temperatura ?? despacho.temperatura, planta ?? despacho.planta,
      responsable ?? despacho.responsable, codigo_obra ?? despacho.codigo_obra,
      destino ?? despacho.destino, obra ? obra.id : despacho.obra_id,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM despachos WHERE id = ?').get(req.params.id);
    res.json({ message: 'Despacho actualizado exitosamente', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/despachos/mezcla-stats/:codigo_obra
// Devuelve total despachado vs requerido para una obra
router.get('/mezcla-stats/:codigo_obra', (req, res) => {
  try {
    const { codigo_obra } = req.params;

    const obra = db.prepare(
      'SELECT cant_mezcla, ubicacion, zona FROM obras WHERE codigo = ?'
    ).get(codigo_obra);

    if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });

    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_viajes,
        COALESCE(SUM(vol_m3), 0) as total_despachado
      FROM despachos
      WHERE codigo_obra = ?
    `).get(codigo_obra);

    const requerido   = parseFloat(obra.cant_mezcla) || 0;
    const despachado  = parseFloat(stats.total_despachado) || 0;
    const disponible  = requerido - despachado;
    const porcentaje  = requerido > 0 ? Math.min(Math.round((despachado / requerido) * 100), 100) : 0;

    res.json({
      data: {
        requerido,
        despachado: Math.round(despachado * 100) / 100,
        disponible: Math.round(disponible * 100) / 100,
        porcentaje,
        total_viajes: stats.total_viajes,
        excedido: despachado > requerido && requerido > 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/despachos/:id - delete despacho
router.delete('/:id', (req, res) => {
  try {
    const despacho = db.prepare('SELECT * FROM despachos WHERE id = ?').get(req.params.id);
    if (!despacho) return res.status(404).json({ error: 'Despacho no encontrado' });

    db.prepare('DELETE FROM despachos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Despacho eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/despachos/stats/by-obra - totales por obra
router.get('/stats/by-obra', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT codigo_obra, COUNT(*) as total_despachos, SUM(vol_m3) as total_m3, AVG(temperatura) as temp_promedio
      FROM despachos GROUP BY codigo_obra ORDER BY total_m3 DESC
    `).all();
    res.json({ data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
