const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tipo: {
      type: String,
      enum: [
        "entrega",
        "rap_completado",
        "modulo_completado",
        "rap_80",
        "actividad_creada",
        "actividad_editada",
        "actividad_calificada",
      ],
      required: true,
    },
    mensaje: { type: String, required: true, trim: true },
    enlace: { type: String, default: "/" },
    datos: { type: mongoose.Schema.Types.Mixed, default: {} },
    leido: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ destinatario: 1, leido: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
