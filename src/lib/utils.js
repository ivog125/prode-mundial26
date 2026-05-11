/**
 * Calcula puntos de un pronóstico dado el resultado real.
 * @returns 3 = exacto, 1 = ganador/empate, 0 = nada
 */
export function calcularPuntos(pronostico, resultado) {
  const { golesLocal: pl, golesVisitante: pv } = pronostico;
  const { golesLocal: rl, golesVisitante: rv } = resultado;

  if (pl == null || pv == null || rl == null || rv == null) return null;

  const pL = Number(pl), pV = Number(pv);
  const rL = Number(rl), rV = Number(rv);

  if (pL === rL && pV === rV) return 3;

  const signoProno   = Math.sign(pL - pV);
  const signoReal    = Math.sign(rL - rV);
  if (signoProno === signoReal) return 1;

  return 0;
}

export function formatFecha(fechaStr) {
  const [y, m, d] = fechaStr.split("-");
  return `${d}/${m}`;
}

export function formatFechaLarga(fechaStr) {
  const fecha = new Date(fechaStr + "T12:00:00");
  return fecha.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

export function partidoBloqueado(fechaStr, horaStr) {
  const [h, min] = horaStr.split(":").map(Number);
  const inicio = new Date(fechaStr + "T12:00:00");
  inicio.setHours(h, min, 0, 0);
  return new Date() >= inicio;
}
