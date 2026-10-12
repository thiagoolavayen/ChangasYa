const express = require('express');
const router = express.Router();
const { loginOrCreateUser, registerWorker, loginWorker } = require('../controllers/authController');

router.post('/user/login', loginOrCreateUser);       // usuarios: solo teléfono
router.post('/worker/register', registerWorker);     // "¿Desea trabajar para nosotros?"
router.post('/worker/login', loginWorker);

module.exports = router;
