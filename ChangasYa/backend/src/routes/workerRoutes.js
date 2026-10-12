const express = require('express');
const router = express.Router();
const { authWorker } = require('../middleware/auth');
const { setAvailability, updateLocation, getTrades } = require('../controllers/workerController');

router.get('/trades', getTrades); // lista de oficios (para el combo del registro)
router.patch('/availability', authWorker, setAvailability); // switch "Quiero trabajar"
router.patch('/location', authWorker, updateLocation);

module.exports = router;
