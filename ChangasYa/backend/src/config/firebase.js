const admin = require('firebase-admin');
require('dotenv').config();

let initialized = false;

function initFirebase() {
  if (initialized) return;
  try {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('Firebase Admin inicializado correctamente.');
  } catch (err) {
    console.warn(
      '⚠️  No se pudo inicializar Firebase Admin. Las push notifications estarán deshabilitadas hasta configurar FIREBASE_SERVICE_ACCOUNT_PATH.'
    );
  }
}

module.exports = { admin, initFirebase };
