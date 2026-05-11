import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [modo, setModo]         = useState("login");
  const [nombre, setNombre]     = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (modo === "recovery") {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Te enviamos un email para restablecer tu contraseña. Revisá también el spam.");
        return;
      }
      if (modo === "registro") {
        if (!nombre.trim()) throw new Error("Ingresá tu nombre");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "usuarios", cred.user.uid), {
          nombre: nombre.trim(),
          email,
          activo: false,
          esAdmin: false,
          puntos: 0,
          exactos: 0,
          parciales: 0,
          creadoEn: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/fixture");
      }
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "Ya existe una cuenta con ese email.",
        "auth/invalid-credential":   "Email o contraseña incorrectos.",
        "auth/weak-password":        "La contraseña debe tener al menos 6 caracteres.",
        "auth/invalid-email":        "El email no es válido.",
        "auth/user-not-found":       "No existe una cuenta con ese email.",
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setLoading(false);
    }
  }

  const isRecovery = modo === "recovery";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-green-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-white">Prode Mundial 2026</h1>
          <p className="text-blue-200 mt-1">USA · Canadá · México</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!isRecovery && (
            <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
              {["login", "registro"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setModo(m); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                    modo === m
                      ? "bg-white shadow text-blue-700 font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "login" ? "Iniciar sesión" : "Registrarse"}
                </button>
              ))}
            </div>
          )}

          {isRecovery && (
            <div className="mb-6">
              <button
                onClick={() => { setModo("login"); setError(""); setSuccess(""); }}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                ← Volver al login
              </button>
              <h2 className="text-lg font-bold text-gray-800 mt-3">Recuperar contraseña</h2>
              <p className="text-sm text-gray-500 mt-1">Ingresá tu email y te mandamos un link para resetearla.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "registro" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {!isRecovery && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading
                ? "Cargando..."
                : modo === "login"
                ? "Entrar"
                : modo === "registro"
                ? "Crear cuenta"
                : "Enviar email"}
            </button>
          </form>

          {modo === "login" && !success && (
            <button
              onClick={() => { setModo("recovery"); setError(""); setSuccess(""); }}
              className="w-full text-center mt-4 text-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {modo === "registro" && (
            <p className="text-xs text-gray-500 text-center mt-4">
              Tu cuenta quedará pendiente de activación hasta confirmar el pago.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}