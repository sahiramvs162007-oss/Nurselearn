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
exports.getDashboard = async (req, res, next) => {
  try {
    const fichas = await Ficha.find({ 'instructores.instructor': req.session.userId });
    const fichaActiva = await getFichaActiva(req.session.userId);
    res.render('instructor/dashboard', {
      titulo: 'Panel Instructor', user: req.session.userName,
      fichas, fichaActiva,
      error: req.flash('error'), success: req.flash('success')
    });
  } catch (err) { next(err); }
};

// POST cambiar ficha activa
exports.postCambiarFicha = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.session.userId, { fichaActiva: req.body.fichaId });
    res.redirect('/instructor');
  } catch (err) { next(err); }
};

// ── ACTIVIDADES ───────────────────────────────────────────────────────────────
exports.getActividades = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }

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
  } catch (err) { next(err); }
};

exports.getCrearActividad = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }
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
  } catch (err) { next(err); }
};

exports.postCrearActividad = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }

    const {
      titulo, tipo, rap, momentoPedagogico, orden,
      contenidoRico, urlYoutube, tipoEntrega, segundoIntentoAutomatico,
      descripcion, tipoJuego,
      esCierreModulo
    } = req.body;

    const rapDoc = await RAP.findById(rap);
    if (!rapDoc) { req.flash('error', 'RAP no encontrado.'); return res.redirect('/instructor/actividades/crear'); }

    let calculatedOrden = Number(orden);
    if (orden === undefined || orden === null || orden === '' || calculatedOrden === 0) {
      const lastAct = await Actividad.findOne({ ficha: fichaActiva._id, modulo: rapDoc.modulo }).sort('-orden');
      calculatedOrden = lastAct ? lastAct.orden + 1 : 1;
    }

    const data = {
      titulo, tipo, ficha: fichaActiva._id,
      modulo: rapDoc.modulo, rap,
      instructor: req.session.userId,
      momentoPedagogico, orden: calculatedOrden,
      contenidoRico, urlYoutube,
      tipoEntrega: tipoEntrega || null,
      segundoIntentoAutomatico: segundoIntentoAutomatico === 'on',
      descripcion, tipoJuego: tipoJuego || null,
      esCierreModulo: esCierreModulo === 'on'
    };

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
  } catch (err) { next(err); }
};

exports.postToggleVisibilidad = async (req, res, next) => {
  try {
    const act = await Actividad.findById(req.params.id);
    if (!act) return res.status(404).json({ error: 'Actividad no encontrada' });
    act.visible = !act.visible;
    await act.save();
    res.json({ visible: act.visible });
  } catch (err) {
    res.status(500).json({ error: 'Error al cambiar visibilidad' });
  }
};

exports.deleteActividad = async (req, res, next) => {
  try {
    await Actividad.findByIdAndDelete(req.params.id);
    req.flash('success', 'Actividad eliminada.');
    res.redirect('/instructor/actividades');
  } catch (err) { next(err); }
};

// ── CLONAR ACTIVIDAD ──────────────────────────────────────────────────────────
exports.getClonar = async (req, res, next) => {
  try {
    const todasFichas = await Ficha.find({ 'instructores.instructor': req.session.userId });
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }
    const fichasAnteriores = todasFichas.filter(f => f._id.toString() !== fichaActiva._id.toString());

    const actividadesOrigen = await Actividad.find({
      instructor: req.session.userId,
      ficha: { $in: fichasAnteriores.map(f => f._id) }
    }).populate('rap modulo ficha');

    res.render('instructor/clonar', {
      titulo: 'Clonar Actividades', user: req.session.userName,
      fichaActiva, actividadesOrigen,
      error: req.flash('error'), success: req.flash('success')
    });
  } catch (err) { next(err); }
};

exports.postClonar = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }
    const ids = [].concat(req.body.actividadesIds || []);

    for (const id of ids) {
      const orig = await Actividad.findById(id).lean();
      if (!orig) continue;
      const rapExiste = await RAP.findById(orig.rap);
      if (!rapExiste) continue;
      delete orig._id; delete orig.createdAt; delete orig.updatedAt;
      orig.ficha = fichaActiva._id;

      // Calcular el orden automático al final
      const lastAct = await Actividad.findOne({ ficha: fichaActiva._id, modulo: orig.modulo }).sort('-orden');
      orig.orden = lastAct ? lastAct.orden + 1 : 1;

      await Actividad.create(orig);
    }
    req.flash('success', 'Actividades clonadas.');
    res.redirect('/instructor/actividades');
  } catch (err) { next(err); }
};

// ── CALIFICACIÓN ──────────────────────────────────────────────────────────────
exports.getEntregas = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }
    const entregas = await Entrega.find({ ficha: fichaActiva._id, estado: 'Entregado' })
      .populate('aprendiz', 'nombre')
      .populate('actividad', 'titulo tipo');
    res.render('instructor/entregas', {
      titulo: 'Entregas Pendientes', user: req.session.userName,
      fichaActiva, entregas,
      error: req.flash('error'), success: req.flash('success')
    });
  } catch (err) { next(err); }
};

exports.getCalificar = async (req, res, next) => {
  try {
    const entrega = await Entrega.findById(req.params.id)
      .populate('aprendiz', 'nombre')
      .populate('actividad');
    if (!entrega) { req.flash('error', 'Entrega no encontrada.'); return res.redirect('/instructor/entregas'); }
    res.render('instructor/calificar', {
      titulo: 'Calificar Entrega', user: req.session.userName,
      entrega, error: req.flash('error')
    });
  } catch (err) { next(err); }
};

exports.postCalificar = async (req, res, next) => {
  try {
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
  } catch (err) { next(err); }
};

// ── REPORTES ──────────────────────────────────────────────────────────────────
exports.getReportes = async (req, res, next) => {
  try {
    const fichaActiva = await getFichaActiva(req.session.userId);
    if (!fichaActiva) { req.flash('error', 'Sin ficha activa.'); return res.redirect('/instructor'); }
    const aprendices = fichaActiva.aprendices;
    const actividades = await Actividad.find({ ficha: fichaActiva._id }).sort('orden');
    const entregas = await Entrega.find({ ficha: fichaActiva._id });

    const reporte = await Promise.all(aprendices.map(async (ap) => {
      const aprobadas = await Entrega.countDocuments({ aprendiz: ap._id, ficha: fichaActiva._id, estado: 'Aprobado' });
      const pct = actividades.length > 0 ? Math.round((aprobadas / actividades.length) * 100) : 0;
      return { aprendiz: ap, pct, aprobadas, total: actividades.length };
    }));

    res.render('instructor/reportes', {
      titulo: 'Reporte de Ficha', user: req.session.userName,
      fichaActiva, reporte, actividades, entregas
    });
  } catch (err) { next(err); }
};
