const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  codigo: { type: String, required: true, unique: true, trim: true },
  descripcion: { type: String, trim: true },
  activa: { type: Boolean, default: true },

  // Instructores asignados con sus RAPs
  instructores: [{
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    raps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RAP' }]
  }],

  // Aprendices matriculados
  aprendices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Módulos desbloqueados en esta ficha (el resto están bloqueados)
  modulosDesbloqueados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Modulo' }]

}, { timestamps: true });

module.exports = mongoose.model('Ficha', fichaSchema);
