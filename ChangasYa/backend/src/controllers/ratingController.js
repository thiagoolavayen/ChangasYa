const { pool } = require('../config/db');

async function rateWorker(req, res) {
  const { requestId, userId, stars, comment } = req.body;
  if (!requestId || !userId || !stars) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: reqRows } = await client.query(
      `SELECT * FROM requests WHERE id = $1 AND user_id = $2 AND status = 'finalizada'`,
      [requestId, userId]
    );
    const request = reqRows[0];
    if (!request) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Solicitud no encontrada o no finalizada' });
    }

    await client.query(
      `INSERT INTO ratings (request_id, worker_id, user_id, stars, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [requestId, request.worker_id, userId, stars, comment || null]
    );

    // Recalculamos el promedio del trabajador
    await client.query(
      `UPDATE workers
       SET rating_count = rating_count + 1,
           rating_avg = (
             SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE worker_id = $1
           )
       WHERE id = $1`,
      [request.worker_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al calificar' });
  } finally {
    client.release();
  }
}

module.exports = { rateWorker };
