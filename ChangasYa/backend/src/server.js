require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const { initSocket } = require('./sockets/socketHandler');
const { initFirebase } = require('./config/firebase');

initFirebase();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }, // en producción: restringir al dominio/app real
});

app.set('io', io); // así los controladores acceden con req.app.get('io')
initSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 ChangasYa backend corriendo en http://localhost:${PORT}`);
});
