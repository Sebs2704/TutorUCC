/**
 * seed_usuarios.js
 * Crea tutores + estudiantes de prueba en usuarios Y en su colección de rol.
 * Uso: cd backend && node scripts/seed_usuarios.js
 *
 * Contraseñas por defecto: tutores → Tutoria2026 | estudiantes → Estudio2026
 * IMPORTANTE: Ejecutar UNA sola vez. Si se corre de nuevo, omite los que ya existen.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns      = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const mongoose   = require('mongoose');
const Usuario    = require('../models/Usuario');
const Docente    = require('../models/Docente');
const Estudiante = require('../models/Estudiante');

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

// Monitores: dos cuentas cada uno.
// correo      → rol tutor    (gestionar tutorías)
// correoEst   → rol estudiante (pedir tutorías)
const MONITORES = [
    { nombre: 'Javier Esneider Nieto Bello',  correo: 'javier.nietob@campusucc.edu.co',    correoEst: 'javier.nieto.est@campusucc.edu.co',  codigo: '200001' },
    { nombre: 'Jhilmer Alejandro Cala Celis', correo: 'jhilmer.cala@campusucc.edu.co',     correoEst: 'jhilmer.cala.est@campusucc.edu.co',  codigo: '200002' },
];

const ESTUDIANTES_PRUEBA = [
    { nombre: 'Estudiante Prueba Uno',  correo: 'estudiante1@campusucc.edu.co', codigo: '100001' },
    { nombre: 'Estudiante Prueba Dos',  correo: 'estudiante2@campusucc.edu.co', codigo: '100002' },
    { nombre: 'Estudiante Prueba Tres', correo: 'estudiante3@campusucc.edu.co', codigo: '100003' },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    let creados  = 0;
    let omitidos = 0;

    // ── Tutores → usuarios + docentes ────────────────────────────
    for (const t of TUTORES) {
        const existe = await Usuario.findOne({ correo: t.correo });
        if (existe) {
            console.log(`  ⚠  Omitido (ya existe): ${t.correo}`);
            omitidos++;
            continue;
        }
        await Usuario.create({ ...t, password: 'Tutoria2026', rol: 'tutor' });
        await Docente.create({ nombre: t.nombre, correo: t.correo });
        console.log(`  ✅ Tutor creado: ${t.nombre} → ${t.correo}`);
        creados++;
    }

    // ── Estudiantes → usuarios + estudiantes ──────────────────────
    for (const e of ESTUDIANTES_PRUEBA) {
        const existe = await Usuario.findOne({ correo: e.correo });
        if (existe) {
            console.log(`  ⚠  Omitido (ya existe): ${e.correo}`);
            omitidos++;
            continue;
        }
        await Usuario.create({ ...e, password: 'Estudio2026', rol: 'estudiante' });
        await Estudiante.create({ nombre: e.nombre, correo: e.correo, codigo: e.codigo });
        console.log(`  ✅ Estudiante creado: ${e.nombre} → ${e.correo}`);
        creados++;
    }

    // ── Monitores → cuenta tutor + cuenta estudiante ───────────────
    for (const m of MONITORES) {
        // Cuenta tutor
        const existeTutor = await Usuario.findOne({ correo: m.correo });
        if (existeTutor) {
            console.log(`  ⚠  Omitido (ya existe): ${m.correo}`);
            omitidos++;
        } else {
            await Usuario.create({ nombre: m.nombre, correo: m.correo, password: 'Monitor2026', rol: 'tutor' });
            await Docente.create({ nombre: m.nombre, correo: m.correo });
            console.log(`  ✅ Monitor tutor:      ${m.nombre} → ${m.correo}`);
            creados++;
        }

        // Cuenta estudiante
        const existeEst = await Usuario.findOne({ correo: m.correoEst });
        if (existeEst) {
            console.log(`  ⚠  Omitido (ya existe): ${m.correoEst}`);
            omitidos++;
        } else {
            await Usuario.create({ nombre: m.nombre, correo: m.correoEst, password: 'Monitor2026', rol: 'estudiante' });
            await Estudiante.create({ nombre: m.nombre, correo: m.correoEst, codigo: m.codigo });
            console.log(`  ✅ Monitor estudiante: ${m.nombre} → ${m.correoEst}`);
            creados++;
        }
    }

    console.log(`\n🎉 Seed completado: ${creados} creados, ${omitidos} omitidos`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
