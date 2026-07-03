const User = require('../models/User');
const Ficha = require('../models/Ficha');
const Modulo = require('../models/Modulo');
const RAP = require('../models/RAP');
const Actividad = require('../models/Actividad');
const Entrega = require('../models/Entrega');
const path = require('path');

async function calcularProgreso(aprendizId, fichaId) {
  const actividades = await Actividad.find({ ficha: fichaId, visible: true });
  if (!actividades.length) return { pct: 0, porModulo: {} };

  const aprobadas = await Entrega.find({ aprendiz: aprendizId, ficha: fichaId, estado: 'Aprobado' });
  const aprobSet = new Set(aprobadas.map(e => e.actividad.toString()));

  const porModulo = {};
  for (const act of actividades) {
    const mId = act.modulo.toString();
    if (!porModulo[mId]) porModulo[mId] = { total: 0, aprobadas: 0 };
    porModulo[mId].total++;
    if (aprobSet.has(act._id.toString())) porModulo[mId].aprobadas++;
  }

  const pct = Math.round((aprobadas.length / actividades.length) * 100);
  return { pct, porModulo };
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const ficha = await Ficha.findOne({ aprendices: req.session.userId });
    // Guard: si no hay ficha (inconsistencia en BD), redirigir con mensaje
    if (!ficha) {
      req.flash('error', 'No estás matriculado en ninguna ficha. Contacta al administrador.');
      return res.redirect('/auth/login');
    }

    const modulos = await Modulo.find().sort('orden');
    const { pct, porModulo } = await calcularProgreso(req.session.userId, ficha._id);

    const modulosConEstado = modulos.map((m, i) => {
      const mId = m._id.toString();
      const prog = porModulo[mId] || { total: 0, aprobadas: 0 };
      const pctMod = prog.total > 0 ? Math.round((prog.aprobadas / prog.total) * 100) : 0;
      const desbloqueado = ficha.modulosDesbloqueados.some(md => md.toString() === mId) || i === 0;

      let bloqueado = false;
      if (!desbloqueado) {
        bloqueado = true;
      } else if (i > 0) {
        const anterior = modulos[i - 1];
        const progAnterior = porModulo[anterior._id.toString()] || { total: 0, aprobadas: 0 };
        const pctAnterior = progAnterior.total > 0 ? Math.round((progAnterior.aprobadas / progAnterior.total) * 100) : 0;
        if (pctAnterior < 100) bloqueado = true;
      }

      return { ...m._doc, pct: pctMod, bloqueado };
    });

    res.render('aprendiz/dashboard', {
      titulo: 'Mi Ruta de Aprendizaje', user: req.session.userName,
      ficha, modulos: modulosConEstado, pctTotal: pct
    });
  } catch (err) { next(err); }
};

// ── VER MÓDULO / RAPs / ACTIVIDADES ──────────────────────────────────────────
exports.getModulo = async (req, res, next) => {
  try {
    const ficha = await Ficha.findOne({ aprendices: req.session.userId });
    if (!ficha) return res.redirect('/aprendiz');
    const modulo = await Modulo.findById(req.params.moduloId);
    if (!modulo) return res.redirect('/aprendiz');
    const raps = await RAP.find({ modulo: modulo._id }).sort('orden');

    const actividades = await Actividad.find({ ficha: ficha._id, modulo: modulo._id, visible: true }).sort('orden');
    const entregas = await Entrega.find({ aprendiz: req.session.userId, ficha: ficha._id });
    const entregaMap = {};
    entregas.forEach(e => entregaMap[e.actividad.toString()] = e);

    res.render('aprendiz/modulo', {
      titulo: modulo.nombre, user: req.session.userName,
      ficha, modulo, raps, actividades, entregaMap
    });
  } catch (err) { next(err); }
};

