const mongoose = require('mongoose');

/**
 * Leccion
 * ───────
 * Reemplaza el concepto plano de "Actividad" como unidad principal que
 * construye el instructor. Una Lección agrupa:
 *   - Bloques de contenido (ver models/Bloque.js) → lo que el aprendiz LEE/VE.
 *   - Actividades (ver models/Actividad.js)       → lo que el aprendiz HACE.
 *
 * Jerarquía: Modulo → RAP → Lección → { Bloques, Actividades }
 */
const leccionSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '', trim: true },

  ficha: { type: mongoose.Schema.Types.ObjectId, ref: 'Ficha', required: true },
  modulo: { type: mongoose.Schema.Types.ObjectId, ref: 'Modulo', required: true },
  rap: { type: mongoose.Schema.Types.ObjectId, ref: 'RAP', required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  momentoPedagogico: {
    type: String,
    enum: ['Exploración', 'Estructuración', 'Transferencia', 'Valoración'],
    required: true
  },

  orden: { type: Number, default: 0 },   // orden dentro del RAP
  visible: { type: Boolean, default: true }, // switch del instructor

}, { timestamps: true });

leccionSchema.index({ ficha: 1, rap: 1, orden: 1 });

module.exports = mongoose.model('Leccion', leccionSchema);
