const User = require('../models/User');
const Ficha = require('../models/Ficha');
const Modulo = require('../models/Modulo');
const RAP = require('../models/RAP');
const Entrega = require('../models/Entrega');
const Actividad = require('../models/Actividad');

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const [totalFichas, totalUsers, totalModulos] = await Promise.all([
      Ficha.countDocuments(),
      User.countDocuments({ rol: { $ne: 'admin' } }),
      Modulo.countDocuments()
    ]);
    res.render('admin/dashboard', {
      titulo: 'Panel Administrador', user: req.session.userName,
      stats: { totalFichas, totalUsers, totalModulos }
    });
  } catch (err) { next(err); }
};

// ── MÓDULOS ───────────────────────────────────────────────────────────────────
exports.getModulos = async (req, res, next) => {
  try {
    const modulos = await Modulo.find().sort('orden');
    res.render('admin/modulos', { titulo: 'Módulos', user: req.session.userName, modulos, error: req.flash('error'), success: req.flash('success') });
  } catch (err) { next(err); }
};

exports.postCrearModulo = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    let { orden } = req.body;
    if (orden === undefined || orden === null || orden === '') {
      const lastModulo = await Modulo.findOne().sort('-orden');
      orden = lastModulo ? lastModulo.orden + 1 : 1;
    }
    await Modulo.create({ nombre, descripcion, orden: Number(orden) });
    req.flash('success', 'Módulo creado.');
    res.redirect('/admin/modulos');
  } catch (err) { next(err); }
};

exports.postEditarModulo = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;
    await Modulo.findByIdAndUpdate(req.params.id, { nombre, descripcion });
    req.flash('success', 'Módulo actualizado.');
    res.redirect('/admin/modulos');
  } catch (err) { next(err); }
};

exports.deleteModulo = async (req, res, next) => {
  try {
    await Modulo.findByIdAndDelete(req.params.id);
    req.flash('success', 'Módulo eliminado.');
    res.redirect('/admin/modulos');
  } catch (err) { next(err); }
};

// ── RAPs ──────────────────────────────────────────────────────────────────────
exports.getRaps = async (req, res, next) => {
  try {
    const [raps, modulos] = await Promise.all([
      RAP.find().populate('modulo'),
      Modulo.find().sort('orden')
    ]);

    // Sort RAPs in memory: first by Modulo order, then by RAP order
    raps.sort((a, b) => {
      const modA = a.modulo ? a.modulo.orden : 0;
      const modB = b.modulo ? b.modulo.orden : 0;
      if (modA !== modB) return modA - modB;
      return a.orden - b.orden;
    });

    res.render('admin/raps', { titulo: 'RAPs', user: req.session.userName, raps, modulos, error: req.flash('error'), success: req.flash('success') });
  } catch (err) { next(err); }
};

exports.postCrearRap = async (req, res, next) => {
  try {
    const { nombre, descripcion, modulo } = req.body;
    let { orden } = req.body;
    if (orden === undefined || orden === null || orden === '') {
      const lastRap = await RAP.findOne({ modulo }).sort('-orden');
      orden = lastRap ? lastRap.orden + 1 : 1;
    }
    await RAP.create({ nombre, descripcion, modulo, orden: Number(orden) });
    req.flash('success', 'RAP creado.');
    res.redirect('/admin/raps');
  } catch (err) { next(err); }
};

exports.postEditarRap = async (req, res, next) => {
  try {
    const { nombre, descripcion, modulo } = req.body;
    await RAP.findByIdAndUpdate(req.params.id, { nombre, descripcion, modulo });
    req.flash('success', 'RAP actualizado.');
    res.redirect('/admin/raps');
  } catch (err) { next(err); }
};

exports.deleteRap = async (req, res, next) => {
  try {
    await RAP.findByIdAndDelete(req.params.id);
    req.flash('success', 'RAP eliminado.');
    res.redirect('/admin/raps');
  } catch (err) { next(err); }
};

// ── FICHAS ────────────────────────────────────────────────────────────────────
exports.getFichas = async (req, res, next) => {
  try {
    const fichas = await Ficha.find().populate('aprendices', 'nombre').populate('instructores.instructor', 'nombre');
    res.render('admin/fichas', { titulo: 'Fichas', user: req.session.userName, fichas, error: req.flash('error'), success: req.flash('success') });
  } catch (err) { next(err); }
};

exports.postCrearFicha = async (req, res, next) => {
  try {
    const { nombre, codigo, descripcion } = req.body;
    await Ficha.create({ nombre, codigo, descripcion });
    req.flash('success', 'Ficha creada.');
    res.redirect('/admin/fichas');
  } catch (err) { next(err); }
};

exports.postEditarFicha = async (req, res, next) => {
  try {
    const { nombre, codigo, descripcion } = req.body;
    await Ficha.findByIdAndUpdate(req.params.id, { nombre, codigo, descripcion });
    req.flash('success', 'Ficha actualizada.');
    res.redirect('/admin/fichas');
  } catch (err) { next(err); }
};

