# Estructura de Base de Datos — TutorUCC (MongoDB)

## Arquitectura NoSQL

MongoDB es **desnormalizado**. No hay "relaciones" como en SQL — cada colección es casi independiente. Los ObjectIds se usan como referencias, pero se resuelven en la aplicación con `.populate()`, no en la BD.

---

## 📦 Colecciones

### 1. **usuarios**
Colección de autenticación. Todos los roles (estudiante, tutor, admin).

```javascript
{
  _id: ObjectId,
  nombre: String,
  correo: String,        // email único
  password: String,      // bcrypt hash
  rol: 'estudiante' | 'tutor' | 'admin',
  activo: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ correo: 1 }` (único)

---

### 2. **estudiantes**
Perfil del estudiante — separado de `usuarios` para permitir datos específicos.

```javascript
{
  _id: ObjectId,
  usuario: ObjectId,          // ref a usuarios (no relación en BD)
  nombre: String,
  correo: String,
  codigo: String,             // 6 dígitos, único
  activo: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ usuario: 1 }` (único)
- `{ codigo: 1 }` (único)

---

### 3. **docentes**
Perfil del tutor — separado de `usuarios`.

```javascript
{
  _id: ObjectId,
  usuario: ObjectId,          // ref a usuarios (no relación en BD)
  nombre: String,
  correo: String,
  departamento: String,
  activo: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ usuario: 1 }` (único)

---

### 4. **materias**
Catálogo de materias ofertadas.

```javascript
{
  _id: ObjectId,
  nombre: String,             // "Cálculo I", "Física"
  semestre: String,           // "I", "II", "III", etc.
  activo: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ semestre: 1 }`
- `{ nombre: 1 }`

---

### 5. **horariotutores**
Disponibilidad de tutores para cada materia. **Única referencia estructurada**.

```javascript
{
  _id: ObjectId,
  tutor: ObjectId,            // ref a usuarios (tutor)
  materia: ObjectId,          // ref a materias
  horario: String,            // "Lunes 18:00-19:00"
  aula: String,               // "Aula 201"
  activo: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ tutor: 1, activo: 1 }`
- `{ materia: 1 }`
- `{ tutor: 1, horario: 1, aula: 1 }`

---

### 6. **tutorias**
Solicitudes de tutoría. **Desnormaliza datos** para historial rápido (sin populate).

```javascript
{
  _id: ObjectId,
  estudiante: ObjectId,       // ref a usuarios (estudiante)
  tutor: ObjectId,            // ref a usuarios (tutor)
  materia: ObjectId,          // ref a materias
  horarioTutor: ObjectId,     // ref a horariotutores (nullable)
  
  // Datos desnormalizados (snapshot para correos + historial)
  nombreEstudiante: String,
  correoEstudiante: String,
  semestre: String,
  horario: String,
  aula: String,
  
  // Lógica de sesión
  comentario: String,
  estado: 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada',
  fechaTutoria: Date,
  motivoCancelacion: String,
  
  // Reasignación
  reasignadaDe: ObjectId,     // ref a otra tutoria
  
  creadoEn: Date
}
```

**Índices:**
- `{ tutor: 1, estado: 1 }`
- `{ estudiante: 1, estado: 1 }`
- `{ tutor: 1, horario: 1, fechaTutoria: 1 }`

---

### 7. **notificaciones**
Feed de notificaciones. Desnormalizado sin referencias.

```javascript
{
  _id: ObjectId,
  destinatario: ObjectId,     // ref a usuarios
  tipo: 'confirmacion' | 'cancelacion_tutor' | 'reasignacion' | 'nueva_tutoria',
  tutoria: ObjectId,          // ref a tutorias (optional)
  mensaje: String,
  leida: Boolean,
  creadoEn: Date
}
```

**Índices:**
- `{ destinatario: 1, leida: 1 }`
- `{ creadoEn: -1 }`

---

## 📋 Relaciones (Aplicación, no BD)

```
usuarios (root)
  ├─ estudiantes: usuario → usuarios._id
  ├─ docentes: usuario → usuarios._id
  └─ tutorias: estudiante/tutor → usuarios._id

materias
  └─ tutorias: materia → materias._id
  
horariotutores
  ├─ tutor → usuarios._id
  ├─ materia → materias._id
  └─ tutorias: horarioTutor → horariotutores._id

notificaciones
  └─ destinatario → usuarios._id
  └─ tutoria → tutorias._id (optional)
```

---

## 🔍 Patrones de Consulta

### Obtener tutorías del estudiante (con detalles)
```javascript
db.tutorias
  .find({ estudiante: userId })
  .populate('tutor', 'nombre')
  .populate('materia', 'nombre semestre')
```

### Buscar tutores por materia
```javascript
const materiaId = ObjectId("...");
db.horariotutores
  .find({ materia: materiaId, activo: true })
  .populate('tutor', 'nombre correo')
```

### Estadísticas (sin populate)
```javascript
db.tutorias.aggregate([
  { $group: { _id: '$estado', total: { $sum: 1 } } }
])
```

---

## ⚙️ Notas Importantes

1. **Desnormalización**: `nombreEstudiante`, `correoEstudiante` en tutorias son snapshots para historial y correos — no cambian si el usuario se actualiza.

2. **No hay cascada**: Eliminar un usuario NO elimina sus tutorias (no hay FK constraints).

3. **Índices mínimos**: Solo en campos buscados frecuentemente (filtros, sorts).

4. **`.populate()` en app**: Las "relaciones" se resuelven en la aplicación con Mongoose, no en la BD.

5. **Múltiples colecciones por rol**: `usuarios` + `estudiantes`/`docentes` permite datos específicos sin nullable fields.