// ── VER ACTIVIDAD ─────────────────────────────────────────────────────────────
exports.getActividad = async (req, res, next) => {
  try {
    const actividad = await Actividad.findById(req.params.id).populate('rap modulo');
    if (!actividad) return res.redirect('/aprendiz');
    const ficha = await Ficha.findOne({ aprendices: req.session.userId });
    if (!ficha) return res.redirect('/aprendiz');
    let entrega = await Entrega.findOne({ actividad: actividad._id, aprendiz: req.session.userId });

    if (!entrega) {
      entrega = await Entrega.create({ actividad: actividad._id, aprendiz: req.session.userId, ficha: ficha._id });
    }

    res.render('aprendiz/actividad', {
      titulo: actividad.titulo, user: req.session.userName,
      actividad, ficha, entrega, error: req.flash('error'), success: req.flash('success')
    });
  } catch (err) { next(err); }
};

// ── ENTREGAR ACTIVIDAD BLOG ───────────────────────────────────────────────────
exports.postEntregar = async (req, res, next) => {
  try {
    const { actividadId, respuestaTexto } = req.body;
    const archivoUrl = req.file ? '/uploads/' + req.file.filename : '';

    await Entrega.findOneAndUpdate(
      { actividad: actividadId, aprendiz: req.session.userId },
      { respuestaTexto, archivoUrl, estado: 'Entregado', entregadoEn: new Date() },
      { upsert: true }
    );
    req.flash('success', 'Entrega realizada. Espera la calificación del instructor.');
    res.redirect('/aprendiz/actividad/' + actividadId);
  } catch (err) { next(err); }
};

// ── COMPLETAR JUEGO ───────────────────────────────────────────────────────────
exports.postCompletarJuego = async (req, res, next) => {
  try {
    const { actividadId } = req.body;
    const ficha = await Ficha.findOne({ aprendices: req.session.userId });

    await Entrega.findOneAndUpdate(
      { actividad: actividadId, aprendiz: req.session.userId, ficha: ficha ? ficha._id : undefined },
      { porcentaje: 100, estado: 'Aprobado', calificadoEn: new Date() },
      { upsert: true }
    );
    res.json({ ok: true, mensaje: '¡Actividad aprobada!' });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: 'Error al registrar el juego.' });
  }
};

// ── ENTREGAR EVALUACIÓN ───────────────────────────────────────────────────────
exports.postEntregarEval = async (req, res, next) => {
  try {
    const actividad = await Actividad.findById(req.params.id);
    if (!actividad) return res.redirect('/aprendiz');

    const respuestas = actividad.preguntas.map((_, i) => Number(req.body[`pregunta_${i}`] ?? -1));
    const total = actividad.preguntas.length;

    let puntajeTotal = 0;
    let puntajeObtenido = 0;
    actividad.preguntas.forEach((p, i) => {
      const val = p.puntaje || (100 / total);
      puntajeTotal += val;
      if (respuestas[i] === p.respuestaCorrecta) puntajeObtenido += val;
    });
    const porcentaje = Math.round((puntajeObtenido / puntajeTotal) * 100);
    const estado = porcentaje >= 70 ? 'Aprobado' : 'Reprobado';

    await Entrega.findOneAndUpdate(
      { actividad: actividad._id, aprendiz: req.session.userId },
      { respuestasEval: respuestas, porcentaje, estado, entregadoEn: new Date(), calificadoEn: new Date() },
      { upsert: true }
    );

    req.flash(estado === 'Aprobado' ? 'success' : 'error',
      `Resultado: ${porcentaje}% – ${estado === 'Aprobado' ? '¡Aprobado!' : 'Reprobado, intenta de nuevo.'}`);
    res.redirect('/aprendiz/actividad/' + actividad._id);
  } catch (err) { next(err); }
};

// ── HISTORIAL ─────────────────────────────────────────────────────────────────
exports.getHistorial = async (req, res, next) => {
  try {
    const ficha = await Ficha.findOne({ aprendices: req.session.userId });
    if (!ficha) return res.redirect('/aprendiz');
    const entregas = await Entrega.find({ aprendiz: req.session.userId, ficha: ficha._id })
      .populate('actividad', 'titulo tipo')
      .sort('-calificadoEn');
    res.render('aprendiz/historial', {
      titulo: 'Mi Historial', user: req.session.userName,
      ficha, entregas
    });
  } catch (err) { next(err); }
};
