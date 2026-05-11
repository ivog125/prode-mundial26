import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Login from "./pages/Login";
import Fixture from "./pages/Fixture";
import Ranking from "./pages/Ranking";
import Perfil from "./pages/Perfil";
import Admin from "./pages/Admin";

function PendienteScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow p-8 max-w-sm text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Cuenta pendiente</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Tu cuenta está pendiente de activación. Una vez confirmado el pago, el organizador la activa y ya podés jugar.
        </p>
        <button
          onClick={() => signOut(auth)}
          className="mt-6 text-sm text-blue-600 hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, perfil, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 text-lg">Cargando...</div>
    </div>
  );

  if (!user)          return <Navigate to="/login" />;
  if (!perfil?.activo) return <PendienteScreen />;
  if (adminOnly && !perfil?.esAdmin) return <Navigate to="/fixture" />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main className="pb-10">
                <Routes>
                  <Route path="/fixture" element={<Fixture />} />
                  <Route path="/ranking" element={<Ranking />} />
                  <Route path="/perfil"  element={<Perfil />} />
                  <Route path="/admin"   element={
                    <PrivateRoute adminOnly>
                      <Admin />
                    </PrivateRoute>
                  } />
                  <Route path="*" element={<Navigate to="/fixture" />} />
                </Routes>
              </main>
            </div>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
