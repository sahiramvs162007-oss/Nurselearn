const mongoose = require("mongoose");

// Sub-schema para preguntas de evaluación
const preguntaSchema = new mongoose.Schema(
  {
    enunciado: { type: String, required: true },
    opciones: [{ type: String, required: true }], // Array de 4 opciones
    respuestaCorrecta: { type: Number, required: true }, // índice 0-3
    puntaje: { type: Number, default: null }, // null = equitativo
  },
  { _id: true },
);

const actividadSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: ["blog", "juego", "evaluacion"],
      required: true,
    },
    ficha: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ficha",
      required: true,
    },
    modulo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Modulo",
      required: true,
    },
    rap: { type: mongoose.Schema.Types.ObjectId, ref: "RAP", required: true },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    momentoPedagogico: {
      type: String,
      enum: ["Exploración", "Estructuración", "Transferencia", "Valoración"],
      required: true,
    },

    visible: { type: Boolean, default: true }, // switch del instructor
    orden: { type: Number, default: 0 },

    // ── BLOG ──────────────────────────────────────────────
    // Referencia opcional a una Lección (nuevo esquema)
    leccion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leccion",
      default: null,
    },
    contenidoRico: { type: String, default: "" }, // HTML del editor enriquecido
    urlYoutube: { type: String, default: "" }, // iframe URL opcional
    tipoEntrega: {
      type: String,
      enum: ["texto", "archivo", null],
      default: null,
    },
    segundoIntentoAutomatico: { type: Boolean, default: false }, // switch instructor

    // ── JUEGO ─────────────────────────────────────────────
    descripcion: { type: String, default: "" },
    tipoJuego: {
      type: String,
      enum: [
        "juego_emparejar",
        "juego_ahorcado_salud",
        "juego_sopa_letras",
        null,
      ],
      default: null,
    },

    // ── EVALUACIÓN ────────────────────────────────────────
    preguntas: [preguntaSchema],
    esCierreModulo: { type: Boolean, default: false }, // evaluación de cierre
  },
  { timestamps: true },
);

module.exports = mongoose.model("Actividad", actividadSchema);
