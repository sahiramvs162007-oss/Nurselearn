// Opciones predeterminadas del juego: tiempo límite (minutos) por tipo de
// juego, usado cuando el instructor no configura uno propio.
const GAME_TIME_DEFAULTS_MIN = {
  juego_emparejar: 4,
  juego_emparejar_conceptos: 4,
  juego_ahorcado_salud: 5,
  juego_sopa_letras: 8,
  juego_completar_oracion: 6,
};
const GAME_TIME_DEFAULT_FALLBACK_MIN = 5;

function buildGameData(actividad) {
  const tiempoLimiteMin =
    actividad.juegoTiempoLimiteMin ||
    GAME_TIME_DEFAULTS_MIN[actividad.tipoJuego] ||
    GAME_TIME_DEFAULT_FALLBACK_MIN;

  return {
    emparejar: actividad.juegoEmparejarPares || [],
    // El juego "Emparejar conceptos" reutiliza el mismo mini-juego de
    // parejas en el cliente: se normaliza a la misma forma {termino, significado}.
    conceptos: (actividad.juegoEmparejarConceptos || []).map((c) => ({
      termino: c.concepto,
      significado: c.funcion,
    })),
    ahorcado: actividad.juegoAhorcadoPalabras || [],
    sopa: actividad.juegoSopaPalabras || [],
    oracion: actividad.juegoOracionItems || [],
    tiempoLimiteMin,
  };
}

function buildGameDataJson(actividad) {
  return JSON.stringify(buildGameData(actividad)).replace(/</g, "\\u003c");
}

module.exports = {
  GAME_TIME_DEFAULTS_MIN,
  GAME_TIME_DEFAULT_FALLBACK_MIN,
  buildGameData,
  buildGameDataJson,
};
