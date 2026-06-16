const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['admin', 'instructor', 'aprendiz'], required: true },

  // Solo aprendices
  estado: {
    type: String,
    enum: ['Activo', 'Certificado', 'Inactivo'],
    default: 'Activo'
  },

  // Ficha activa seleccionada (instructores)
  fichaActiva: { type: mongoose.Schema.Types.ObjectId, ref: 'Ficha', default: null }

}, { timestamps: true });

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.compararPassword = function (candidato) {
  return bcrypt.compare(candidato, this.password);
};

module.exports = mongoose.model('User', userSchema);
