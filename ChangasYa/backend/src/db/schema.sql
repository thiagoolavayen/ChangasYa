-- ============================================
-- ChangasYa - Esquema de Base de Datos (PostgreSQL)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance; -- para calcular distancias por lat/lng

-- ---------- OFICIOS ----------
CREATE TABLE IF NOT EXISTS trades (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,   -- Gomeria, Plomeria, Cerrajista, Electricista
    icon        VARCHAR(50)                    -- nombre del icono a usar en el front
);

INSERT INTO trades (name, icon) VALUES
    ('Gomeria', 'tire'),
    ('Plomeria', 'pipe'),
    ('Cerrajista', 'key'),
    ('Electricista', 'bolt')
ON CONFLICT (name) DO NOTHING;

-- ---------- USUARIOS (clientes) ----------
-- No requieren registro completo, solo teléfono (login simple tipo OTP)
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone       VARCHAR(20) NOT NULL UNIQUE,
    name        VARCHAR(100),
    push_token  VARCHAR(255),                 -- token de Firebase Cloud Messaging
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- ---------- TRABAJADORES ----------
CREATE TABLE IF NOT EXISTS workers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone           VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    dni             VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    trade_id        INTEGER NOT NULL REFERENCES trades(id),
    push_token      VARCHAR(255),
    is_available    BOOLEAN DEFAULT false,     -- switch "Quiero trabajar"
    is_verified     BOOLEAN DEFAULT false,     -- aprobado por admin (opcional a futuro)
    current_lat     DOUBLE PRECISION,
    current_lng     DOUBLE PRECISION,
    last_location_at TIMESTAMPTZ,
    rating_avg      NUMERIC(2,1) DEFAULT 5.0,
    rating_count    INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_available_trade ON workers(trade_id, is_available);

-- ---------- SOLICITUDES (Changas) ----------
CREATE TYPE request_status AS ENUM (
    'buscando',      -- se acaba de crear, buscando trabajador
    'asignada',      -- un trabajador aceptó
    'en_camino',
    'en_progreso',
    'finalizada',
    'cancelada',
    'sin_trabajadores' -- nadie aceptó / no había disponibles
);

CREATE TABLE IF NOT EXISTS requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    trade_id        INTEGER NOT NULL REFERENCES trades(id),
    worker_id       UUID REFERENCES workers(id),  -- se completa cuando alguien acepta
    user_lat        DOUBLE PRECISION NOT NULL,
    user_lng        DOUBLE PRECISION NOT NULL,
    status          request_status NOT NULL DEFAULT 'buscando',
    notified_worker_ids UUID[] DEFAULT '{}',      -- a quiénes se les avisó (para no repetir)
    created_at      TIMESTAMPTZ DEFAULT now(),
    accepted_at     TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_worker ON requests(worker_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);

-- ---------- CALIFICACIONES ----------
CREATE TABLE IF NOT EXISTS ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id  UUID NOT NULL UNIQUE REFERENCES requests(id),
    worker_id   UUID NOT NULL REFERENCES workers(id),
    user_id     UUID NOT NULL REFERENCES users(id),
    stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Vista útil: pendientes de calificar por usuario (para mostrar apenas entra a la app)
CREATE OR REPLACE VIEW pending_ratings AS
SELECT r.id AS request_id, r.user_id, r.worker_id, w.name AS worker_name, t.name AS trade_name, r.finished_at
FROM requests r
JOIN workers w ON w.id = r.worker_id
JOIN trades t ON t.id = r.trade_id
LEFT JOIN ratings rt ON rt.request_id = r.id
WHERE r.status = 'finalizada' AND rt.id IS NULL;
