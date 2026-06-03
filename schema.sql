-- Esquema de Base de Datos para Javify Control

-- Eliminar tablas si existen (para facilitar reinicios)
DROP TABLE IF EXISTS pausas_jornada CASCADE;
DROP TABLE IF EXISTS jornadas CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- 1. Tabla: usuarios (Conductores y Administradores)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Encriptada con bcrypt
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('CONDUCTOR', 'ADMINISTRADOR')),
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. Tabla: vehiculos (Flota de coches)
-- en_uso = true: Vehículo ocupado por un conductor
-- en_uso = false: Vehículo libre y disponible para check-in
CREATE TABLE vehiculos (
    matricula VARCHAR(15) PRIMARY KEY,
    marca_modelo VARCHAR(100) NOT NULL,
    km_iniciales INTEGER DEFAULT 0 NOT NULL,
    km_actuales INTEGER DEFAULT 0 NOT NULL,
    en_uso BOOLEAN DEFAULT FALSE NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. Tabla: jornadas (Registro de turnos de conductores)
CREATE TABLE jornadas (
    id SERIAL PRIMARY KEY,
    id_conductor INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    matricula VARCHAR(15) NOT NULL REFERENCES vehiculos(matricula) ON DELETE RESTRICT,
    km_inicio INTEGER NOT NULL,
    km_fin INTEGER, -- NULL hasta el check-out
    hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    hora_fin TIMESTAMP WITH TIME ZONE, -- NULL hasta el check-out
    url_foto_km TEXT, -- Almacena la imagen en formato Base64 (inicio)
    url_foto_fin_km TEXT, -- Almacena la imagen en formato Base64 (fin)
    estado VARCHAR(20) DEFAULT 'ACTIVA' NOT NULL CHECK (estado IN ('ACTIVA', 'PAUSADA', 'FINALIZADA'))
);

-- 4. Tabla: pausas_jornada (Tiempos muertos/pausas por jornada)
CREATE TABLE pausas_jornada (
    id SERIAL PRIMARY KEY,
    id_jornada INTEGER NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
    hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    hora_fin TIMESTAMP WITH TIME ZONE -- NULL si la pausa está activa
);

-- 5. Tabla: repostajes (Registro de repostajes por jornada)
CREATE TABLE repostajes (
    id SERIAL PRIMARY KEY,
    id_jornada INTEGER NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
    cantidad_euros DECIMAL(10,2) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices recomendados para optimización de búsquedas y reportes
CREATE INDEX idx_jornadas_conductor ON jornadas(id_conductor);
CREATE INDEX idx_jornadas_matricula ON jornadas(matricula);
CREATE INDEX idx_jornadas_fechas ON jornadas(hora_inicio, hora_fin);
CREATE INDEX idx_pausas_jornada ON pausas_jornada(id_jornada);
