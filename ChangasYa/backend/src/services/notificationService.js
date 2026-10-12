const { admin } = require('../config/firebase');

/**
 * Envía una notificación push a un token de dispositivo (worker o user).
 * Si Firebase no está inicializado, no rompe el flujo: solo loguea.
 */
async function sendPush(token, title, body, data = {}) {
  if (!token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    });
  } catch (err) {
    console.error('Error enviando push a', token, err.message);
  }
}

async function notifyWorkerNuevaChanga(worker, request, trade) {
  return sendPush(
    worker.push_token,
    `Nueva changa de ${trade.name}`,
    'Hay un cliente cerca esperando. ¡Tocá para ver el detalle!',
    { type: 'NUEVA_CHANGA', requestId: request.id }
  );
}

async function notifyUserTrabajadorAsignado(user, worker, trade) {
  return sendPush(
    user.push_token,
    '¡Encontramos a alguien!',
    `${worker.name} (${trade.name}) va en camino.`,
    { type: 'TRABAJADOR_ASIGNADO', workerId: worker.id }
  );
}

async function notifyUserSinTrabajadores(user, trade) {
  return sendPush(
    user.push_token,
    'No encontramos trabajadores disponibles',
    `Por ahora no hay nadie de ${trade.name} disponible cerca tuyo. Intentá de nuevo en unos minutos.`,
    { type: 'SIN_TRABAJADORES' }
  );
}

module.exports = {
  sendPush,
  notifyWorkerNuevaChanga,
  notifyUserTrabajadorAsignado,
  notifyUserSinTrabajadores,
};
