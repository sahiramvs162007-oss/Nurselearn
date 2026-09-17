const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/aprendizController");
const { isAuth, hasRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(isAuth, hasRole("aprendiz"));

router.get("/", ctrl.getDashboard);
router.get("/modulo/:moduloId", ctrl.getModulo);
router.get("/actividad/:id", ctrl.getActividad);

// Entregas
router.post("/entregar", upload.single("archivo"), ctrl.postEntregar);
router.post("/juego/completar", ctrl.postCompletarJuego);
router.post("/evaluacion/:id/entregar", ctrl.postEntregarEval);
router.post("/juego-oracion/:id/entregar", ctrl.postEntregarJuegoOracion);

// Historial
router.get("/historial", ctrl.getHistorial);

module.exports = router;
