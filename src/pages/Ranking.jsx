import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

export default function Ranking() {
  const { user } = useAuth();
  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading]     = useState(true);

  // Listener en tiempo real
  useEffect(() => {
    const q = query(collection(db, "usuarios"), where("activo", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if ((b.puntos || 0) !== (a.puntos || 0)) return (b.puntos || 0) - (a.puntos || 0);
          return (b.exactos || 0) - (a.exactos || 0);
        });
      setJugadores(lista);
      setLoading(false);
    });
    return unsub;
  }, []);

  const medals = ["🥇", "🥈", "🥉"];
  const miPosicion = jugadores.findIndex((j) => j.id === user?.uid) + 1;

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando ranking...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Ranking</h1>
        {miPosicion > 0 && (
          <span className="text-sm bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full">
            Estás {miPosicion}°
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">Se actualiza en tiempo real.</p>

      {/* Podio destacado */}
      {jugadores.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[jugadores[1], jugadores[0], jugadores[2]].map((j, i) => {
            const realPos = i === 0 ? 1 : i === 1 ? 0 : 2;
            const heights = ["h-24", "h-32", "h-20"];
            const esTuyo = j?.id === user?.uid;
            return (
              <div key={j?.id} className={`flex flex-col items-center justify-end ${heights[i]}`}>
                <div className={`text-2xl mb-1`}>{medals[realPos]}</div>
                <div
                  className={`w-full rounded-t-xl flex flex-col items-center justify-center py-2 px-1
                    ${realPos === 0 ? "bg-yellow-400" : realPos === 1 ? "bg-gray-300" : "bg-amber-600"}
                    ${esTuyo ? "ring-2 ring-blue-500" : ""}
                  `}
                >
                  <div className="text-xs font-bold text-gray-800 truncate w-full text-center px-1">
                    {j?.nombre?.split(" ")[0]}
                  </div>
                  <div className="text-lg font-black text-gray-900">{j?.puntos || 0}</div>
                  <div className="text-xs text-gray-600">pts</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      <div className="space-y-2">
        {jugadores.map((j, i) => {
          const esTuyo = j.id === user?.uid;
          return (
            <div
              key={j.id}
              className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors
                ${i < 3 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100"}
                ${esTuyo ? "ring-2 ring-blue-400" : ""}
              `}
            >
              <div className="text-xl w-8 text-center shrink-0">
                {medals[i] ?? <span className="text-gray-500 font-bold text-sm">{i + 1}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {j.nombre}
                  {esTuyo && <span className="text-xs text-blue-500 font-normal ml-1">(vos)</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {j.exactos || 0} exactos · {j.parciales || 0} parciales
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold ${i < 3 ? "text-yellow-600" : "text-gray-700"}`}>
                  {j.puntos || 0}
                </div>
                <div className="text-xs text-gray-400">pts</div>
              </div>
            </div>
          );
        })}

        {jugadores.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Todavía no hay resultados cargados.
          </div>
        )}
      </div>
    </div>
  );
}
