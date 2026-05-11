/**
 * seed_catalogo.js
 * Pobla Materia y HorarioTutor con referencias reales a usuarios (ObjectId).
 * IMPORTANTE: Ejecutar DESPUÉS de seed_usuarios.js.
 * Uso: cd backend && node scripts/seed_catalogo.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose     = require('mongoose');
const Materia      = require('../models/Materia');
const HorarioTutor = require('../models/HorarioTutor');
const Usuario      = require('../models/Usuario');

const CATALOGO = {
  'I': [
    { nombre: 'Cálculo Diferencial', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
    ]},
    { nombre: 'Lógica Matemática', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
    ]},
    { nombre: 'Algoritmia', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
    ]},
    { nombre: 'Contexto de la Ing. de Sistemas', tutores: [] },
  ],
  'II': [
    { nombre: 'Cálculo Integral', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
    ]},
    { nombre: 'Álgebra Lineal', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
    ]},
    { nombre: 'Análisis de Sistemas', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
    { nombre: 'Téc. de Medición de Variables Físicas', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Myriam Cristina Reyes Ortiz',      horario: 'Lunes 10:00-12:00',     aula: '213' },
    ]},
  ],
  'III': [
    { nombre: 'Cálculo Multivariado', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
    ]},
    { nombre: 'Estadística Descriptiva', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
    ]},
    { nombre: 'Pensamiento Sistémico', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
    ]},
    { nombre: 'Física Mecánica', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Myriam Cristina Reyes Ortiz',      horario: 'Lunes 10:00-12:00',     aula: '213' },
    ]},
    { nombre: 'Estructuras de Datos', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
    ]},
    { nombre: 'Programación Orientada a Objetos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
  'IV': [
    { nombre: 'Ecuaciones Diferenciales', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
    ]},
    { nombre: 'Estadística Inferencial', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
    ]},
    { nombre: 'Diseño Orientado a Objetos', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
    ]},
    { nombre: 'Arquitectura de Computadores', tutores: [] },
    { nombre: 'Sistemas Operativos', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Propagación de Señales y Ondas', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
    ]},
  ],
  'V': [
    { nombre: 'Matemáticas Especiales', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
    ]},
    { nombre: 'Análisis Numérico', tutores: [] },
    { nombre: 'Patrones de Diseño Orientado a Objetos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
    ]},
    { nombre: 'Interconexión de Redes de Comp.', tutores: [] },
    { nombre: 'Diseño de Bases de Datos', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
    ]},
    { nombre: 'Física, Electricidad y Magnetismo', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Myriam Cristina Reyes Ortiz',      horario: 'Lunes 10:00-12:00',     aula: '213' },
    ]},
  ],
  'VI': [
    { nombre: 'Asp. Administrativos y Económicos', tutores: [] },
    { nombre: 'Ing. del Software y Requerimientos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
    ]},
    { nombre: 'Creación de Bases de Datos', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
    ]},
    { nombre: 'Sistemas Distribuidos', tutores: [] },
    { nombre: 'Diseño de Modelos de Seguridad', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
    ]},
    { nombre: 'Aplicaciones de la Inteligencia Artificial', tutores: [
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
  ],
  'VII': [
    { nombre: 'Ingeniería Económica', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
    { nombre: 'Gestión de Bases de Datos', tutores: [
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
    ]},
    { nombre: 'Gestión de Seguridad Inf.', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
    { nombre: 'Met. Inv. Aplic. a la Mod. Grado', tutores: [] },
    { nombre: 'Minería de Datos', tutores: [
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
    ]},
    { nombre: 'Téc. de Validación y Simulación', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
  'VIII': [
    { nombre: 'Asp. Contables para la Gestión de Proy.', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
    { nombre: 'Form. y Evaluación de Proyectos', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
    { nombre: 'Arq. y Modelamiento de Software', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
    { nombre: 'Diseño de Interfaces', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
    ]},
    { nombre: 'Dllo. de Sist. Inf. y Multimediales', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
    ]},
    { nombre: 'Electiva Específica I', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
  'IX': [
    { nombre: 'Construcción del Trabajo de Grado', tutores: [] },
    { nombre: 'Gerencia de Proyectos', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
    ]},
    { nombre: 'Gestión y Calidad del Software', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
    { nombre: 'Auditoria de Sistemas', tutores: [
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
    { nombre: 'Electiva Específica II', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
  'X': [
    { nombre: 'Práctica Emp. Aplic. al Trabajo de Grado', tutores: [] },
    { nombre: 'Aspectos Generales del Medio Ambiente',    tutores: [] },
    { nombre: 'Ley y Ética para Ingeniería',              tutores: [] },
    { nombre: 'Electiva Específica III', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Electiva Específica IV', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
};

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await Materia.deleteMany({});
    await HorarioTutor.deleteMany({});
    console.log('🗑  Colecciones materias y horariotutors limpiadas');

    // Cache de tutores para no repetir queries
    const _tutorCache = new Map();
    const _getTutor = async (nombre) => {
        if (_tutorCache.has(nombre)) return _tutorCache.get(nombre);
        const doc = await Usuario.findOne({ nombre, rol: 'tutor' }).select('_id nombre');
        _tutorCache.set(nombre, doc);
        return doc;
    };

    let totalMaterias = 0;
    let totalHorarios = 0;
    let sinTutor      = 0;

    for (const [semestre, materias] of Object.entries(CATALOGO)) {
        for (const m of materias) {
            const materia = await Materia.create({ nombre: m.nombre, semestre });
            totalMaterias++;

            for (const t of m.tutores) {
                const tutorDoc = await _getTutor(t.tutor);
                if (!tutorDoc) {
                    console.warn(`  ⚠  Tutor no encontrado en usuarios: "${t.tutor}" — omitido`);
                    sinTutor++;
                    continue;
                }
                await HorarioTutor.create({
                    tutor:   tutorDoc._id,
                    materia: materia._id,
                    horario: t.horario,
                    aula:    t.aula,
                });
                totalHorarios++;
            }
        }
    }

    console.log(`\n✅ Seed completado:`);
    console.log(`   ${totalMaterias} materias`);
    console.log(`   ${totalHorarios} horarios`);
    if (sinTutor > 0)
        console.warn(`   ⚠  ${sinTutor} horarios omitidos (tutor no encontrado — corre seed_usuarios.js primero)`);

    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
