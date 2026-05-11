import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { PARTIDOS } from "../data/partidos";

export default function Perfil() {
  const { user, perfil } = useAuth();

  if (!perfil) return null;

  const totalPartidos  = PARTIDOS.length;
  const jugados        = (perfil.exactos || 0) + (perfil.parciales || 0);
  const porcentaje     = jugados > 0 ? Math.round(((perfil.exactos || 0) / jugados) * 100) : 0;
  const puntosMax      = totalPartidos * 3;
  const rendimiento    = puntosMax > 0 ? Math.round(((perfil.puntos || 0) / puntosMax) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Avatar + nombre */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 text-white text-center mb-6 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mx-auto mb-3">
          {perfil.nombre?.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{perfil.nombre}</h1>
        <p className="text-blue-200 text-sm mt-1">{user?.email}</p>
        {perfil.esAdmin && (
          <span className="mt-2 inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
            ⭐ Admin
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Puntos totales" value={perfil.puntos || 0} icon="🏆" color="blue" big />
        <StatCard label="Rendimiento" value={`${rendimiento}%`} icon="📊" color="green" big />
        <StatCard label="Exactos ✅" value={perfil.exactos || 0} icon="" color="green" />
        <StatCard label="Parciales ⚡" value={perfil.parciales || 0} icon="" color="yellow" />
        <StatCard label="Partidos jugados" value={jugados} icon="" color="gray" />
        <StatCard label="% exactos" value={jugados > 0 ? `${porcentaje}%` : "-"} icon="" color="gray" />
      </div>

      {/* Barra de progreso de puntos */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Puntos obtenidos</span>
          <span className="font-semibold">{perfil.puntos || 0} / {puntosMax}</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${rendimiento}%` }}
          />
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={() => signOut(auth)}
        className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-xl font-medium transition-colors text-sm"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

function StatCard({ label, value, icon, color, big }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    gray:   "bg-gray-50 text-gray-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className={`font-bold ${big ? "text-3xl" : "text-2xl"}`}>
        {icon && <span className="mr-1">{icon}</span>}{value}
      </div>
      <div className="text-xs mt-1 opacity-70">{label}</div>
    </div>
  );
}
