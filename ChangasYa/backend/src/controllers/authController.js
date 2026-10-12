const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// -------- USUARIOS (clientes): sin password, solo teléfono --------
// El flujo real debería incluir verificación por SMS (OTP). Acá dejamos
// el punto de extensión listo (ver comentario TODO).
async function loginOrCreateUser(req, res) {
  const { phone, name, pushToken } = req.body;
  if (!phone) return res.status(400).json({ error: 'Falta el teléfono' });

  try {
    // TODO: integrar verificación OTP por SMS (Twilio / Firebase Auth Phone) antes de crear el usuario.
    const { rows } = await pool.query(
      `INSERT INTO users (phone, name, push_token)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE SET
         name = COALESCE(EXCLUDED.name, users.name),
         push_token = COALESCE(EXCLUDED.push_token, users.push_token)
       RETURNING *`,
      [phone, name || null, pushToken || null]
    );
    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// -------- TRABAJADORES: registro con password --------
async function registerWorker(req, res) {
  const { name, phone, dni, password, tradeId } = req.body;
  if (!name || !phone || !password || !tradeId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO workers (name, phone, dni, password_hash, trade_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, trade_id, is_available, rating_avg`,
      [name, phone, dni || null, hash, tradeId]
    );
    const worker = rows[0];
    const token = jwt.sign({ workerId: worker.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.json({ worker, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese teléfono ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al registrar trabajador' });
  }
}

async function loginWorker(req, res) {
  const { phone, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    const worker = rows[0];
    if (!worker) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const valid = await bcrypt.compare(password, worker.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ workerId: worker.id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    delete worker.password_hash;
    res.json({ worker, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = { loginOrCreateUser, registerWorker, loginWorker };
