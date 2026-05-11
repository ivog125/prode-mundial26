import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PARTIDOS } from "../data/partidos";
import { calcularPuntos, formatFechaLarga } from "../lib/utils";

export default function Admin() {
  const [tab, setTab]               = useState("resultados");
  const [resultados, setResultados] = useState({});
  const [usuarios, setUsuarios]     = useState([]);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState("");

  useEffect(() => {
    async function cargar() {
      const [resSnap, usrSnap] = await Promise.all([
        getDocs(collection(db, "resultados")),
        getDocs(collection(db, "usuarios")),
      ]);
      const res = {};
      resSnap.docs.forEach((d) => Object.assign(res, d.data()));
      setResultados(res);
      setUsuarios(usrSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.puntos || 0) - (a.puntos || 0)));
    }
    cargar();
  }, []);

  async function guardarResultado(matchId, golesLocal, golesVisitante) {
    if (golesLocal === "" || golesVisitante === "") return;
    setSaving(true);
    try {
      const nuevoRes = { golesLocal: Number(golesLocal), golesVisitante: Number(golesVisitante) };

      await setDoc(
        doc(db, "resultados", "oficial"),
        { [matchId]: nuevoRes },
        { merge: true }
      );

      const todosResultados = { ...resultados, [matchId]: nuevoRes };

      // Recalcular puntos de todos los usuarios
      const proSnaps = await getDocs(collection(db, "pronosticos"));
      for (const pSnap of proSnaps.docs) {
        const userId  = pSnap.id;
        const proData = pSnap.data();
        let total = 0, exactos = 0, parciales = 0;
        for (const [pid, res] of Object.entries(todosResultados)) {
          const p = calcularPuntos(proData[pid] || {}, res);
          if (p === 3) { total += 3; exactos++; }
          else if (p === 1) { total += 1; parciales++; }
        }
        await updateDoc(doc(db, "usuarios", userId), { puntos: total, exactos, parciales });
      }

      // Crear notificación
      const partido = PARTIDOS.find((p) => p.id === matchId);
      if (partido) {
        await addDoc(collection(db, "notificaciones"), {
          tipo: "resultado",
          matchId,
          titulo: `${partido.local} ${golesLocal} - ${golesVisitante} ${partido.visitante}`,
          mensaje: `Resultado cargado. ¡Revisá tus puntos!`,
          creadoEn: serverTimestamp(),
          leido: false,
        });
      }

      setResultados(todosResultados);
      flash(`✅ Resultado guardado y puntos recalculados`);
    } finally {
      setSaving(false);
    }
  }

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  }

  async function toggleActivo(userId, actual) {
    await updateDoc(doc(db, "usuarios", userId), { activo: !actual });
    setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, activo: !actual } : u));
  }

  const tabs = [
    { id: "resultados", label: "⚽ Resultados" },
    { id: "usuarios",   label: "👥 Usuarios" },
    { id: "stats",      label: "📊 Stats" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel Admin</h1>

      {msg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">
          {msg}
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resultados" && (
        <ResultadosTab resultados={resultados} onGuardar={guardarResultado} saving={saving} />
      )}
      {tab === "usuarios" && (
        <UsuariosTab usuarios={usuarios} onToggle={toggleActivo} />
      )}
      {tab === "stats" && (
        <StatsTab usuarios={usuarios} resultados={resultados} />
      )}
    </div>
  );
}

