/**
 * Cada cliente (usuario o trabajador) se une a una "room" propia apenas conecta.
 * Así podemos emitirle eventos puntuales con io.to(`worker:<id>`) o io.to(`user:<id>`)
 * sin tener que llevar un mapa manual de sockets.
 */
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log('Socket conectado:', socket.id);

    socket.on('identify', ({ role, id }) => {
      if (!role || !id) return;
      if (role === 'worker') socket.join(`worker:${id}`);
      if (role === 'user') socket.join(`user:${id}`);
      console.log(`Socket ${socket.id} identificado como ${role}:${id}`);
    });

    // El trabajador puede emitir su ubicación en vivo mientras va camino a la changa
    socket.on('worker_location', ({ workerId, requestId, lat, lng }) => {
      if (!requestId) return;
      // Reenviamos al usuario dueño de esa solicitud (el front debe unirse antes con 'identify')
      socket.to(`request:${requestId}`).emit('worker_location_update', { lat, lng });
    });

    socket.on('join_request', ({ requestId }) => {
      if (requestId) socket.join(`request:${requestId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado:', socket.id);
    });
  });
}

module.exports = { initSocket };
