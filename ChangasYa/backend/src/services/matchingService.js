const { pool } = require('../config/db');
const {
  notifyWorkerNuevaChanga,
  notifyUserTrabajadorAsignado,
  notifyUserSinTrabajadores,
} = require('./notificationService');

const RADIUS_START = Number(process.env.SEARCH_RADIUS_KM || 5);
const RADIUS_STEP = Number(process.env.SEARCH_RADIUS_STEP_KM || 5);
const RADIUS_MAX = Number(process.env.SEARCH_RADIUS_MAX_KM || 20);
const WAVE_SECONDS = Number(process.env.BROADCAST_WAVE_SECONDS || 15);

/**
 * Busca trabajadores disponibles de un oficio dentro de un radio (km),
 * ordenados por cercanía, excluyendo a los ya notificados.
 */
async function findNearbyWorkers(tradeId, lat, lng, radiusKm, excludeIds = []) {
  const { rows } = await pool.query(
    `SELECT id, name, phone, push_token,
            earth_distance(ll_to_earth($1, $2), ll_to_earth(current_lat, current_lng)) / 1000 AS distance_km
     FROM workers
     WHERE trade_id = $3
       AND is_available = true
       AND current_lat IS NOT NULL
       AND NOT (id = ANY($4::uuid[]))
       AND earth_box(ll_to_earth($1, $2), $5 * 1000) @> ll_to_earth(current_lat, current_lng)
       AND earth_distance(ll_to_earth($1, $2), ll_to_earth(current_lat, current_lng)) <= $5 * 1000
     ORDER BY distance_km ASC
     LIMIT 20`,
    [lat, lng, tradeId, excludeIds, radiusKm]
  );
  return rows;
}

/**
 * Punto de entrada: arranca el proceso de búsqueda "en olas" (broadcast).
 * io: instancia de socket.io para emitir eventos en tiempo real.
 */
async function startMatching(io, request, trade, user) {
  let radius = RADIUS_START;
  let notified = [];

  while (radius <= RADIUS_MAX) {
    // Chequeamos si la solicitud sigue "buscando" (no fue aceptada ni cancelada)
    const current = await getRequestById(request.id);
    if (!current || current.status !== 'buscando') return;

    const workers = await findNearbyWorkers(
      trade.id,
      request.user_lat,
      request.user_lng,
      radius,
      notified
    );

    if (workers.length > 0) {
      const ids = workers.map((w) => w.id);
      notified = [...notified, ...ids];

      await pool.query(
        `UPDATE requests SET notified_worker_ids = $1 WHERE id = $2`,
        [notified, request.id]
      );

      // Notificamos a todos en simultáneo: por Socket.IO (si están conectados con la app abierta)
      // y por push (FCM) para el caso en que la app esté en background.
      for (const worker of workers) {
        io.to(`worker:${worker.id}`).emit('nueva_changa', {
          requestId: request.id,
          trade: trade.name,
          userLat: request.user_lat,
          userLng: request.user_lng,
          distanceKm: Number(worker.distance_km).toFixed(1),
        });
        notifyWorkerNuevaChanga(worker, request, trade);
      }
    }

    // Esperamos la "ola" antes de ampliar el radio o revisar de nuevo
    await sleep(WAVE_SECONDS * 1000);
    radius += RADIUS_STEP;
  }

  // Se acabó el radio máximo y nadie aceptó
  const final = await getRequestById(request.id);
  if (final && final.status === 'buscando') {
    await pool.query(
      `UPDATE requests SET status = 'sin_trabajadores' WHERE id = $1`,
      [request.id]
    );
    io.to(`user:${user.id}`).emit('sin_trabajadores', { requestId: request.id });
    notifyUserSinTrabajadores(user, trade);
  }
}

/**
 * Un trabajador intenta aceptar una changa.
 * Usamos un UPDATE condicional atómico para que, si dos trabajadores
 * aprietan "Aceptar" al mismo tiempo, solo uno gane la carrera (row-level lock de Postgres).
 */
async function acceptRequest(io, requestId, workerId) {
  const { rows } = await pool.query(
    `UPDATE requests
     SET status = 'asignada', worker_id = $1, accepted_at = now()
     WHERE id = $2 AND status = 'buscando'
     RETURNING *`,
    [workerId, requestId]
  );

  if (rows.length === 0) {
    // Ya la había tomado otro trabajador (o fue cancelada)
    return { success: false, reason: 'YA_ASIGNADA' };
  }

  const request = rows[0];

  const [{ rows: workerRows }, { rows: userRows }, { rows: tradeRows }] = await Promise.all([
    pool.query('SELECT * FROM workers WHERE id = $1', [workerId]),
    pool.query('SELECT * FROM users WHERE id = $1', [request.user_id]),
    pool.query('SELECT * FROM trades WHERE id = $1', [request.trade_id]),
  ]);
  const worker = workerRows[0];
  const user = userRows[0];
  const trade = tradeRows[0];

  // Avisamos al usuario en tiempo real y al resto de trabajadores que ya no está disponible la changa
  io.to(`user:${user.id}`).emit('trabajador_asignado', {
    requestId: request.id,
    worker: {
      id: worker.id,
      name: worker.name,
      phone: worker.phone,
      rating: worker.rating_avg,
    },
  });

  for (const otherId of request.notified_worker_ids.filter((id) => id !== workerId)) {
    io.to(`worker:${otherId}`).emit('changa_no_disponible', { requestId: request.id });
  }

  notifyUserTrabajadorAsignado(user, worker, trade);

  return { success: true, request, worker };
}

async function getRequestById(id) {
  const { rows } = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
  return rows[0];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { startMatching, acceptRequest, findNearbyWorkers };