function ResultadosTab({ resultados, onGuardar, saving }) {
  const [inputs, setInputs] = useState({});

  function handleInput(matchId, campo, val) {
    setInputs((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [campo]: val } }));
  }

  function handleGuardar(matchId) {
    const i  = inputs[matchId] || {};
    const gl = i.golesLocal      ?? resultados[matchId]?.golesLocal      ?? "";
    const gv = i.golesVisitante  ?? resultados[matchId]?.golesVisitante  ?? "";
    onGuardar(matchId, gl, gv);
  }

  const fases = [...new Set(PARTIDOS.map((p) => p.fase))];

  return (
    <div className="space-y-6">
      {fases.map((fase) => (
        <div key={fase}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{fase}</h2>
          <div className="space-y-2">
            {PARTIDOS.filter((p) => p.fase === fase).map((partido) => {
              const res = resultados[partido.id];
              const inp = inputs[partido.id] || {};
              const gl  = inp.golesLocal     ?? (res?.golesLocal     ?? "");
              const gv  = inp.golesVisitante ?? (res?.golesVisitante ?? "");

              return (
                <div key={partido.id} className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 ${res ? "border-green-200 bg-green-50" : ""}`}>
                  <div className="text-xs text-gray-400 w-12 shrink-0">
                    {partido.fecha.slice(5).replace("-", "/")}
                  </div>
                  <div className="flex-1 text-sm font-medium text-gray-700 truncate">{partido.local}</div>
                  <input
                    type="number" min="0" max="99"
                    value={gl}
                    onChange={(e) => handleInput(partido.id, "golesLocal", e.target.value)}
                    className="w-10 h-9 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="number" min="0" max="99"
                    value={gv}
                    onChange={(e) => handleInput(partido.id, "golesVisitante", e.target.value)}
                    className="w-10 h-9 text-center border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex-1 text-sm font-medium text-gray-700 text-right truncate">{partido.visitante}</div>
                  <button
                    onClick={() => handleGuardar(partido.id)}
                    disabled={saving}
                    className="ml-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors shrink-0"
                  >
                    {res ? "✏️" : "💾"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function UsuariosTab({ usuarios, onToggle }) {
  const activos   = usuarios.filter((u) => u.activo).length;
  const inactivos = usuarios.filter((u) => !u.activo).length;

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="bg-green-50 rounded-lg px-4 py-2 text-sm">
          <span className="font-bold text-green-700">{activos}</span>
          <span className="text-green-600 ml-1">activos</span>
        </div>
        <div className="bg-orange-50 rounded-lg px-4 py-2 text-sm">
          <span className="font-bold text-orange-700">{inactivos}</span>
          <span className="text-orange-600 ml-1">pendientes</span>
        </div>
      </div>
      <div className="space-y-2">
        {usuarios.map((u) => (
          <div key={u.id} className="bg-white border rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
              {u.nombre?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                {u.nombre}
                {u.esAdmin && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">admin</span>}
              </div>
              <div className="text-xs text-gray-400 truncate">{u.email}</div>
            </div>
            <div className="text-sm font-semibold text-gray-600 shrink-0">
              {u.puntos || 0} pts
            </div>
            <button
              onClick={() => onToggle(u.id, u.activo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                u.activo
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
              }`}
            >
              {u.activo ? "✅ Activo" : "⛔ Inactivo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsTab({ usuarios, resultados }) {
  const totalResultados = Object.keys(resultados).length;
  const totalPartidos   = PARTIDOS.length;
  const totalJugadores  = usuarios.filter((u) => u.activo).length;
  const lider           = usuarios.find((u) => u.activo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-700">{totalJugadores}</div>
          <div className="text-sm text-blue-600">Jugadores activos</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-700">{totalResultados}/{totalPartidos}</div>
          <div className="text-sm text-green-600">Resultados cargados</div>
        </div>
      </div>

      {/* Barra de progreso del torneo */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progreso del torneo</span>
          <span className="font-semibold">{Math.round((totalResultados / totalPartidos) * 100)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
            style={{ width: `${(totalResultados / totalPartidos) * 100}%` }}
          />
        </div>
      </div>

      {lider && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <div className="text-xs text-yellow-700 font-semibold uppercase tracking-wide">Líder actual</div>
            <div className="font-bold text-gray-900 text-lg">{lider.nombre}</div>
            <div className="text-sm text-gray-500">{lider.puntos || 0} puntos · {lider.exactos || 0} exactos</div>
          </div>
        </div>
      )}
    </div>
  );
}
