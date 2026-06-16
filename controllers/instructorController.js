const User = require('../models/User');
const Ficha = require('../models/Ficha');
const Modulo = require('../models/Modulo');
const RAP = require('../models/RAP');
const Actividad = require('../models/Actividad');
const Entrega = require('../models/Entrega');

// Helper: obtener ficha activa del instructor
async function getFichaActiva(userId) {
  const user = await User.findById(userId);
  if (user.fichaActiva) {
    return Ficha.findById(user.fichaActiva).populate('aprendices', 'nombre estado');
  }
  // Si no hay ficha activa, usar la primera asignada
  const ficha = await Ficha.findOne({ 'instructores.instructor': userId }).populate('aprendices', 'nombre estado');
  if (ficha) await User.findByIdAndUpdate(userId, { fichaActiva: ficha._id });
  return ficha;
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const fichas = await Ficha.find({ 'instructores.instructor': req.session.userId });
  const fichaActiva = await getFichaActiva(req.session.userId);
  res.render('instructor/dashboard', {
    titulo: 'Panel Instructor', user: req.session.userName,
    fichas, fichaActiva,
    error: req.flash('error'), success: req.flash('success')
  });
};

// POST cambiar ficha activa
exports.postCambiarFicha = async (req, res) => {
  await User.findByIdAndUpdate(req.session.userId, { fichaActiva: req.body.fichaId });
  res.redirect('/instructor');
};

// ── ACTIVIDADES ───────────────────────────────────────────────────────────────
exports.getActividades = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }

  // RAPs del instructor en esta ficha
  const asig = fichaActiva.instructores.find(i => i.instructor.toString() === req.session.userId);
  const misRaps = asig ? asig.raps : [];

  const [modulos, raps, actividades] = await Promise.all([
    Modulo.find().sort('orden'),
    RAP.find({ _id: { $in: misRaps } }).populate('modulo').sort('orden'),
    Actividad.find({ ficha: fichaActiva._id, rap: { $in: misRaps } }).sort('orden')
  ]);

  res.render('instructor/actividades', {
    titulo: 'Actividades', user: req.session.userName,
    fichaActiva, modulos, raps, actividades,
    error: req.flash('error'), success: req.flash('success')
  });
};

exports.getCrearActividad = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  const asig = fichaActiva.instructores.find(i => i.instructor.toString() === req.session.userId);
  const misRaps = asig ? asig.raps : [];
  const [modulos, raps] = await Promise.all([
    Modulo.find().sort('orden'),
    RAP.find({ _id: { $in: misRaps } }).populate('modulo').sort('orden')
  ]);
  res.render('instructor/crear-actividad', {
    titulo: 'Crear Actividad', user: req.session.userName,
    fichaActiva, modulos, raps,
    error: req.flash('error')
  });
};

exports.postCrearActividad = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  const {
    titulo, tipo, rap, momentoPedagogico, orden,
    contenidoRico, urlYoutube, tipoEntrega, segundoIntentoAutomatico,
    descripcion, tipoJuego,
    esCierreModulo
  } = req.body;

  const rapDoc = await RAP.findById(rap);

  const data = {
    titulo, tipo, ficha: fichaActiva._id,
    modulo: rapDoc.modulo, rap,
    instructor: req.session.userId,
    momentoPedagogico, orden: Number(orden) || 0,
    contenidoRico, urlYoutube,
    tipoEntrega: tipoEntrega || null,
    segundoIntentoAutomatico: segundoIntentoAutomatico === 'on',
    descripcion, tipoJuego: tipoJuego || null,
    esCierreModulo: esCierreModulo === 'on'
  };

  // Preguntas de evaluación
  if (tipo === 'evaluacion' && req.body.enunciados) {
    const enunciados = [].concat(req.body.enunciados);
    const respCorrectas = [].concat(req.body.respuestas);
    const puntajes = [].concat(req.body.puntajes || []);
    data.preguntas = enunciados.map((enunciado, i) => {
      const opts = [];
      for (let j = 0; j < 4; j++) {
        const key = `opcion_${i}_${j}`;
        opts.push(req.body[key] || '');
      }
      return { enunciado, opciones: opts, respuestaCorrecta: Number(respCorrectas[i]), puntaje: puntajes[i] ? Number(puntajes[i]) : null };
    });
  }

  await Actividad.create(data);
  req.flash('success', 'Actividad creada.');
  res.redirect('/instructor/actividades');
};

