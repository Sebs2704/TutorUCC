# 🎓 TutorUCC — Plataforma de Tutorías Académicas

Sistema web para gestión de tutorías de la Universidad Cooperativa de Colombia.

---

## 📁 Estructura del proyecto

```
TutorUCC/
├── src/
│   ├── index.html              ← Login + Dashboard (frontend)
│   ├── image/                  ← Logos e imágenes
│   ├── css/
│   │   ├── tokens.css          ← Variables de diseño
│   │   ├── base.css            ← Estilos base
│   │   ├── layout.css          ← Layout general
│   │   ├── components.css      ← Componentes reutilizables
│   │   └── pages/
│   │       ├── login.css
│   │       └── dashboard.css
│   └── js/
│       ├── app.js              ← Lógica principal + conexión al backend
│       ├── utils/
│       │   ├── dom.js
│       │   └── validators.js
│       ├── data/
│       │   ├── tutorias.js
│       │   ├── calendario.js
│       │   └── inasistencias.js
│       └── components/
│           ├── StepsComponent.js
│           ├── TutoriasComponent.js
│           ├── CalendarComponent.js
│           ├── AgendadasComponent.js
│           ├── InasistenciasComponent.js
│           └── SummaryComponent.js
└── backend/
    ├── server.js               ← Servidor Express
    ├── .env                    ← Variables de entorno (NO subir a GitHub)
    ├── config/db.js            ← Conexión MongoDB
    ├── models/Usuario.js       ← Modelo de usuario
    ├── controllers/authController.js
    ├── routes/auth.js
    └── middlewares/auth.js
```

---

## ⚙️ Instalación y uso

### 1. Clonar el repositorio
```bash
git clone https://github.com/Sebs2704/TutorUCC.git
cd TutorUCC
```

### 2. Configurar el backend
```bash
cd backend
npm install
```

### 3. Configurar el archivo `.env`
Crea un archivo `backend/.env` con el siguiente contenido:
```env
PORT=3000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxx.mongodb.net/TutorUCC?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=tutorucc_clave_super_secreta_2026
JWT_EXPIRES_IN=1d
```
> Reemplaza `<usuario>` y `<password>` con tus credenciales de MongoDB Atlas.

### 4. Iniciar el servidor
```bash
npm run dev
```
Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ MongoDB conectado: ...
```

### 5. Abrir el frontend
Abre `src/index.html` directamente en el navegador.

---

## 🔐 API Endpoints

| Método | Ruta                  | Descripción           | Auth |
|--------|-----------------------|-----------------------|------|
| POST   | /api/auth/registro    | Registrar usuario     | No   |
| POST   | /api/auth/login       | Iniciar sesión        | No   |
| GET    | /api/auth/perfil      | Ver perfil            | Sí   |

### Crear usuario de prueba
```powershell
curl -X POST http://localhost:3000/api/auth/registro `
  -H "Content-Type: application/json" `
  -d '{"nombre":"Tu Nombre","correo":"correo@campusucc.edu.co","password":"123456","rol":"estudiante"}'
```

---

## 👥 Roles disponibles
- `estudiante` — Acceso al dashboard de estudiante
- `tutor` — Acceso al dashboard de tutor
- `admin` — Acceso al panel de administración

---

## 🛠️ Tecnologías usadas
- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** Node.js, Express.js
- **Base de datos:** MongoDB Atlas + Mongoose
- **Autenticación:** JWT (JSON Web Tokens)
- **Seguridad:** bcryptjs para encriptación de contraseñas

---

## ⚠️ Notas importantes
- El archivo `.env` **no debe subirse a GitHub** (está en `.gitignore`)
- Cada integrante debe crear su propio `.env` con sus credenciales
- El backend debe estar corriendo para que el login funcione
