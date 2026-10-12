const express = require('express');
const router = express.Router();
const { rateWorker } = require('../controllers/ratingController');

router.post('/', rateWorker);

module.exports = router;
