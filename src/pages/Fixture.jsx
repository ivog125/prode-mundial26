import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { PARTIDOS, FASES } from "../data/partidos";
import { calcularPuntos, formatFechaLarga, partidoBloqueado } from "../lib/utils";

export default function Fixture() {
  const { user } = useAuth();
  const [pronosticos, setPronosticos] = useState({});
  const [resultados, setResultados]   = useState({});
  const [saving, setSaving]           = useState({});
  const [faseActiva, setFaseActiva]   = useState("Grupos");

  // Cargar pronósticos y resultados del usuario
  useEffect(() => {
    if (!user) return;
    async function cargar() {
      const [proSnap, resSnap] = await Promise.all([
        getDoc(doc(db, "pronosticos", user.uid)),
        getDoc(doc(db, "resultados", "oficial")),
      ]);
      if (proSnap.exists()) setPronosticos(proSnap.data());
      if (resSnap.exists()) setResultados(resSnap.data());
    }
    cargar();
  }, [user]);

  const handleChange = useCallback((matchId, campo, valor) => {
    const num = valor === "" ? "" : Math.max(0, Math.min(99, parseInt(valor) || 0));
    setPronosticos((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [campo]: num },
    }));
  }, []);

  const handleBlur = useCallback(async (matchId) => {
    if (!user) return;
    const p = pronosticos[matchId];
    if (p?.golesLocal === "" || p?.golesLocal == null) return;
    if (p?.golesVisitante === "" || p?.golesVisitante == null) return;

    setSaving((prev) => ({ ...prev, [matchId]: true }));
    try {
      await setDoc(
        doc(db, "pronosticos", user.uid),
        { [matchId]: { ...p, guardadoEn: serverTimestamp() } },
        { merge: true }
      );
    } finally {
      setSaving((prev) => ({ ...prev, [matchId]: false }));
    }
  }, [user, pronosticos]);

  const partidosFase = PARTIDOS.filter((p) => p.fase === faseActiva);

  // Agrupar por fecha dentro de la fase
  const porFecha = partidosFase.reduce((acc, p) => {
    if (!acc[p.fecha]) acc[p.fecha] = [];
    acc[p.fecha].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis pronósticos</h1>
      <p className="text-sm text-gray-500 mb-6">Ingresá el resultado que predecís antes de que arranque cada partido.</p>

      {/* Tabs de fase */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {FASES.map((fase) => (
          <button
            key={fase}
            onClick={() => setFaseActiva(fase)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              faseActiva === fase
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {fase}
          </button>
        ))}
      </div>

      {/* Partidos */}
      <div className="space-y-6">
        {Object.entries(porFecha).map(([fecha, partidos]) => (
          <div key={fecha}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {formatFechaLarga(fecha)}
            </h2>
            <div className="space-y-2">
              {partidos.map((partido) => {
                const bloqueado  = partidoBloqueado(partido.fecha, partido.hora);
                const prono      = pronosticos[partido.id] || {};
                const resultado  = resultados[partido.id];
                const puntos     = resultado ? calcularPuntos(prono, resultado) : null;

                return (
                  <PartidoRow
                    key={partido.id}
                    partido={partido}
                    prono={prono}
                    resultado={resultado}
                    puntos={puntos}
                    bloqueado={bloqueado}
                    saving={saving[partido.id]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartidoRow({ partido, prono, resultado, puntos, bloqueado, saving, onChange, onBlur }) {
  const puntosColor = {
    3: "bg-green-100 text-green-700 border-green-200",
    1: "bg-yellow-100 text-yellow-700 border-yellow-200",
    0: "bg-red-100 text-red-700 border-red-200",
  };
  const puntosLabel = { 3: "✅ +3", 1: "⚡ +1", 0: "❌ 0" };

  return (
    <div className={`bg-white rounded-xl border p-4 ${bloqueado ? "opacity-80" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        {/* Hora + Grupo */}
        <div className="text-xs text-gray-400 w-14 shrink-0 text-center">
          <div>{partido.hora}</div>
          {partido.grupo !== "-" && (
            <div className="mt-0.5 bg-blue-50 text-blue-600 rounded px-1">{partido.grupo}</div>
          )}
        </div>

        {/* Local */}
        <div className="flex-1 text-right">
          <span className="font-semibold text-gray-800 text-sm">{partido.local}</span>
        </div>

        {/* Inputs pronóstico */}
        <div className="flex items-center gap-1 shrink-0">
          <ScoreInput
            value={prono.golesLocal ?? ""}
            disabled={bloqueado}
            onChange={(v) => onChange(partido.id, "golesLocal", v)}
            onBlur={() => onBlur(partido.id)}
          />
          <span className="text-gray-400 font-bold">-</span>
          <ScoreInput
            value={prono.golesVisitante ?? ""}
            disabled={bloqueado}
            onChange={(v) => onChange(partido.id, "golesVisitante", v)}
            onBlur={() => onBlur(partido.id)}
          />
        </div>

        {/* Visitante */}
        <div className="flex-1 text-left">
          <span className="font-semibold text-gray-800 text-sm">{partido.visitante}</span>
        </div>

        {/* Estado */}
        <div className="w-16 shrink-0 text-center">
          {saving && <span className="text-xs text-gray-400">💾</span>}
          {!saving && puntos != null && (
            <span className={`text-xs font-semibold border rounded-full px-2 py-0.5 ${puntosColor[puntos]}`}>
              {puntosLabel[puntos]}
            </span>
          )}
          {!saving && puntos == null && resultado && (
            <span className="text-xs text-gray-400">Sin pick</span>
          )}
          {!saving && !resultado && bloqueado && (
            <span className="text-xs text-gray-400">🔒</span>
          )}
        </div>
      </div>

      {/* Resultado real (si existe) */}
      {resultado && (
        <div className="mt-2 pt-2 border-t text-center text-xs text-gray-500">
          Resultado: <span className="font-semibold text-gray-700">
            {resultado.golesLocal} - {resultado.golesVisitante}
          </span>
        </div>
      )}
    </div>
  );
}

function ScoreInput({ value, disabled, onChange, onBlur }) {
  return (
    <input
      type="number"
      min="0"
      max="99"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`w-10 h-10 text-center text-lg font-bold rounded-lg border transition-colors
        ${disabled
          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-green-50 border-green-300 text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400"
        }`}
    />
  );
}
