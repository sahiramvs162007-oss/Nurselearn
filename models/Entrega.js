const mongoose = require('mongoose');

const entregaSchema = new mongoose.Schema({
  actividad: { type: mongoose.Schema.Types.ObjectId, ref: 'Actividad', required: true },
  aprendiz: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ficha: { type: mongoose.Schema.Types.ObjectId, ref: 'Ficha', required: true },

  estado: {
    type: String,
    enum: ['Pendiente', 'Entregado', 'Calificado', 'Aprobado', 'Reprobado'],
    default: 'Pendiente'
  },

  // Entrega del aprendiz (blog)
  respuestaTexto: { type: String, default: '' },
  archivoUrl: { type: String, default: '' },    // ruta relativa en /public/uploads

  // Calificación
  porcentaje: { type: Number, default: null },   // 0–100
  retroalimentacion: { type: String, default: '' },
  intentos: { type: Number, default: 1 },
  segundoIntentoHabilitado: { type: Boolean, default: false },

  // Evaluación: respuestas seleccionadas por índice
  respuestasEval: [{ type: Number }],

  // Timestamp de entrega
  entregadoEn: { type: Date, default: null },
  calificadoEn: { type: Date, default: null },

}, { timestamps: true });

// Índice compuesto: un aprendiz tiene una entrega por actividad
entregaSchema.index({ actividad: 1, aprendiz: 1 }, { unique: true });

module.exports = mongoose.model('Entrega', entregaSchema);
