import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { perfil, isAdmin }           = useAuth();
  const [notifs, setNotifs]           = useState([]);
  const [showNotifs, setShowNotifs]   = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "notificaciones"),
      orderBy("creadoEn", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const noLeidas = notifs.filter((n) => !n.leido).length;

  async function marcarTodas() {
    const batch = writeBatch(db);
    notifs.filter((n) => !n.leido).forEach((n) => {
      batch.update(doc(db, "notificaciones", n.id), { leido: true });
    });
    await batch.commit();
  }

  return (
    <nav className="bg-blue-900 text-white shadow-lg relative z-50">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg">
          <span>🏆</span>
          <span className="hidden sm:inline">Prode Mundial 2026</span>
          <span className="sm:hidden">Prode</span>
        </div>

        {/* Links + acciones */}
        <div className="flex items-center gap-1">
          <NavItem to="/fixture" label="Fixture" />
          <NavItem to="/ranking" label="Ranking" />
          {isAdmin && <NavItem to="/admin" label="Admin" />}

          {/* Campana de notificaciones */}
          <div className="relative ml-1">
            <button
              onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && noLeidas > 0) marcarTodas(); }}
              className="relative p-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              🔔
              {noLeidas > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {noLeidas > 9 ? "9+" : noLeidas}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800 text-sm">Notificaciones</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifs.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">Sin notificaciones</div>
                    )}
                    {notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b last:border-0 ${!n.leido ? "bg-blue-50" : ""}`}
                      >
                        <div className="font-semibold text-gray-800 text-sm">⚽ {n.titulo}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{n.mensaje}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Perfil */}
          <NavLink
            to="/perfil"
            className="ml-1 w-8 h-8 rounded-full bg-blue-700 hover:bg-blue-600 flex items-center justify-center font-bold text-sm transition-colors"
            title={perfil?.nombre}
          >
            {perfil?.nombre?.charAt(0).toUpperCase()}
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? "bg-blue-700 text-white" : "text-blue-200 hover:bg-blue-800"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
