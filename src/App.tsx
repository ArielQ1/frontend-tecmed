import { useState } from "react";
import { SelectRolePage } from "./pages/SelectorPages";
import { LoginPage }      from "./pages/LoginPage";
import { AdminLayout }    from "./pages/AdminLayout";
import { DashDocente }    from "./pages/Dash_Docente/DocenteLayout";
import { DashAuxiliar }    from "./pages/Dash_Auxiliar/AuxiliarLayout";
import { apiFetch }       from "./api/client";

type Role = "admin" | "docente" | "auxiliar";

interface AuthState {
  token:    string;
  role:     Role;
  username: string;
}

// Pantallas posibles antes de autenticarse
type Screen = "selector" | "login";

function App() {
  const [screen, setScreen] = useState<Screen>("selector");

  const [auth, setAuth] = useState<AuthState | null>(() => {
    const token    = localStorage.getItem("token");
    const role     = localStorage.getItem("role") as Role | null;
    const username = localStorage.getItem("username") ?? "";
    return token && role ? { token, role, username } : null;
  });

  function handleLogin(token: string, role: Role, username = "") {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    setAuth({ token, role, username });
  }

  async function handleLogout() {
    try {
      await apiFetch.post("/users/logout");
    } catch { /* ignorar */ } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      setAuth(null);
      setScreen("selector");   // al cerrar sesión vuelve al selector
    }
  }

  // ── Con sesión activa ─────────────────────────────────────────────────────
  if (auth) {
    if (auth.role === "admin")    return <AdminLayout onLogout={handleLogout} />;
    if (auth.role === "docente")  return <DashDocente onLogout={handleLogout} docenteInfo={{ username: auth.username ?? "", rol: auth.role }} />;
    if (auth.role === "auxiliar") return <DashAuxiliar onLogout={handleLogout} auxiliarInfo={{ username: auth.username ?? "", rol: auth.role }} />;
    return null;
  }

  // ── Sin sesión ────────────────────────────────────────────────────────────
  // "Estudiante" lo maneja SelectRolePage internamente (ya tiene el drill-down)
  if (screen === "selector") {
    return (
      <SelectRolePage
        onSelect={() => setScreen("login")}   // solo llega aquí con "personal"
      />
    );
  }

  // screen === "login"
  return (
    <LoginPage
      onLogin={handleLogin}
      // onBack={() => setScreen("selector")}   // ← Volver al selector
    />
  );
}

export default App;