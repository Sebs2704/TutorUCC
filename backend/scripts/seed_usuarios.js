/**
 * seed_usuarios.js
 * Crea las cuentas de tutores + estudiantes de prueba en la colección usuarios.
 * Uso: cd backend && node scripts/seed_usuarios.js
 *
 * Contraseña por defecto para todos los tutores: Tutoria2026
 * Contraseña por defecto para estudiantes de prueba: Estudio2026
 *
 * IMPORTANTE: Ejecutar UNA sola vez. Si se corre de nuevo, omite los que ya existen.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns      = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const mongoose = require('mongoose');
const Usuario  = require('../models/Usuario');

const TUTORES = [
    { nombre: 'Daniel Bejarano Segura',        correo: 'bejaranods@campusucc.edu.co' },
    { nombre: 'Lina Maria Zabala Arango',       correo: 'zabalama@campusucc.edu.co'  },
    { nombre: 'Lina Shirley Lopez Hernandez',   correo: 'lopezlsh@campusucc.edu.co'  },
    { nombre: 'Francy Yaneth Patiño Martinez',  correo: 'patinofyp@campusucc.edu.co' },
    { nombre: 'Carlos Ignacio Torres Londoño',  correo: 'torresc@campusucc.edu.co'   },
    { nombre: 'Mayra Alexandra Amador Ladino',  correo: 'amadormal@campusucc.edu.co' },
    { nombre: 'Ana Milena Gutierrez Cardenas',  correo: 'gutierrezam@campusucc.edu.co'},
    { nombre: 'Myriam Cristina Reyes Ortiz',    correo: 'reyesmc@campusucc.edu.co'   },
    { nombre: 'Piedad Chica Sosa',              correo: 'chicaps@campusucc.edu.co'   },
    { nombre: 'Lina Marcela Cespedes Garcia',   correo: 'cespedesml@campusucc.edu.co'},
    { nombre: 'Pedro Fernando Osorio Tejada',   correo: 'osoriopt@campusucc.edu.co'  },
    { nombre: 'Luis Eduardo Rey Huertas',       correo: 'reyleh@campusucc.edu.co'    },
    { nombre: 'Yomaira Guzman Paredes',         correo: 'guzmanpy@campusucc.edu.co'  },
];

const ESTUDIANTES_PRUEBA = [
    { nombre: 'Estudiante Prueba Uno',  correo: 'estudiante1@campusucc.edu.co' },
    { nombre: 'Estudiante Prueba Dos',  correo: 'estudiante2@campusucc.edu.co' },
    { nombre: 'Estudiante Prueba Tres', correo: 'estudiante3@campusucc.edu.co' },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    let creados   = 0;
    let omitidos  = 0;

    // ── Tutores ──────────────────────────────────────────────────
    for (const t of TUTORES) {
        const existe = await Usuario.findOne({ correo: t.correo });
        if (existe) {
            console.log(`  ⚠  Omitido (ya existe): ${t.correo}`);
            omitidos++;
            continue;
        }
        await Usuario.create({ ...t, password: 'Tutoria2026', rol: 'tutor' });
        console.log(`  ✅ Tutor creado: ${t.nombre} → ${t.correo}`);
        creados++;
    }

    // ── Estudiantes de prueba ─────────────────────────────────────
    for (const e of ESTUDIANTES_PRUEBA) {
        const existe = await Usuario.findOne({ correo: e.correo });
        if (existe) {
            console.log(`  ⚠  Omitido (ya existe): ${e.correo}`);
            omitidos++;
            continue;
        }
        await Usuario.create({ ...e, password: 'Estudio2026', rol: 'estudiante' });
        console.log(`  ✅ Estudiante creado: ${e.nombre} → ${e.correo}`);
        creados++;
    }

    console.log(`\n🎉 Seed completado: ${creados} creados, ${omitidos} omitidos`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
