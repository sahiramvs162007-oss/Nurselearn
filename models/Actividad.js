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

// Sub-schemas para contenido configurable de juegos
const emparejarParSchema = new mongoose.Schema(
  {
    termino: { type: String, required: true, trim: true },
    significado: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ahorcadoPalabraSchema = new mongoose.Schema(
  {
    palabra: { type: String, required: true, trim: true },
    pista: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const sopaPalabraSchema = new mongoose.Schema(
  {
    palabra: { type: String, required: true, trim: true },
    traduccion: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const oracionItemSchema = new mongoose.Schema(
  {
    oracion: { type: String, required: true, trim: true }, // usar "___" para el espacio en blanco
    respuesta: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const emparejarConceptoSchema = new mongoose.Schema(
  {
    concepto: { type: String, required: true, trim: true }, // ej. "Termómetro"
    funcion: { type: String, required: true, trim: true }, // ej. "Sirve para tomar la temperatura"
  },
  { _id: false },
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
        "juego_emparejar_conceptos",
        "juego_ahorcado_salud",
        "juego_sopa_letras",
        "juego_completar_oracion",
        null,
      ],
      default: null,
    },
    juegoEmparejarPares: [emparejarParSchema],
    juegoEmparejarConceptos: [emparejarConceptoSchema],
    juegoAhorcadoPalabras: [ahorcadoPalabraSchema],
    juegoSopaPalabras: [sopaPalabraSchema],
    juegoOracionItems: [oracionItemSchema],
    // Tiempo límite en minutos para completar el juego. Si es null/0, el
    // frontend usa un valor predeterminado según el tipo de juego.
    juegoTiempoLimiteMin: { type: Number, default: null },

    // ── EVALUACIÓN ────────────────────────────────────────
    preguntas: [preguntaSchema],
    esCierreModulo: { type: Boolean, default: false }, // evaluación de cierre
  },
  { timestamps: true },
);

module.exports = mongoose.model("Actividad", actividadSchema);
