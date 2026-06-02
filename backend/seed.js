const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false
});

async function runSeed() {
  console.log('Iniciando proceso de seeding en la base de datos...');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: La variable de entorno DATABASE_URL no está definida.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // 1. Leer y ejecutar el archivo schema.sql
    const schemaPath = path.join(__dirname, '../schema.sql');
    console.log(`Leyendo esquema desde: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creando estructura de tablas...');
    await client.query(schemaSql);
    console.log('Estructura de tablas creada con éxito.');

    // 2. Insertar usuarios semillas
    console.log('Generando hashes de contraseñas...');
    
    const users = [
      { username: 'admin', pass: 'admin123', rol: 'ADMINISTRADOR' },
      { username: 'conductor1', pass: 'cond123', rol: 'CONDUCTOR' },
      { username: 'conductor2', pass: 'cond123', rol: 'CONDUCTOR' },
      { username: 'conductor3', pass: 'cond123', rol: 'CONDUCTOR' },
      { username: 'conductor4', pass: 'cond123', rol: 'CONDUCTOR' }
    ];

    console.log('Insertando usuarios...');
    for (const u of users) {
      const hashedPass = await bcrypt.hash(u.pass, 10);
      await client.query(
        'INSERT INTO usuarios (username, password, rol, activo) VALUES ($1, $2, $3, TRUE) ON CONFLICT (username) DO NOTHING',
        [u.username, hashedPass, u.rol]
      );
      console.log(`- Usuario registrado: ${u.username} (${u.rol}) con contraseña: ${u.pass}`);
    }

    // 3. Insertar vehículos semillas
    const vehicles = [
      { matricula: '1234-LMX', marca_modelo: 'Toyota Corolla Hybrid' },
      { matricula: '5678-KPR', marca_modelo: 'Renault Clio E-Tech' }
    ];

    console.log('Insertando vehículos...');
    for (const v of vehicles) {
      await client.query(
        'INSERT INTO vehiculos (matricula, marca_modelo, en_uso, activo) VALUES ($1, $2, FALSE, TRUE) ON CONFLICT (matricula) DO NOTHING',
        [v.matricula, v.marca_modelo]
      );
      console.log(`- Vehículo registrado: ${v.matricula} (${v.marca_modelo})`);
    }

    console.log('¡Seeding completado con éxito!');
  } catch (error) {
    console.error('Error durante el proceso de seeding:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
