-- schema.sql — inicializa o actualiza el schema de blog_db
-- Idempotente: se puede ejecutar múltiples veces sin perder datos.

CREATE TABLE IF NOT EXISTS posts (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(200) NOT NULL,
    content    TEXT         NOT NULL,
    tags       VARCHAR(300),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (title)
);

CREATE TABLE IF NOT EXISTS profile (
    id         INTEGER PRIMARY KEY DEFAULT 1,
    name       VARCHAR(100) NOT NULL,
    bio        TEXT,
    photo_data BYTEA,
    photo_mime VARCHAR(50)
);

-- Insertar perfil por defecto si no existe
INSERT INTO profile (id, name, bio)
VALUES (1, 'Lucas Depetris', '')
ON CONFLICT (id) DO NOTHING;
