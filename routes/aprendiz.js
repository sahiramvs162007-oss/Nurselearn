const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/aprendizController");
const { isAuth, hasRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Previsualización: accesible también para instructores (botón "Ver como aprendiz")
router.get(
  "/actividad/:id",
  isAuth,
  hasRole("aprendiz", "instructor"),
  ctrl.getActividad,
);

router.use(isAuth, hasRole("aprendiz"));

router.get("/", ctrl.getDashboard);
router.get("/modulo/:moduloId", ctrl.getModulo);

// Entregas
router.post("/entregar", upload.single("archivo"), ctrl.postEntregar);
router.post("/juego/completar", ctrl.postCompletarJuego);
router.post("/evaluacion/:id/entregar", ctrl.postEntregarEval);

// Historial
router.get("/historial", ctrl.getHistorial);

module.exports = router;
