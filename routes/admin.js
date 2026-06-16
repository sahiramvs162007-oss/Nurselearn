const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { isAuth, hasRole } = require('../middleware/auth');

router.use(isAuth, hasRole('admin'));

router.get('/', ctrl.getDashboard);

// Módulos
router.get('/modulos', ctrl.getModulos);
router.post('/modulos', ctrl.postCrearModulo);
router.post('/modulos/:id/editar', ctrl.postEditarModulo);
router.post('/modulos/:id/eliminar', ctrl.deleteModulo);

// RAPs
router.get('/raps', ctrl.getRaps);
router.post('/raps', ctrl.postCrearRap);
router.post('/raps/:id/editar', ctrl.postEditarRap);
router.post('/raps/:id/eliminar', ctrl.deleteRap);

// Fichas
router.get('/fichas', ctrl.getFichas);
router.post('/fichas', ctrl.postCrearFicha);
router.post('/fichas/:id/editar', ctrl.postEditarFicha);
router.post('/fichas/:id/eliminar', ctrl.deleteFicha);

// Usuarios
router.get('/usuarios', ctrl.getUsuarios);
router.post('/usuarios', ctrl.postCrearUsuario);
router.post('/usuarios/:id/editar', ctrl.postEditarUsuario);
router.post('/usuarios/:id/eliminar', ctrl.deleteUsuario);

// Asignaciones
router.get('/asignaciones', ctrl.getAsignaciones);
router.post('/asignaciones/instructor', ctrl.postAsignarInstructor);
router.post('/asignaciones/aprendiz', ctrl.postAsignarAprendiz);
router.post('/asignaciones/desasignar', ctrl.postDesasignarAprendiz);

// Reportes
router.get('/reportes', ctrl.getReportes);

module.exports = router;
