const { pool } = require('../config/db');
const { startMatching, acceptRequest } = require('../services/matchingService');

// El usuario aprieta uno de los 4 botones (Gomería, Plomería, Cerrajista, Electricista)
async function createRequest(req, res) {
  const { userId, tradeId, lat, lng } = req.body;
  if (!userId || !tradeId || lat == null || lng == null) {
    return res.status(400).json({ error: 'Faltan datos: userId, tradeId, lat, lng' });
  }

  try {
    const { rows: userRows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const { rows: tradeRows } = await pool.query('SELECT * FROM trades WHERE id = $1', [tradeId]);
    if (!userRows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!tradeRows[0]) return res.status(404).json({ error: 'Oficio no encontrado' });

    const { rows } = await pool.query(
      `INSERT INTO requests (user_id, trade_id, user_lat, user_lng)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, tradeId, lat, lng]
    );
    const request = rows[0];

    const io = req.app.get('io');
    // Arrancamos el broadcast en segundo plano (no bloqueamos la respuesta HTTP)
    startMatching(io, request, tradeRows[0], userRows[0]).catch((err) =>
      console.error('Error en matching:', err)
    );

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la solicitud' });
  }
}

// El trabajador acepta una changa notificada (carrera: gana el primero)
async function accept(req, res) {
  const { requestId } = req.params;
  const workerId = req.workerId; // viene del middleware authWorker

  const io = req.app.get('io');
  const result = await acceptRequest(io, requestId, workerId);

  if (!result.success) {
    return res.status(409).json({ error: 'Esta changa ya fue tomada por otro trabajador' });
  }
  res.json({ request: result.request, worker: result.worker });
}

async function updateStatus(req, res) {
  const { requestId } = req.params;
  const { status } = req.body; // 'en_camino' | 'en_progreso' | 'finalizada' | 'cancelada'
  const validStatuses = ['en_camino', 'en_progreso', 'finalizada', 'cancelada'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const extra = status === 'finalizada' ? ', finished_at = now()' : status === 'cancelada' ? ', cancelled_at = now()' : '';
    const { rows } = await pool.query(
      `UPDATE requests SET status = $1 ${extra} WHERE id = $2 AND worker_id = $3 RETURNING *`,
      [status, requestId, req.workerId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });

    const io = req.app.get('io');
    io.to(`user:${rows[0].user_id}`).emit('estado_changa', {
      requestId,
      status,
    });

    res.json({ request: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
}

// Se llama cada vez que el usuario abre la app: le mostramos changas pendientes de calificar
async function getPendingRatings(req, res) {
  const { userId } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM pending_ratings WHERE user_id = $1', [userId]);
    res.json({ pending: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar calificaciones pendientes' });
  }
}

module.exports = { createRequest, accept, updateStatus, getPendingRatings };
