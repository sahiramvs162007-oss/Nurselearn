const mongoose = require('mongoose');

const moduloSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  orden: { type: Number, required: true }, // Para ordenar linealmente
}, { timestamps: true });

module.exports = mongoose.model('Modulo', moduloSchema);
