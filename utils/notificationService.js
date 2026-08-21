const Notification = require("../models/Notification");
const Actividad = require("../models/Actividad");
const Entrega = require("../models/Entrega");

async function sendNotification(
  destinatario,
  tipo,
  mensaje,
  enlace = "/",
  datos = {},
) {
  return Notification.create({ destinatario, tipo, mensaje, enlace, datos });
}

async function sendNotifications(
  destinatarios,
  tipo,
  mensaje,
  enlace = "/",
  datos = {},
) {
  if (!Array.isArray(destinatarios) || destinatarios.length === 0) return [];
  const docs = destinatarios.map((destinatario) => ({
    destinatario,
    tipo,
    mensaje,
    enlace,
    datos,
  }));
  return Notification.insertMany(docs);
}

async function sendUniqueNotification(
  destinatario,
  tipo,
  mensaje,
  enlace = "/",
  datos = {},
) {
  if (!destinatario) return null;
  const exists = await Notification.exists({
    destinatario,
    tipo,
    "datos.rap": datos.rap || null,
    "datos.modulo": datos.modulo || null,
    "datos.aprendiz": datos.aprendiz || null,
    "datos.ficha": datos.ficha || null,
  });
  if (exists) return null;
  return Notification.create({ destinatario, tipo, mensaje, enlace, datos });
}

async function sendUniqueNotifications(
  destinatarios,
  tipo,
  mensaje,
  enlace = "/",
  datos = {},
) {
  if (!Array.isArray(destinatarios) || destinatarios.length === 0) return [];
  const created = [];
  for (const destinatario of destinatarios) {
    const doc = await sendUniqueNotification(
      destinatario,
      tipo,
      mensaje,
      enlace,
      datos,
    );
    if (doc) created.push(doc);
  }
  return created;
}

async function getUnreadCount(userId) {
  if (!userId) return 0;
  return Notification.countDocuments({ destinatario: userId, leido: false });
}

async function existsNotification(destinatario, tipo, datos = {}) {
  const query = { destinatario, tipo };
  if (datos.rap) query["datos.rap"] = datos.rap;
  if (datos.modulo) query["datos.modulo"] = datos.modulo;
  if (datos.aprendiz) query["datos.aprendiz"] = datos.aprendiz;
  if (datos.ficha) query["datos.ficha"] = datos.ficha;
  return Notification.exists(query);
}

async function getInstructorIds(ficha) {
  if (!ficha || !Array.isArray(ficha.instructores)) return [];
  return ficha.instructores.map((item) => item.instructor.toString());
}

async function hasCompletedRap(aprendizId, fichaId, rapId) {
  const actividades = await Actividad.find(
    { ficha: fichaId, rap: rapId, visible: true },
    "_id",
  ).lean();
  if (!actividades.length) return false;
  const actividadIds = actividades.map((act) => act._id);
  const aprobadas = await Entrega.countDocuments({
    aprendiz: aprendizId,
    ficha: fichaId,
    actividad: { $in: actividadIds },
    estado: "Aprobado",
  });
  return aprobadas === actividadIds.length;
}

async function hasCompletedModulo(aprendizId, fichaId, moduloId) {
  const actividades = await Actividad.find(
    { ficha: fichaId, modulo: moduloId, visible: true },
    "_id",
  ).lean();
  if (!actividades.length) return false;
  const actividadIds = actividades.map((act) => act._id);
  const aprobadas = await Entrega.countDocuments({
    aprendiz: aprendizId,
    ficha: fichaId,
    actividad: { $in: actividadIds },
    estado: "Aprobado",
  });
  return aprobadas === actividadIds.length;
}

async function countAprendicesWithRapCompleted(ficha, rapId) {
  const actividades = await Actividad.find(
    { ficha: ficha._id, rap: rapId, visible: true },
    "_id",
  ).lean();
  if (
    !actividades.length ||
    !Array.isArray(ficha.aprendices) ||
    ficha.aprendices.length === 0
  ) {
    return 0;
  }

  const actividadIds = actividades.map((act) => act._id);

  const resultados = await Entrega.aggregate([
    {
      $match: {
        ficha: ficha._id,
        actividad: { $in: actividadIds },
        estado: "Aprobado",
      },
    },
    {
      $group: {
        _id: "$aprendiz",
        aprobadas: { $sum: 1 },
      },
    },
    {
      $match: {
        aprobadas: actividadIds.length,
      },
    },
  ]);

  return resultados.length;
}

module.exports = {
  sendNotification,
  sendNotifications,
  getUnreadCount,
  existsNotification,
  getInstructorIds,
  hasCompletedRap,
  hasCompletedModulo,
  countAprendicesWithRapCompleted,
};
