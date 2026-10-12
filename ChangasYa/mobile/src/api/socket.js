import { io } from 'socket.io-client';
import { API_URL } from './client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_URL.replace('/api', ''), {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

// Se llama apenas se conoce el id del usuario o del trabajador
export function identify(role, id) {
  getSocket().emit('identify', { role, id });
}