exports.postToggleVisibilidad = async (req, res) => {
  const act = await Actividad.findById(req.params.id);
  act.visible = !act.visible;
  await act.save();
  res.json({ visible: act.visible });
};

exports.deleteActividad = async (req, res) => {
  await Actividad.findByIdAndDelete(req.params.id);
  req.flash('success', 'Actividad eliminada.');
  res.redirect('/instructor/actividades');
};

// ── CLONAR ACTIVIDAD ──────────────────────────────────────────────────────────
exports.getClonar = async (req, res) => {
  // Buscar fichas anteriores del mismo instructor
  const todasFichas = await Ficha.find({ 'instructores.instructor': req.session.userId });
  const fichaActiva = await getFichaActiva(req.session.userId);
  const fichasAnteriores = todasFichas.filter(f => f._id.toString() !== fichaActiva._id.toString());

  const actividadesOrigen = await Actividad.find({
    instructor: req.session.userId,
    ficha: { $in: fichasAnteriores.map(f => f._id) }
  }).populate('rap modulo');

  res.render('instructor/clonar', {
    titulo: 'Clonar Actividades', user: req.session.userName,
    fichaActiva, actividadesOrigen,
    error: req.flash('error'), success: req.flash('success')
  });
};

exports.postClonar = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  const ids = [].concat(req.body.actividadesIds || []);

  for (const id of ids) {
    const orig = await Actividad.findById(id).lean();
    // Verificar que el RAP existe en la ficha activa
    const rapExiste = await RAP.findById(orig.rap);
    if (!rapExiste) continue;
    delete orig._id; delete orig.createdAt; delete orig.updatedAt;
    orig.ficha = fichaActiva._id;
    await Actividad.create(orig);
  }
  req.flash('success', 'Actividades clonadas.');
  res.redirect('/instructor/actividades');
};

// ── CALIFICACIÓN ──────────────────────────────────────────────────────────────
exports.getEntregas = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  const entregas = await Entrega.find({ ficha: fichaActiva._id, estado: 'Entregado' })
    .populate('aprendiz', 'nombre')
    .populate('actividad', 'titulo tipo');
  res.render('instructor/entregas', {
    titulo: 'Entregas Pendientes', user: req.session.userName,
    fichaActiva, entregas,
    error: req.flash('error'), success: req.flash('success')
  });
};

exports.getCalificar = async (req, res) => {
  const entrega = await Entrega.findById(req.params.id)
    .populate('aprendiz', 'nombre')
    .populate('actividad');
  res.render('instructor/calificar', {
    titulo: 'Calificar Entrega', user: req.session.userName,
    entrega, error: req.flash('error')
  });
};

exports.postCalificar = async (req, res) => {
  const { porcentaje, retroalimentacion, habilitarSegundoIntento } = req.body;
  const pct = Number(porcentaje);
  const estado = pct >= 70 ? 'Aprobado' : 'Reprobado';

  const update = {
    porcentaje: pct, retroalimentacion, estado, calificadoEn: new Date(),
    segundoIntentoHabilitado: habilitarSegundoIntento === 'on'
  };

  if (habilitarSegundoIntento === 'on' && estado === 'Reprobado') {
    update.estado = 'Pendiente';
    update.$inc = { intentos: 1 };
  }

  await Entrega.findByIdAndUpdate(req.params.id, update);
  req.flash('success', 'Actividad calificada.');
  res.redirect('/instructor/entregas');
};

// ── REPORTES ──────────────────────────────────────────────────────────────────
exports.getReportes = async (req, res) => {
  const fichaActiva = await getFichaActiva(req.session.userId);
  const aprendices = fichaActiva.aprendices;
  const actividades = await Actividad.find({ ficha: fichaActiva._id });

  const reporte = await Promise.all(aprendices.map(async (ap) => {
    const aprobadas = await Entrega.countDocuments({ aprendiz: ap._id, ficha: fichaActiva._id, estado: 'Aprobado' });
    const pct = actividades.length > 0 ? Math.round((aprobadas / actividades.length) * 100) : 0;
    return { aprendiz: ap, pct, aprobadas, total: actividades.length };
  }));

  res.render('instructor/reportes', {
    titulo: 'Reporte de Ficha', user: req.session.userName,
    fichaActiva, reporte
  });
};
