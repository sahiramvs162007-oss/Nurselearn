const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/instructorController');
const { isAuth, hasRole } = require('../middleware/auth');

router.use(isAuth, hasRole('instructor'));

router.get('/', ctrl.getDashboard);
router.post('/ficha', ctrl.postCambiarFicha);

// Actividades
router.get('/actividades', ctrl.getActividades);
router.get('/actividades/crear', ctrl.getCrearActividad);
router.post('/actividades/crear', ctrl.postCrearActividad);
router.post('/actividades/:id/visibilidad', ctrl.postToggleVisibilidad);
router.post('/actividades/:id/eliminar', ctrl.deleteActividad);

// Clonar
router.get('/clonar', ctrl.getClonar);
router.post('/clonar', ctrl.postClonar);

// Calificación
router.get('/entregas', ctrl.getEntregas);
router.get('/entregas/:id/calificar', ctrl.getCalificar);
router.post('/entregas/:id/calificar', ctrl.postCalificar);

// Reportes
router.get('/reportes', ctrl.getReportes);

module.exports = router;
