const express = require('express');
const router = express.Router();
const { authWorker } = require('../middleware/auth');
const {
  createRequest,
  accept,
  updateStatus,
  getPendingRatings,
} = require('../controllers/requestController');

router.post('/', createRequest);                          // usuario pide una changa
router.post('/:requestId/accept', authWorker, accept);     // trabajador acepta (gana el primero)
router.patch('/:requestId/status', authWorker, updateStatus); // en_camino / en_progreso / finalizada / cancelada
router.get('/pending-ratings/:userId', getPendingRatings);

module.exports = router;
