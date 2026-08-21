const express = require("express");
const router = express.Router();
const Modulo = require("../models/Modulo");
const RAP = require("../models/RAP");

// Ruta de desarrollo: renderizar crear-actividad sin autenticación
// SOLO se monta cuando NODE_ENV !== 'production'
router.get("/crear-actividad", async (req, res, next) => {
  try {
    const modulos = await Modulo.find().sort("orden");
    const raps = await RAP.find().populate("modulo").sort("orden");
    // Simular fichaActiva mínima para la vista
    const fichaActiva = { nombre: "Ficha de prueba", _id: null };
    res.render("instructor/crear-actividad", {
      titulo: "DEV - Crear Actividad",
      user: "Dev User",
      fichaActiva,
      modulos,
      raps,
      error: [],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
