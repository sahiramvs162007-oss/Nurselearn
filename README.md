# SENA Inglés — Sistema de Gestión de Actividades

Sistema web para aprendices de **Enfermería del SENA** para aprender inglés de forma didáctica.

## Stack

- **Backend:** Node.js + Express
- **Base de datos:** MongoDB + Mongoose
- **Vistas:** EJS (MPA clásica)
- **Estilos:** CSS nativo
- **Archivos:** Multer

---

## Requisitos previos

- Node.js ≥ 18
- MongoDB corriendo localmente (`mongodb://localhost:27017`)

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# El archivo .env ya viene creado con valores por defecto.
# Edítalo si necesitas cambiar MONGODB_URI o SESSION_SECRET.

# 3. Crear el usuario administrador inicial
node seed.js

# 4. Arrancar el servidor
npm run dev        # con nodemon (desarrollo)
# o
npm start          # sin nodemon (producción)
```

El sistema queda disponible en **http://localhost:3000**

---

## Credenciales iniciales

| Rol   | Email                  | Contraseña |
|-------|------------------------|------------|
| Admin | admin@sena.edu.co      | Admin1234  |

> ⚠️ Cambia la contraseña del admin después del primer login.

---

## Flujo de configuración inicial (Admin)

1. **Crear Módulos** (`/admin/modulos`) — los temas grandes del SENA.
2. **Crear RAPs** (`/admin/raps`) — resultados de aprendizaje, asociados a módulos.
3. **Crear Fichas** (`/admin/fichas`) — grupos de formación de enfermería.
4. **Crear Usuarios** (`/admin/usuarios`) — instructores y aprendices.
5. **Asignaciones** (`/admin/asignaciones`):
   - Asignar instructor → ficha + RAPs que impartirá.
   - Asignar aprendices → ficha.
6. El instructor puede ahora crear actividades y los aprendices pueden ingresar.

---

## Estructura del proyecto

```
sena-ingles/
├── app.js                  # Entrada principal
├── seed.js                 # Script de datos iniciales
├── config/
│   └── db.js               # Conexión MongoDB
├── models/
│   ├── User.js             # Admin, Instructor, Aprendiz
│   ├── Modulo.js           # Temas grandes
│   ├── RAP.js              # Resultados de Aprendizaje
│   ├── Ficha.js            # Grupos de formación
│   ├── Actividad.js        # Blog / Juego / Evaluación
│   └── Entrega.js          # Submissions de aprendices
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── instructorController.js
│   └── aprendizController.js
├── routes/
│   ├── auth.js
│   ├── admin.js
│   ├── instructor.js
│   └── aprendiz.js
├── middleware/
│   ├── auth.js             # isAuth, hasRole
│   └── upload.js           # Multer
├── views/
│   ├── auth/login.ejs
│   ├── partials/sidebar.ejs
│   ├── admin/              # dashboard, modulos, raps, fichas, usuarios, asignaciones, reportes
│   ├── instructor/         # dashboard, actividades, crear-actividad, entregas, calificar, clonar, reportes
│   ├── aprendiz/           # dashboard, modulo, actividad, historial
│   └── error.ejs
└── public/
    ├── css/main.css
    └── uploads/            # Archivos subidos por aprendices
```

---

## Tipos de actividad

| Tipo        | Calificación  | Intentos     | Notas                                  |
|-------------|---------------|--------------|----------------------------------------|
| Blog        | Manual        | Ilimitados*  | El instructor revisa y asigna %        |
| Juego       | Automática    | Ilimitados   | 100% al completar; 0% si pierde        |
| Evaluación  | Automática    | Configurable | Opción múltiple, aprobado ≥ 70%        |

*El instructor decide si habilita segundo intento manualmente o automáticamente.

---

## Próximos pasos (pendiente)

- Implementar los juegos interactivos (emparejar, ahorcado, sopa de letras).
- Editor de texto enriquecido en la vista de blog (ej. Quill.js o TinyMCE CDN).
- Bloqueo manual de RAPs/actividades individuales por el instructor.
- Desbloqueo de módulos por parte del instructor.
- Paginación en tablas con muchos registros.
