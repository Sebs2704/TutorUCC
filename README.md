# 🎓 TutorUCC — Instrucciones de instalación

## Estructura del proyecto
```
TutorUCC/
├── src/
│   ├── index.html        ← Login (frontend)
│   ├── Styles.css
│   └── Imagenes/
└── backend/
    ├── server.js         ← Servidor principal
    ├── .env              ← Variables de entorno (configura esto primero)
    ├── config/db.js      ← Conexión MongoDB
    ├── models/Usuario.js ← Modelo de usuario
    ├── controllers/authController.js
    ├── routes/auth.js
    └── middlewares/auth.js
```

---

## ⚙️ Pasos para correr el proyecto

### 1. Configurar MongoDB Atlas
1. Ve a https://mongodb.com/atlas y crea una cuenta gratuita
2. Crea un **cluster gratuito (M0)**
3. En "Database Access" crea un usuario con contraseña
4. En "Network Access" agrega tu IP (o 0.0.0.0/0 para permitir todo)
5. En "Connect" → "Drivers" copia tu connection string

### 2. Configurar el archivo .env
Abre `backend/.env` y reemplaza los valores:
```
MONGO_URI=mongodb+srv://TU_USUARIO:TU_PASSWORD@TU_CLUSTER.mongodb.net/tutorucc?retryWrites=true&w=majority
JWT_SECRET=cualquier_cadena_larga_y_secreta
```

### 3. Instalar dependencias y correr el backend
```bash
cd backend
npm install
npm run dev
```
Deberías ver:
```
🚀 Servidor corriendo en http://localhost:3000
✅ MongoDB conectado: ...
```

### 4. Crear un usuario de prueba
Con el servidor corriendo, abre otra terminal y ejecuta:
```bash
curl -X POST http://localhost:3000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d "{\"nombre\":\"Admin\",\"correo\":\"admin@campusucc.edu.co\",\"password\":\"123456\",\"rol\":\"admin\"}"
```
O usa Postman / Thunder Client con:
- **URL:** POST http://localhost:3000/api/auth/registro
- **Body (JSON):**
```json
{
  "nombre": "Tu Nombre",
  "correo": "tu.correo@campusucc.edu.co",
  "password": "tu_password",
  "rol": "estudiante"
}
```

### 5. Abrir el frontend
Abre `src/index.html` directamente en el navegador y prueba el login.

---

## 🔐 Endpoints disponibles

| Método | Ruta                    | Descripción              | Auth |
|--------|-------------------------|--------------------------|------|
| POST   | /api/auth/registro      | Registrar usuario        | No   |
| POST   | /api/auth/login         | Iniciar sesión           | No   |
| GET    | /api/auth/perfil        | Ver perfil               | Sí   |
