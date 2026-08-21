const mongoose = require('mongoose');

/**
 * Bloque
 * ──────
 * Cada bloque es una pieza de contenido dentro de una Lección
 * (models/Leccion.js). El instructor los agrega con "+ Agregar bloque"
 * y se renderizan en orden antes de las Actividades.
 *
 * El campo `contenido` es flexible (Mixed) porque su forma cambia según
 * `tipo`. Formas esperadas por tipo (documentadas aquí, no forzadas por
 * el schema para poder agregar tipos nuevos sin migraciones):
 *
 *   texto        { html: String }
 *   imagen       { url: String, alt: String }
 *   video        { url: String }                 // ej. embed de YouTube
 *   audio        { url: String }
 *   pdf          { url: String, nombre: String }
 *   tarjetas     { pares: [{ frente: String, reverso: String }] }
 *   faq          { items: [{ pregunta: String, respuesta: String }] }
 *   nota         { texto: String }
 *   descargable  { url: String, nombre: String }
 *   enlace       { url: String, titulo: String }
 *   tabla        { encabezados: [String], filas: [[String]] }
 *   separador    {}
 *
 * Agregar un tipo nuevo (ej. "modelo3D") solo requiere añadirlo al
 * enum TIPOS_BLOQUE y construir su render en la vista — no toca el
 * modelo de Actividad ni su lógica.
 */
const TIPOS_BLOQUE = [
  'texto',
  'imagen',
  'video',
  'audio',
  'pdf',
  'tarjetas',
  'faq',
  'nota',
  'descargable',
  'enlace',
  'tabla',
  'separador',
];

const bloqueSchema = new mongoose.Schema({
  leccion: { type: mongoose.Schema.Types.ObjectId, ref: 'Leccion', required: true },

  tipo: { type: String, enum: TIPOS_BLOQUE, required: true },
  contenido: { type: mongoose.Schema.Types.Mixed, default: {} },

  orden: { type: Number, default: 0 },

}, { timestamps: true });

bloqueSchema.index({ leccion: 1, orden: 1 });

module.exports = mongoose.model('Bloque', bloqueSchema);
module.exports.TIPOS_BLOQUE = TIPOS_BLOQUE;
