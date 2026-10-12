const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const workerRoutes = require('./routes/workerRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, app: 'ChangasYa API' }));

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/ratings', ratingRoutes);

module.exports = app;