exports.deleteFicha = async (req, res, next) => {
  try {
    await Ficha.findByIdAndDelete(req.params.id);
    req.flash('success', 'Ficha eliminada.');
    res.redirect('/admin/fichas');
  } catch (err) { next(err); }
};

// ── USUARIOS ──────────────────────────────────────────────────────────────────
exports.getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await User.find().sort('nombre');
    res.render('admin/usuarios', { titulo: 'Usuarios', user: req.session.userName, usuarios, error: req.flash('error'), success: req.flash('success') });
  } catch (err) { next(err); }
};

exports.postCrearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;
    try {
      await User.create({ nombre, email, password, rol });
      req.flash('success', 'Usuario creado.');
    } catch (e) {
      req.flash('error', 'El email ya existe.');
    }
    res.redirect('/admin/usuarios');
  } catch (err) { next(err); }
};

exports.postEditarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, rol, estado } = req.body;
    await User.findByIdAndUpdate(req.params.id, { nombre, email, rol, estado });
    req.flash('success', 'Usuario actualizado.');
    res.redirect('/admin/usuarios');
  } catch (err) { next(err); }
};

exports.deleteUsuario = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'Usuario eliminado.');
    res.redirect('/admin/usuarios');
  } catch (err) { next(err); }
};

// ── ASIGNACIONES ─────────────────────────────────────────────────────────────
exports.getAsignaciones = async (req, res, next) => {
  try {
    const [fichas, instructores, aprendices, raps] = await Promise.all([
      Ficha.find().populate('instructores.instructor', 'nombre').populate('aprendices', 'nombre'),
      User.find({ rol: 'instructor' }, 'nombre email'),
      User.find({ rol: 'aprendiz' }, 'nombre email'),
      RAP.find().populate('modulo', 'nombre').sort('orden')
    ]);
    res.render('admin/asignaciones', { titulo: 'Asignaciones', user: req.session.userName, fichas, instructores, aprendices, raps, error: req.flash('error'), success: req.flash('success') });
  } catch (err) { next(err); }
};

exports.postAsignarInstructor = async (req, res, next) => {
  try {
    const { fichaId, instructorId, raps } = req.body;
    const rapsArr = Array.isArray(raps) ? raps : [raps].filter(Boolean);
    await Ficha.findByIdAndUpdate(fichaId, {
      $pull: { instructores: { instructor: instructorId } }
    });
    await Ficha.findByIdAndUpdate(fichaId, {
      $push: { instructores: { instructor: instructorId, raps: rapsArr } }
    });
    req.flash('success', 'Instructor asignado.');
    res.redirect('/admin/asignaciones');
  } catch (err) { next(err); }
};

exports.postAsignarAprendiz = async (req, res, next) => {
  try {
    const { fichaId, aprendizId } = req.body;
    await Ficha.findByIdAndUpdate(fichaId, { $addToSet: { aprendices: aprendizId } });
    req.flash('success', 'Aprendiz asignado.');
    res.redirect('/admin/asignaciones');
  } catch (err) { next(err); }
};

exports.postDesasignarAprendiz = async (req, res, next) => {
  try {
    const { fichaId, aprendizId } = req.body;
    await Ficha.findByIdAndUpdate(fichaId, { $pull: { aprendices: aprendizId } });
    req.flash('success', 'Aprendiz desasignado.');
    res.redirect('/admin/asignaciones');
  } catch (err) { next(err); }
};

// ── REPORTES ──────────────────────────────────────────────────────────────────
exports.getReportes = async (req, res, next) => {
  try {
    const fichas = await Ficha.find()
      .populate('aprendices', 'nombre estado')
      .populate('instructores.instructor', 'nombre');

    const reportes = await Promise.all(fichas.map(async (ficha) => {
      const actividades = await Actividad.find({ ficha: ficha._id });
      const totalActs = actividades.length;

      const entregas = await Entrega.find({ ficha: ficha._id });
      const aprobadas = entregas.filter(e => e.estado === 'Aprobado').length;
      const entregadas = entregas.filter(e => e.estado !== 'Pendiente').length;
      const posibles = totalActs * ficha.aprendices.length;
      const porcentaje = posibles > 0 ? Math.round((aprobadas / posibles) * 100) : 0;

      // Per-apprentice breakdown
      const detalle = ficha.aprendices.map(ap => {
        const apEntregas = entregas.filter(e => e.aprendiz.toString() === ap._id.toString());
        const apAprobadas = apEntregas.filter(e => e.estado === 'Aprobado').length;
        const pct = totalActs > 0 ? Math.round((apAprobadas / totalActs) * 100) : 0;
        return { aprendiz: ap, aprobadas: apAprobadas, total: totalActs, pct };
      });

      return { ficha, totalActs, entregadas, aprobadas, posibles, porcentaje, detalle };
    }));

    res.render('admin/reportes', { titulo: 'Reportes Globales', user: req.session.userName, reportes });
  } catch (err) { next(err); }
};
