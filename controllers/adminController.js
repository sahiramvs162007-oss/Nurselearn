const User = require('../models/User');
const Ficha = require('../models/Ficha');
const Modulo = require('../models/Modulo');
const RAP = require('../models/RAP');
const Entrega = require('../models/Entrega');
const Actividad = require('../models/Actividad');

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
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
exports.getModulos = async (req, res) => {
  const modulos = await Modulo.find().sort('orden');
  res.render('admin/modulos', { titulo: 'Módulos', user: req.session.userName, modulos, error: req.flash('error'), success: req.flash('success') });
};

exports.postCrearModulo = async (req, res) => {
  const { nombre, descripcion, orden } = req.body;
  await Modulo.create({ nombre, descripcion, orden: Number(orden) });
  req.flash('success', 'Módulo creado.');
  res.redirect('/admin/modulos');
};

exports.postEditarModulo = async (req, res) => {
  const { nombre, descripcion, orden } = req.body;
  await Modulo.findByIdAndUpdate(req.params.id, { nombre, descripcion, orden: Number(orden) });
  req.flash('success', 'Módulo actualizado.');
  res.redirect('/admin/modulos');
};

exports.deleteModulo = async (req, res) => {
  await Modulo.findByIdAndDelete(req.params.id);
  req.flash('success', 'Módulo eliminado.');
  res.redirect('/admin/modulos');
};

// ── RAPs ──────────────────────────────────────────────────────────────────────
exports.getRaps = async (req, res) => {
  const [raps, modulos] = await Promise.all([RAP.find().populate('modulo').sort('orden'), Modulo.find().sort('orden')]);
  res.render('admin/raps', { titulo: 'RAPs', user: req.session.userName, raps, modulos, error: req.flash('error'), success: req.flash('success') });
};

exports.postCrearRap = async (req, res) => {
  const { nombre, descripcion, modulo, orden } = req.body;
  await RAP.create({ nombre, descripcion, modulo, orden: Number(orden) });
  req.flash('success', 'RAP creado.');
  res.redirect('/admin/raps');
};

exports.postEditarRap = async (req, res) => {
  const { nombre, descripcion, modulo, orden } = req.body;
  await RAP.findByIdAndUpdate(req.params.id, { nombre, descripcion, modulo, orden: Number(orden) });
  req.flash('success', 'RAP actualizado.');
  res.redirect('/admin/raps');
};

exports.deleteRap = async (req, res) => {
  await RAP.findByIdAndDelete(req.params.id);
  req.flash('success', 'RAP eliminado.');
  res.redirect('/admin/raps');
};

// ── FICHAS ────────────────────────────────────────────────────────────────────
exports.getFichas = async (req, res) => {
  const fichas = await Ficha.find().populate('aprendices', 'nombre').populate('instructores.instructor', 'nombre');
  res.render('admin/fichas', { titulo: 'Fichas', user: req.session.userName, fichas, error: req.flash('error'), success: req.flash('success') });
};

exports.postCrearFicha = async (req, res) => {
  const { nombre, codigo, descripcion } = req.body;
  await Ficha.create({ nombre, codigo, descripcion });
  req.flash('success', 'Ficha creada.');
  res.redirect('/admin/fichas');
};

exports.postEditarFicha = async (req, res) => {
  const { nombre, codigo, descripcion } = req.body;
  await Ficha.findByIdAndUpdate(req.params.id, { nombre, codigo, descripcion });
  req.flash('success', 'Ficha actualizada.');
  res.redirect('/admin/fichas');
};

exports.deleteFicha = async (req, res) => {
  await Ficha.findByIdAndDelete(req.params.id);
  req.flash('success', 'Ficha eliminada.');
  res.redirect('/admin/fichas');
};

// ── USUARIOS ──────────────────────────────────────────────────────────────────
exports.getUsuarios = async (req, res) => {
  const usuarios = await User.find().sort('nombre');
  res.render('admin/usuarios', { titulo: 'Usuarios', user: req.session.userName, usuarios, error: req.flash('error'), success: req.flash('success') });
};

exports.postCrearUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    await User.create({ nombre, email, password, rol });
    req.flash('success', 'Usuario creado.');
  } catch (e) {
    req.flash('error', 'El email ya existe.');
  }
  res.redirect('/admin/usuarios');
};

exports.postEditarUsuario = async (req, res) => {
  const { nombre, email, rol, estado } = req.body;
  await User.findByIdAndUpdate(req.params.id, { nombre, email, rol, estado });
  req.flash('success', 'Usuario actualizado.');
  res.redirect('/admin/usuarios');
};

exports.deleteUsuario = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  req.flash('success', 'Usuario eliminado.');
  res.redirect('/admin/usuarios');
};

// ── ASIGNACIONES ─────────────────────────────────────────────────────────────
exports.getAsignaciones = async (req, res) => {
  const [fichas, instructores, aprendices, raps] = await Promise.all([
    Ficha.find().populate('instructores.instructor', 'nombre').populate('aprendices', 'nombre'),
    User.find({ rol: 'instructor' }, 'nombre email'),
    User.find({ rol: 'aprendiz' }, 'nombre email'),
    RAP.find().populate('modulo', 'nombre').sort('orden')
  ]);
  res.render('admin/asignaciones', { titulo: 'Asignaciones', user: req.session.userName, fichas, instructores, aprendices, raps, error: req.flash('error'), success: req.flash('success') });
};

exports.postAsignarInstructor = async (req, res) => {
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
};

exports.postAsignarAprendiz = async (req, res) => {
  const { fichaId, aprendizId } = req.body;
  await Ficha.findByIdAndUpdate(fichaId, { $addToSet: { aprendices: aprendizId } });
  req.flash('success', 'Aprendiz asignado.');
  res.redirect('/admin/asignaciones');
};

exports.postDesasignarAprendiz = async (req, res) => {
  const { fichaId, aprendizId } = req.body;
  await Ficha.findByIdAndUpdate(fichaId, { $pull: { aprendices: aprendizId } });
  req.flash('success', 'Aprendiz desasignado.');
  res.redirect('/admin/asignaciones');
};

// ── REPORTES ──────────────────────────────────────────────────────────────────
exports.getReportes = async (req, res) => {
  const fichas = await Ficha.find()
    .populate('aprendices', 'nombre estado')
    .populate('instructores.instructor', 'nombre');

  // Para cada ficha calcular % promedio de avance
  const reportes = await Promise.all(fichas.map(async (ficha) => {
    const actividades = await Actividad.find({ ficha: ficha._id });
    const totalActs = actividades.length;
    if (totalActs === 0) return { ficha, porcentaje: 0 };

    const aprobadas = await Entrega.countDocuments({
      ficha: ficha._id,
      estado: 'Aprobado'
    });
    const posibles = totalActs * ficha.aprendices.length;
    const porcentaje = posibles > 0 ? Math.round((aprobadas / posibles) * 100) : 0;
    return { ficha, porcentaje };
  }));

  res.render('admin/reportes', { titulo: 'Reportes Globales', user: req.session.userName, reportes });
};
