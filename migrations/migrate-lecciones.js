/**
 * migrate-lecciones.js
 * ────────────────────
 * Migra el modelo plano de Actividad (blog/juego/evaluacion) al nuevo
 * esquema Lección → { Bloques, Actividades }.
 *
 * Por cada Actividad SIN `leccion` asignada:
 *   1. Crea una Lección con los mismos ficha/modulo/rap/instructor/
 *      momentoPedagogico/orden/visible/titulo.
 *   2. Si la actividad es tipo 'blog' y tiene contenidoRico y/o urlYoutube,
 *      crea Bloques ('texto' y/o 'video') con ese contenido dentro de la
 *      Lección.
 *   3. Enlaza la Actividad a la Lección (actividad.leccion = leccion._id).
 *
 * Es 1 Lección por Actividad existente (mapeo seguro y no destructivo).
 * Agrupar varias actividades viejas en una sola lección es una decisión
 * de contenido que le corresponde al instructor hacer manualmente desde
 * la nueva UI, no a un script automático.
 *
 * Idempotente: se puede correr varias veces, solo procesa actividades
 * con leccion == null.
 *
 * Uso: node migrations/migrate-lecciones.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const Actividad = require('../models/Actividad');
const Leccion = require('../models/Leccion');
const Bloque = require('../models/Bloque');

async function migrar() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Conectado a MongoDB');

  const pendientes = await Actividad.find({ leccion: { $exists: false } });
  console.log(`Actividades a migrar: ${pendientes.length}`);

  let migradas = 0;
  let bloquesCreados = 0;
  let errores = 0;

  for (const act of pendientes) {
    try {
      const leccion = await Leccion.create({
        titulo: act.titulo,
        descripcion: act.tipo === 'juego' ? (act.descripcion || '') : '',
        ficha: act.ficha,
        modulo: act.modulo,
        rap: act.rap,
        instructor: act.instructor,
        momentoPedagogico: act.momentoPedagogico,
        orden: act.orden,
        visible: act.visible,
      });

      let ordenBloque = 0;

      if (act.tipo === 'blog' && act.contenidoRico && act.contenidoRico.trim()) {
        await Bloque.create({
          leccion: leccion._id,
          tipo: 'texto',
          contenido: { html: act.contenidoRico },
          orden: ordenBloque++,
        });
        bloquesCreados++;
      }

      if (act.tipo === 'blog' && act.urlYoutube && act.urlYoutube.trim()) {
        await Bloque.create({
          leccion: leccion._id,
          tipo: 'video',
          contenido: { url: act.urlYoutube },
          orden: ordenBloque++,
        });
        bloquesCreados++;
      }

      act.leccion = leccion._id;
      await act.save();
      migradas++;
    } catch (err) {
      errores++;
      console.error(`  ❌ Error migrando actividad ${act._id} (${act.titulo}):`, err.message);
    }
  }

  console.log('──────────────────────────────');
  console.log(`✅ Lecciones creadas / actividades migradas: ${migradas}`);
  console.log(`📦 Bloques de contenido creados: ${bloquesCreados}`);
  if (errores) console.log(`⚠️  Errores: ${errores}`);
  process.exit(errores ? 1 : 0);
}

migrar().catch(err => {
  console.error('Error fatal en la migración:', err);
  process.exit(1);
});
