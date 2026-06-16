const mongoose = require('mongoose');

const rapSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  modulo: { type: mongoose.Schema.Types.ObjectId, ref: 'Modulo', required: true },
  orden: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('RAP', rapSchema);
