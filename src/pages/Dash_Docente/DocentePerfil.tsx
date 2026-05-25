import { useState } from "react";
import { apiFetch } from "../../api/client";

// ─────────────────────────────────────────────────────────────────────────────
// PerfilBtn — botón en el sidebar footer que activa la vista "perfil"
// Uso: reemplaza o complementa .dd-user en DocenteLayout.tsx
// ─────────────────────────────────────────────────────────────────────────────

interface PerfilBtnProps {
  username: string;
  activo:   boolean;
  onClick:  () => void;
}

export function PerfilBtn({ username, activo, onClick }: PerfilBtnProps) {
  return (
    <button
      className={`dd-perfil-btn ${activo ? "active" : ""}`}
      onClick={onClick}
      title="Editar perfil"
    >
      <div className="dd-user-avatar">{username[0]?.toUpperCase()}</div>
      <div className="dd-perfil-btn-info">
        <span className="dd-user-name">@{username}</span>
        <span className="dd-perfil-btn-label">Perfil</span>
      </div>
      <span className="dd-perfil-btn-arrow">›</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PerfilDocente — vista completa que ocupa dd-main
// ─────────────────────────────────────────────────────────────────────────────

interface PerfilDocenteProps {
  username:          string;
  onVolver:          () => void;
  onUsernameChange?: (nuevoUsername: string) => void;
}

type Tab = "usuario" | "password";

export function PerfilDocente({ username, onVolver, onUsernameChange }: PerfilDocenteProps) {
  const [tab, setTab] = useState<Tab>("usuario");

  return (
    <div className="dd-tab">

      {/* Encabezado */}
      <div className="dd-tab-header">
        <button className="dd-btn-volver" onClick={onVolver}>
          ← Volver
        </button>
        <h1 className="dd-tab-title">Mi perfil</h1>
        <p className="dd-tab-sub">Actualiza tu nombre de usuario o contraseña de acceso.</p>
      </div>

      {/* Card central */}
      <div className="dp-card">

        {/* Avatar + nombre */}
        <div className="dp-hero">
          <div className="dp-hero-avatar">{username[0]?.toUpperCase()}</div>
          <div className="dp-hero-info">
            <span className="dp-hero-username">@{username}</span>
            <span className="dp-hero-sub">Cuenta activa</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="dp-tabs">
          <button
            className={`dp-tab ${tab === "usuario" ? "active" : ""}`}
            onClick={() => setTab("usuario")}
          >
            Cambiar usuario
          </button>
          <button
            className={`dp-tab ${tab === "password" ? "active" : ""}`}
            onClick={() => setTab("password")}
          >
            Cambiar contraseña
          </button>
        </div>

        {/* Formulario activo */}
        <div className="dp-body">
          {tab === "usuario"   && (
            <FormUsuario
              username={username}
              onUsernameChange={onUsernameChange}
            />
          )}
          {tab === "password"  && <FormPassword />}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormUsuario
// ─────────────────────────────────────────────────────────────────────────────

function FormUsuario({
  username,
  onUsernameChange,
}: {
  username:          string;
  onUsernameChange?: (u: string) => void;
}) {
  const [valor,   setValor]   = useState(username);
  const [loading, setLoading] = useState(false);
  const [ok,      setOk]      = useState<string | null>(null);
  const [err,     setErr]     = useState<string | null>(null);

  const guardar = async () => {
    setOk(null); setErr(null);
    const nuevo = valor.trim();
    if (!nuevo)                { setErr("El username no puede estar vacío."); return; }
    if (nuevo === username)    { setErr("Es el mismo username actual.");       return; }

    setLoading(true);
    try {
      const res = await apiFetch.patch("/usuarios/me", { username: nuevo });
      if (res.access_token) localStorage.setItem("token", res.access_token);
      onUsernameChange?.(res.username);
      setOk("Username actualizado correctamente.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al actualizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-form">
      <div className="dp-field">
        <label className="dp-label">Nuevo nombre de usuario</label>
        <input
          className="dp-input"
          type="text"
          value={valor}
          onChange={e => { setValor(e.target.value); setOk(null); setErr(null); }}
          onKeyDown={e => e.key === "Enter" && guardar()}
          autoComplete="username"
        />
        <p className="dp-hint">
          Al cambiar el username se generará un nuevo token de sesión automáticamente.
        </p>
      </div>

      <Feedback ok={ok} err={err} />

      <button className="dd-btn-primary dp-submit" onClick={guardar} disabled={loading}>
        {loading ? <Spinner /> : "Guardar username"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FormPassword
// ─────────────────────────────────────────────────────────────────────────────

function FormPassword() {
  const [actual,    setActual]    = useState("");
  const [nueva,     setNueva]     = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showA,     setShowA]     = useState(false);
  const [showN,     setShowN]     = useState(false);
  const [showC,     setShowC]     = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [ok,        setOk]        = useState<string | null>(null);
  const [err,       setErr]       = useState<string | null>(null);

  const guardar = async () => {
    setOk(null); setErr(null);
    if (!actual)                  { setErr("Ingresa tu contraseña actual.");                   return; }
    if (nueva.length < 6)         { setErr("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if (nueva !== confirmar)       { setErr("Las contraseñas nuevas no coinciden.");            return; }
    if (nueva === actual)          { setErr("La nueva contraseña debe ser diferente a la actual."); return; }

    setLoading(true);
    try {
      await apiFetch.patch("/usuarios/me", {
        password_actual: actual,
        password_nuevo:  nueva,
      });
      setOk("Contraseña actualizada correctamente.");
      setActual(""); setNueva(""); setConfirmar("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error al actualizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dp-form">

      <div className="dp-field">
        <label className="dp-label">Contraseña actual</label>
        <div className="dp-input-wrap">
          <input
            className="dp-input"
            type={showA ? "text" : "password"}
            value={actual}
            onChange={e => { setActual(e.target.value); setOk(null); setErr(null); }}
            autoComplete="current-password"
          />
          <button className="dp-eye" onClick={() => setShowA(v => !v)}>{showA ? "🙈" : "👁"}</button>
        </div>
      </div>

      <div className="dp-field">
        <label className="dp-label">Nueva contraseña</label>
        <div className="dp-input-wrap">
          <input
            className="dp-input"
            type={showN ? "text" : "password"}
            value={nueva}
            onChange={e => { setNueva(e.target.value); setOk(null); setErr(null); }}
            autoComplete="new-password"
          />
          <button className="dp-eye" onClick={() => setShowN(v => !v)}>{showN ? "🙈" : "👁"}</button>
        </div>
        <PasswordStrength password={nueva} />
      </div>

      <div className="dp-field">
        <label className="dp-label">Confirmar nueva contraseña</label>
        <div className="dp-input-wrap">
          <input
            className="dp-input"
            type={showC ? "text" : "password"}
            value={confirmar}
            onChange={e => { setConfirmar(e.target.value); setOk(null); setErr(null); }}
            autoComplete="new-password"
          />
          <button className="dp-eye" onClick={() => setShowC(v => !v)}>{showC ? "🙈" : "👁"}</button>
        </div>
      </div>

      <Feedback ok={ok} err={err} />

      <button className="dd-btn-primary dp-submit" onClick={guardar} disabled={loading}>
        {loading ? <Spinner /> : "Cambiar contraseña"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes pequeños
// ─────────────────────────────────────────────────────────────────────────────

function Feedback({ ok, err }: { ok: string | null; err: string | null }) {
  if (!ok && !err) return null;
  return (
    <div className={`dp-feedback ${ok ? "dp-feedback--ok" : "dp-feedback--err"}`}>
      {ok ? `✓ ${ok}` : `✕ ${err}`}
    </div>
  );
}

function Spinner() {
  return <span className="dp-spinner" />;
}

function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const score =
    len === 0 ? 0 :
    len < 6   ? 1 :
    len < 10  ? 2 :
    /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4 : 3;

  const labels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const colors = ["", "var(--clr-danger)", "#e09b52", "var(--clr-accent-2)", "#2d7a4a"];

  if (len === 0) return null;

  return (
    <div className="dp-strength">
      <div className="dp-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="dp-strength-bar"
            style={{ background: i <= score ? colors[score] : "var(--clr-border)" }}
          />
        ))}
      </div>
      <span className="dp-strength-label" style={{ color: colors[score] }}>
        {labels[score]}
      </span>
    </div>
  );
}