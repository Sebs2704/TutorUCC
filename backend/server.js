const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/db');

const app = express();
app.set('trust proxy', 1);

// Conectar a MongoDB
conectarDB();

// Middlewares
const ALLOWED_ORIGINS = process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://tutorucc.up.railway.app',
        'https://tutorucc-production.up.railway.app',
        'https://serene-manifestation-production-c7bf.up.railway.app'
      ];

app.use(cors({
    origin: (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(`CORS bloqueado: origen no permitido → ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/tutorias',       require('./routes/tutorias'));
app.use('/api/catalogo',       require('./routes/catalogo'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/admin',          require('./routes/admin'));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: '🎓 API TutorUCC funcionando correctamente' });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

// Manejador global de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack || err.message || err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ mensaje: err.message || 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
