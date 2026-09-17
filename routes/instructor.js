const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/instructorController");
const { isAuth, hasRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(isAuth, hasRole("instructor"));

router.get("/", ctrl.getDashboard);
router.post("/ficha", ctrl.postCambiarFicha);

// Actividades
router.get("/actividades", ctrl.getActividades);
router.get("/actividades/crear", ctrl.getCrearActividad);
router.post("/actividades/crear", ctrl.postCrearActividad);
// Editar actividad
router.get("/actividades/:id/editar", ctrl.getEditarActividad);
router.post("/actividades/:id/editar", ctrl.postEditarActividad);
router.get("/actividades/:id/preview", ctrl.getPreviewActividad);
// Endpoint para subir imágenes/medios desde el editor (CKEditor)
router.post("/uploads", upload.single("upload"), (req, res) => {
  try {
    console.log(
      "Upload request by user:",
      req.session && req.session.userId ? req.session.userId : "anon",
    );
    if (!req.file) {
      console.warn("Upload: no file");
      return res.status(400).json({ error: { message: "No file uploaded" } });
    }
    console.log(
      "Uploaded file:",
      req.file.filename,
      req.file.mimetype,
      req.file.size,
    );
    const url = "/uploads/" + req.file.filename;
    // Provide multiple response shapes for broader editor compatibility
    return res
      .status(201)
      .json({ uploaded: 1, fileName: req.file.filename, url });
  } catch (err) {
    const msg = err && err.message ? err.message : "Upload error";
    console.error("Upload error:", msg);
    return res.status(500).json({ error: { message: msg } });
  }
});
router.post("/actividades/:id/visibilidad", ctrl.postToggleVisibilidad);
router.post("/actividades/:id/eliminar", ctrl.deleteActividad);

// Clonar
router.get("/clonar", ctrl.getClonar);
router.post("/clonar", ctrl.postClonar);

// Calificación
router.get("/entregas", ctrl.getEntregas);
router.get("/entregas/:id/calificar", ctrl.getCalificar);
router.post("/entregas/:id/calificar", ctrl.postCalificar);

// Reportes
router.get("/reportes", ctrl.getReportes);

module.exports = router;
