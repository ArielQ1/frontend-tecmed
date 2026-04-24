import { useState } from "react";
import { useNavigate } from "react-router";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function LoginDocente() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    try {
      // El backend espera form data, no JSON
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API_URL}/users/login/docente`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail ?? "Error al iniciar sesión");
        return;
      }

      const data = await res.json();

      // Guardar el token para usarlo en las demás páginas
      localStorage.setItem("access_token", data.access_token);

      navigate("/indexdocente");
    } catch {
      setError("No se pudo conectar al servidor. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12">

        {/* Izquierda */}
        <div className="hidden lg:flex flex-col items-start flex-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-12 bg-red-800 rounded-full"></div>
            <div>
              <p className="text-sm font-bold text-slate-600 tracking-tight">FACULTAD DE MEDICINA</p>
              <p className="text-xs text-red-600 font-medium">TECNOLOGÍA MÉDICA - UMSA</p>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-slate-700 leading-tight">
            Acceso al <br />
            <span className="text-red-800">Portal Docente</span>
          </h1>
          <p className="mt-8 text-slate-500 text-lg max-w-sm leading-relaxed">
            Bienvenido al Sistema de Gestión Académica Segura. Ingrese sus
            credenciales institucionales para administrar sus materias y registros.
          </p>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-12 shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Acceso Docente</h2>
            <p className="text-sm text-slate-500">Carrera de Tecnología Médica</p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Ej: brian123"
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-800 focus:bg-white outline-none transition-all text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-red-800 focus:bg-white outline-none transition-all"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full bg-red-900 hover:bg-red-800 disabled:bg-red-300 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-900/20 transition-all transform active:scale-[0.98]"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-semibold">
              Sistema de Gestión Académica Segura
            </p>
            <p className="text-[10px] text-slate-400 mt-2">© 2026 UNIVERSIDAD MAYOR DE SAN ANDRÉS</p>
          </div>
        </div>
      </div>
    </div>
  );
}