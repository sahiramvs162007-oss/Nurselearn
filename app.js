require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");
const connectDB = require("./config/db");
const { getUnreadCount } = require("./utils/notificationService");

const app = express();

// ── BASE DE DATOS ─────────────────────────────────────────────────────────────
connectDB();

// ── VIEW ENGINE ───────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "sena_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 horas
  }),
);

app.use(flash());

// Pasar datos de sesión a todas las vistas
app.use(async (req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentPath = req.path;
  res.locals.unreadNotifications =
    req.session && req.session.userId
      ? await getUnreadCount(req.session.userId)
      : 0;
  next();
});

// ── RUTAS ─────────────────────────────────────────────────────────────────────
app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/instructor", require("./routes/instructor"));
app.use("/aprendiz", require("./routes/aprendiz"));
app.use("/notificaciones", require("./routes/notifications"));

// Rutas de desarrollo (solo en entorno no productivo)
if (process.env.NODE_ENV !== "production") {
  app.use("/dev", require("./routes/dev"));
}

// Redirect raíz → login
app.get("/", (req, res) => res.redirect("/auth/login"));

// ── ERROR 404 ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render("error", {
    titulo: "Página no encontrada",
    mensaje: "La ruta que buscas no existe.",
    user: req.session.userName || null,
  });
});

// ── ERROR 500 ─────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", {
    titulo: "Error del servidor",
    mensaje: err.message || "Ocurrió un error inesperado.",
    user: req.session.userName || null,
  });
});

// ── ARRANCAR ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Entorno: ${process.env.NODE_ENV || "development"}`);
});
