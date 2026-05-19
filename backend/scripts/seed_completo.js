/**
 * seed_completo.js
 * Limpia y reconstruye TODA la base de datos desde cero.
 *
 * Colecciones que limpia y recrea:
 *   tutorias, notificaciones, horariotutors, materias, usuarios
 *
 * Colecciones que NO toca:
 *   Administrador, Estudiantes, Monitores, Profesores
 *
 * Uso: cd backend && node scripts/seed_completo.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose      = require('mongoose');
const Usuario       = require('../models/Usuario');
const Docente       = require('../models/Docente');
const Estudiante    = require('../models/Estudiante');
const Administrador = require('../models/Administrador');
const Materia       = require('../models/Materia');
const HorarioTutor  = require('../models/HorarioTutor');
const Tutoria       = require('../models/Tutoria');
const Notificacion  = require('../models/Notificacion');

/* ═══════════════════════════════════════════════════════════════
   DATOS: USUARIOS
═══════════════════════════════════════════════════════════════ */
const ADMINS = [
    { nombre: 'Administrador TI', correo: 'admin.ti@campusucc.edu.co', password: 'Admin2026!', rol: 'admin' },
];

const TUTORES = [
    { nombre: 'Daniel Bejarano Segura',        correo: 'bejaranods@campusucc.edu.co',   password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Lina Maria Zabala Arango',       correo: 'zabalama@campusucc.edu.co',     password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Lina Shirley Lopez Hernandez',   correo: 'lopezlsh@campusucc.edu.co',     password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Francy Yaneth Patiño Martinez',  correo: 'patinofyp@campusucc.edu.co',    password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Carlos Ignacio Torres Londoño',  correo: 'torresc@campusucc.edu.co',      password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Mayra Alexandra Amador Ladino',  correo: 'amadormal@campusucc.edu.co',    password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Ana Milena Gutierrez Cardenas',  correo: 'gutierrezam@campusucc.edu.co',  password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Myriam Cristina Reyes Ortiz',    correo: 'reyesmc@campusucc.edu.co',      password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Piedad Chica Sosa',              correo: 'chicaps@campusucc.edu.co',      password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Lina Marcela Cespedes Garcia',   correo: 'cespedesml@campusucc.edu.co',   password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Pedro Fernando Osorio Tejada',   correo: 'osoriopt@campusucc.edu.co',     password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Luis Eduardo Rey Huertas',       correo: 'reyleh@campusucc.edu.co',       password: 'Tutoria2026', rol: 'tutor' },
    { nombre: 'Yomaira Guzman Paredes',         correo: 'guzmanpy@campusucc.edu.co',     password: 'Tutoria2026', rol: 'tutor' },
];

// Monitores: son estudiantes que también prestan servicio como tutores.
// Se crea un Usuario con rol='tutor' (para que puedan gestionar tutorías)
// y además un documento Estudiante (para que figuren en el registro estudiantil).
const MONITORES = [
    {
        nombre:   'Javier Esneider Nieto Bello',
        correo:   'javier.nietob@campusucc.edu.co',
        password: 'Monitor2026',
        rol:      'tutor',
        codigo:   '200001',   // código estudiantil del monitor
        celular:  '3177053998',
    },
    {
        nombre:   'Jhilmer Alejandro Cala Celis',
        correo:   'jhilmer.cala@campusucc.edu.co',
        password: 'Monitor2026',
        rol:      'tutor',
        codigo:   '200002',
        celular:  '3204103866',
    },
];

// Formato: nombre, correo institucional, contraseña inicial, código UCC (6 dígitos)
// ⚠ Actualiza los correos y códigos con los datos reales de UCC antes de correr en producción
const ESTUDIANTES = [
    { nombre: 'Jose Agudelo Martinez',       correo: 'agudelomj@campusucc.edu.co',    password: 'Estudio2026', rol: 'estudiante', codigo: '100001' },
    { nombre: 'Viviana Alderete Conde',       correo: 'alderetecv@campusucc.edu.co',   password: 'Estudio2026', rol: 'estudiante', codigo: '100002' },
    { nombre: 'Maikol Ardila Maldonado',      correo: 'ardilam@campusucc.edu.co',      password: 'Estudio2026', rol: 'estudiante', codigo: '100003' },
    { nombre: 'Jesus Artunduaga Collazoz',    correo: 'artunduagaj@campusucc.edu.co',  password: 'Estudio2026', rol: 'estudiante', codigo: '100004' },
    { nombre: 'Samuel Baquero Montana',       correo: 'baquerom@campusucc.edu.co',     password: 'Estudio2026', rol: 'estudiante', codigo: '100005' },
    { nombre: 'Olfan Beltran Rodriguez',      correo: 'beltranro@campusucc.edu.co',    password: 'Estudio2026', rol: 'estudiante', codigo: '100006' },
    { nombre: 'Wilmer Cando Ajala',           correo: 'candoaw@campusucc.edu.co',      password: 'Estudio2026', rol: 'estudiante', codigo: '100007' },
    { nombre: 'Jaider Cardona Vera',          correo: 'cardonavj@campusucc.edu.co',    password: 'Estudio2026', rol: 'estudiante', codigo: '100008' },
    { nombre: 'Andres Castro Aguirre',        correo: 'castroaa@campusucc.edu.co',     password: 'Estudio2026', rol: 'estudiante', codigo: '100009' },
    { nombre: 'Alejandro Diaz Gomez',         correo: 'diazga@campusucc.edu.co',       password: 'Estudio2026', rol: 'estudiante', codigo: '100010' },
    { nombre: 'Jhon Garcia Correcha',         correo: 'garciacj@campusucc.edu.co',     password: 'Estudio2026', rol: 'estudiante', codigo: '100011' },
    { nombre: 'David Gomez Gualteros',        correo: 'gomezgd@campusucc.edu.co',      password: 'Estudio2026', rol: 'estudiante', codigo: '100012' },
    { nombre: 'Karol Gutierrez Ramos',        correo: 'gutierrezrk@campusucc.edu.co',  password: 'Estudio2026', rol: 'estudiante', codigo: '100013' },
    { nombre: 'Isabella Hernandez Parrado',   correo: 'hernandezpi@campusucc.edu.co',  password: 'Estudio2026', rol: 'estudiante', codigo: '100014' },
    { nombre: 'Juan Holguin Pulido',          correo: 'holguinpj@campusucc.edu.co',    password: 'Estudio2026', rol: 'estudiante', codigo: '100015' },
    { nombre: 'Juan Martinez Molina',         correo: 'martinezm@campusucc.edu.co',    password: 'Estudio2026', rol: 'estudiante', codigo: '100016' },
    { nombre: 'Camilo Mora Pena',             correo: 'morapc@campusucc.edu.co',       password: 'Estudio2026', rol: 'estudiante', codigo: '100017' },
    { nombre: 'Julian Perez Lopez',           correo: 'perezlj@campusucc.edu.co',      password: 'Estudio2026', rol: 'estudiante', codigo: '100018' },
    { nombre: 'Juan Rojas Morales',           correo: 'rojasmj@campusucc.edu.co',      password: 'Estudio2026', rol: 'estudiante', codigo: '100019' },
    { nombre: 'Juan Sandoval Ardila',         correo: 'sandovalaj@campusucc.edu.co',   password: 'Estudio2026', rol: 'estudiante', codigo: '100020' },
    { nombre: 'Juan Sierra Rodriguez',        correo: 'sierrarj@campusucc.edu.co',     password: 'Estudio2026', rol: 'estudiante', codigo: '100021' },
    { nombre: 'Yerson Solano Alfonso',        correo: 'solanoay@campusucc.edu.co',     password: 'Estudio2026', rol: 'estudiante', codigo: '100022' },
    { nombre: 'Miguel Valencia Mendez',       correo: 'valenciamm@campusucc.edu.co',   password: 'Estudio2026', rol: 'estudiante', codigo: '100023' },
    { nombre: 'Nikol Velandia Ortiz',         correo: 'velandiaon@campusucc.edu.co',   password: 'Estudio2026', rol: 'estudiante', codigo: '100024' },
];

/* ═══════════════════════════════════════════════════════════════
   DATOS: CATÁLOGO
═══════════════════════════════════════════════════════════════ */
const JAVIER = [
  { horario: 'Lunes 12:00-17:00',     aula: '309', tutor: 'Javier Esneider Nieto Bello' },
  { horario: 'Martes 12:00-17:00',    aula: '309', tutor: 'Javier Esneider Nieto Bello' },
  { horario: 'Miércoles 8:00-10:00',  aula: '309', tutor: 'Javier Esneider Nieto Bello' },
  { horario: 'Miércoles 14:00-17:00', aula: '309', tutor: 'Javier Esneider Nieto Bello' },
  { horario: 'Jueves 12:00-17:00',    aula: '309', tutor: 'Javier Esneider Nieto Bello' },
  { horario: 'Viernes 8:00-12:00',    aula: '309', tutor: 'Javier Esneider Nieto Bello' },
];
const JHILMER = [
  { horario: 'Lunes 13:00-17:00',     aula: '309', tutor: 'Jhilmer Alejandro Cala Celis' },
  { horario: 'Martes 13:00-17:00',    aula: '309', tutor: 'Jhilmer Alejandro Cala Celis' },
  { horario: 'Miércoles 9:00-11:00',  aula: '309', tutor: 'Jhilmer Alejandro Cala Celis' },
  { horario: 'Miércoles 13:00-17:00', aula: '309', tutor: 'Jhilmer Alejandro Cala Celis' },
  { horario: 'Jueves 13:00-17:00',    aula: '309', tutor: 'Jhilmer Alejandro Cala Celis' },
];

const CATALOGO = {
  'I': [
    { nombre: 'Cálculo Diferencial', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
      ...JAVIER,
    ]},
    { nombre: 'Lógica Matemática', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Lunes 16:00-19:00',     aula: '210' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 15:00-16:00',   aula: '207' },
      { tutor: 'Lina Shirley Lopez Hernandez',     horario: 'Viernes 18:00-19:00',   aula: '206' },
      ...JAVIER,
    ]},
    { nombre: 'Algoritmia', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
      ...JAVIER,
      ...JHILMER,
    ]},
    { nombre: 'Contexto de la Ing. de Sistemas', tutores: [] },
  ],
  'II': [
    { nombre: 'Análisis de Sistemas', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
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
      ...JAVIER,
    ]},
    { nombre: 'Téc. de Medición de Variables Físicas', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Myriam Cristina Reyes Ortiz',      horario: 'Lunes 10:00-12:00',     aula: '213' },
    ]},
    { nombre: 'Herramientas Computacionales', tutores: [
      ...JAVIER,
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
  ],
  'IV': [
    { nombre: 'Estadística Inferencial', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
    ]},
    { nombre: 'Arquitectura de Computadores', tutores: [] },
    { nombre: 'Programación Orientada a Objetos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
      ...JAVIER,
      ...JHILMER,
    ]},
    { nombre: 'Ecuaciones Diferenciales', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Ana Milena Gutierrez Cardenas',    horario: 'Lunes 7:00-12:00',      aula: '207' },
    ]},
  ],
  'V': [
    { nombre: 'Propagación de Señales y Ondas', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
    ]},
    { nombre: 'Diseño de Bases de Datos', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
      ...JAVIER,
    ]},
    { nombre: 'Sistemas Operativos', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Diseño Orientado a Objetos', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
    ]},
    { nombre: 'Análisis Numérico', tutores: [] },
    { nombre: 'Matemáticas Especiales', tutores: [
      { tutor: 'Daniel Bejarano Segura',           horario: 'Martes 18:00-19:00',    aula: '210' },
      { tutor: 'Daniel Bejarano Segura',           horario: 'Jueves 18:00-19:00',    aula: '210' },
    ]},
  ],
  'VI': [
    { nombre: 'Sistemas Distribuidos', tutores: [] },
    { nombre: 'Creación de Bases de Datos', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      ...JAVIER,
    ]},
    { nombre: 'Interconexión de Redes de Comp.', tutores: [
      ...JAVIER,
    ]},
    { nombre: 'Patrones de Diseño Orientado a Objetos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
    ]},
    { nombre: 'Física, Electricidad y Magnetismo', tutores: [
      { tutor: 'Lina Maria Zabala Arango',         horario: 'Martes 16:00-18:00',    aula: '207' },
      { tutor: 'Myriam Cristina Reyes Ortiz',      horario: 'Lunes 10:00-12:00',     aula: '213' },
    ]},
    { nombre: 'Asp. Administrativos y Económicos', tutores: [] },
  ],
  'VII': [
    { nombre: 'Aplicaciones de la Inteligencia Artificial', tutores: [
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
    { nombre: 'Electiva Específica I', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Gestión de Bases de Datos', tutores: [
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
      ...JAVIER,
    ]},
    { nombre: 'Diseño de Modelos de Seguridad', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
    ]},
    { nombre: 'Ing. del Software y Requerimientos', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
    ]},
    { nombre: 'Ingeniería Económica', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
    { nombre: 'Asp. Contables para la Gestión de Proy.', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
  ],
  'VIII': [
    { nombre: 'Form. y Evaluación de Proyectos', tutores: [
      { tutor: 'Luis Eduardo Rey Huertas',         horario: 'Martes 16:00-18:00',    aula: '210' },
    ]},
    { nombre: 'Gestión de Seguridad Inf.', tutores: [
      { tutor: 'Carlos Ignacio Torres Londoño',    horario: 'Lunes 14:00-16:00',     aula: '208' },
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
    { nombre: 'Minería de Datos', tutores: [
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 13:00-14:00', aula: '206' },
    ]},
    { nombre: 'Electiva Específica II', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Met. Inv. Aplic. a la Mod. Grado', tutores: [] },
    { nombre: 'Téc. de Validación y Simulación', tutores: [
      { tutor: 'Piedad Chica Sosa',                horario: 'Viernes 16:00-18:00',   aula: '110' },
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
  ],
  'IX': [
    { nombre: 'Electiva Específica III', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Gerencia de Proyectos', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Lunes 17:00-18:00',     aula: '206' },
      { tutor: 'Mayra Alexandra Amador Ladino',    horario: 'Miércoles 7:00-10:00',  aula: '207' },
    ]},
    { nombre: 'Diseño de Interfaces', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
    ]},
    { nombre: 'Dllo. de Sist. Inf. y Multimediales', tutores: [
      { tutor: 'Lina Marcela Cespedes Garcia',     horario: 'Viernes 16:00-18:00',   aula: '208' },
    ]},
    { nombre: 'Arq. y Modelamiento de Software', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
    { nombre: 'Construcción del Trabajo de Grado', tutores: [] },
  ],
  'X': [
    { nombre: 'Electiva Específica IV', tutores: [
      { tutor: 'Pedro Fernando Osorio Tejada',     horario: 'Viernes 16:00-18:00',   aula: '206' },
    ]},
    { nombre: 'Práctica Emp. Aplic. al Trabajo de Grado', tutores: [] },
    { nombre: 'Aspectos Generales del Medio Ambiente',    tutores: [] },
    { nombre: 'Gestión y Calidad del Software', tutores: [
      { tutor: 'Francy Yaneth Patiño Martinez',    horario: 'Jueves 17:00-18:00',    aula: '208' },
    ]},
    { nombre: 'Auditoria de Sistemas', tutores: [
      { tutor: 'Yomaira Guzman Paredes',           horario: 'Jueves 14:00-17:00',    aula: '208' },
    ]},
    { nombre: 'Ley y Ética para Ingeniería',              tutores: [] },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');

    /* ── 1. Limpiar colecciones transaccionales ── */
    console.log('🗑  Limpiando datos de prueba...');
    const [t, n] = await Promise.all([
        Tutoria.deleteMany({}),
        Notificacion.deleteMany({}),
    ]);
    console.log(`   tutorias eliminadas:       ${t.deletedCount}`);
    console.log(`   notificaciones eliminadas: ${n.deletedCount}`);

    /* ── 2. Limpiar catálogo (se reconstruirá con referencias correctas) ── */
    console.log('\n🗑  Limpiando catálogo...');
    await Promise.all([
        Materia.deleteMany({}),
        HorarioTutor.deleteMany({}),
    ]);
    console.log('   materias y horariotutors limpiados');

    /* ── 3. Limpiar y recrear usuarios + docentes + estudiantes ── */
    console.log('\n👤 Creando usuarios, docentes y estudiantes...');
    await Promise.all([
        Usuario.deleteMany({}),
        Docente.deleteMany({}),
        Estudiante.deleteMany({}),
        Administrador.deleteMany({}),
    ]);

    // Eliminar índices obsoletos (campo "usuario") que quedaron del esquema anterior
    const db = mongoose.connection.db;
    const dropIdx = async (col, idx) => {
        try { await db.collection(col).dropIndex(idx); } catch (_) { /* ya no existe */ }
    };
    await Promise.all([
        dropIdx('docentes',       'usuario_1'),
        dropIdx('estudiantes',    'usuario_1'),
        dropIdx('administradors', 'usuario_1'),
        dropIdx('horariotutors',  'tutor_1'),
        dropIdx('horariotutors',  'materia_1'),
    ]);

    let creados = 0, docentesCreados = 0, estudiantesCreados = 0, adminsCreados = 0, monitoresCreados = 0;
    for (const u of [...ADMINS, ...TUTORES, ...ESTUDIANTES]) {
        const { codigo, ...datosUsuario } = u;
        const usuarioDoc = await Usuario.create(datosUsuario);
        console.log(`   ✅ ${u.rol.padEnd(10)} ${u.nombre}`);
        creados++;

        if (u.rol === 'tutor') {
            await Docente.create({
                nombre:       usuarioDoc.nombre,
                correo:       usuarioDoc.correo,
                departamento: 'Ingeniería de Sistemas',
            });
            docentesCreados++;
        } else if (u.rol === 'estudiante') {
            await Estudiante.create({
                nombre: usuarioDoc.nombre,
                correo: usuarioDoc.correo,
                codigo: codigo,
            });
            estudiantesCreados++;
        } else if (u.rol === 'admin') {
            await Administrador.create({
                nombre: usuarioDoc.nombre,
                correo: usuarioDoc.correo,
            });
            adminsCreados++;
        }
    }

    // Monitores: acceden como tutores pero también figuran en el registro estudiantil
    for (const m of MONITORES) {
        const { codigo, celular, ...datosUsuario } = m;
        const usuarioDoc = await Usuario.create(datosUsuario);
        await Docente.create({
            nombre:       usuarioDoc.nombre,
            correo:       usuarioDoc.correo,
            departamento: 'Ingeniería de Sistemas',
        });
        await Estudiante.create({
            nombre: usuarioDoc.nombre,
            correo: usuarioDoc.correo,
            codigo: codigo,
        });
        console.log(`   ✅ monitor     ${m.nombre} (tutor + estudiante)`);
        creados++;
        docentesCreados++;
        estudiantesCreados++;
        monitoresCreados++;
    }

    console.log(`   Total: ${creados} usuarios (${adminsCreados} admins, ${docentesCreados} docentes, ${estudiantesCreados} estudiantes, ${monitoresCreados} monitores)`);

    /* ── 4. Crear catálogo con ObjectId reales ── */
    console.log('\n📚 Creando catálogo...');
    const tutorCache = new Map();
    const getTutor   = async (nombre) => {
        if (!tutorCache.has(nombre)) {
            const doc = await Usuario.findOne({ nombre, rol: 'tutor' }).select('_id nombre correo');
            tutorCache.set(nombre, doc);
        }
        return tutorCache.get(nombre);
    };

    let totalMaterias = 0, totalHorarios = 0, omitidos = 0;

    for (const [semestre, materias] of Object.entries(CATALOGO)) {
        for (const m of materias) {
            const materia = await Materia.create({ nombre: m.nombre, semestre });
            totalMaterias++;
            for (const h of m.tutores) {
                const tutorDoc = await getTutor(h.tutor);
                if (!tutorDoc) { omitidos++; continue; }
                await HorarioTutor.create({
                    tutor:   { id: tutorDoc._id.toString(), nombre: tutorDoc.nombre, correo: tutorDoc.correo ?? '' },
                    materia: { id: materia._id.toString(),  nombre: materia.nombre,  semestre: materia.semestre },
                    horario: h.horario,
                    aula:    h.aula,
                });
                totalHorarios++;
            }
        }
    }

    /* ── 5. Resumen final ── */
    console.log('\n════════════════════════════════════');
    console.log('🎉 Base de datos lista:');
    console.log(`   👥 usuarios:      ${creados}`);
    console.log(`   🔐 admins:        ${adminsCreados}`);
    console.log(`   🧑‍🏫 docentes:      ${docentesCreados}`);
    console.log(`   🎓 estudiantes:   ${estudiantesCreados}`);
    console.log(`   📖 materias:      ${totalMaterias}`);
    console.log(`   🗓  horariotutors: ${totalHorarios}`);
    console.log(`   📋 tutorias:      0  (limpias)`);
    console.log(`   🔔 notificaciones:0  (limpias)`);
    if (omitidos > 0) console.warn(`\n   ⚠  ${omitidos} horarios omitidos por tutor no encontrado`);
    console.log('════════════════════════════════════\n');

    console.log('📌 Credenciales de acceso:');
    console.log('   Admin       → admin.ti@campusucc.edu.co         /  Admin2026!');
    console.log('   Tutores     → contraseña: Tutoria2026            (ej: torresc@campusucc.edu.co)');
    console.log('   Estudiantes → contraseña: Estudio2026            (ej: agudelomj@campusucc.edu.co)');
    console.log('   Monitores   → contraseña: Monitor2026            (ej: javier.nietob@campusucc.edu.co)');

    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
