const { pool } = require('../config/db');

// Switch "Quiero trabajar" / "Ya no quiero trabajar"
async function setAvailability(req, res) {
  const { isAvailable, lat, lng, pushToken } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE workers
       SET is_available = $1,
           current_lat = COALESCE($2, current_lat),
           current_lng = COALESCE($3, current_lng),
           push_token = COALESCE($4, push_token),
           last_location_at = now()
       WHERE id = $5
       RETURNING id, is_available, current_lat, current_lng`,
      [isAvailable, lat, lng, pushToken, req.workerId]
    );
    res.json({ worker: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar disponibilidad' });
  }
}

// Actualización periódica de ubicación mientras está disponible o trabajando
async function updateLocation(req, res) {
  const { lat, lng } = req.body;
  try {
    await pool.query(
      `UPDATE workers SET current_lat = $1, current_lng = $2, last_location_at = now() WHERE id = $3`,
      [lat, lng, req.workerId]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
}

async function getTrades(req, res) {
  const { rows } = await pool.query('SELECT * FROM trades ORDER BY id');
  res.json({ trades: rows });
}

module.exports = { setAvailability, updateLocation, getTrades };
