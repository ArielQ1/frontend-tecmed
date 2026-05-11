import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";

interface LoginPageProps {
  onLogin: (token: string, role: "admin" | "docente" | "auxiliar") => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("username", username);
      fd.append("password", password);

      const data = await apiFetch.postForm("/users/login", fd);
      onLogin(data.access_token, data.rol);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --clr-bg:          #f0ede8;
          --clr-surface:     #ffffff;
          --clr-border:      #e0dbd3;
          --clr-border-dark: #c5bdb2;
          --clr-ink:         #1a1714;
          --clr-ink-2:       #5a534c;
          --clr-ink-3:       #9a9088;
          --clr-accent:      #1d4e6b;
          --clr-accent-2:    #2d7a9a;
          --clr-accent-light:#e8f3f8;
          --clr-danger:      #9b2226;
          --font-display:    'DM Serif Display', Georgia, serif;
          --font-body:       'DM Sans', sans-serif;
          --font-mono:       'JetBrains Mono', monospace;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-body);
          background: var(--clr-bg);
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .login-left {
          position: relative;
          background: var(--clr-accent);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(45,122,154,.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 10%, rgba(255,255,255,.06) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Grid decorative lines */
        .login-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .left-brand {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity .6s ease, transform .6s ease;
        }
        .left-brand.show { opacity: 1; transform: none; }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border: 1.5px solid rgba(255,255,255,.4);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 22px;
          color: white;
          letter-spacing: -.3px;
        }

        .left-heading {
          font-family: var(--font-display);
          font-size: clamp(36px, 4vw, 52px);
          line-height: 1.08;
          color: white;
          font-style: italic;
          margin-bottom: 20px;
        }

        .left-heading em {
          font-style: normal;
          color: rgba(255,255,255,.55);
        }

        .left-sub {
          font-size: 15px;
          color: rgba(255,255,255,.6);
          line-height: 1.6;
          max-width: 340px;
          font-weight: 300;
        }

        .left-footer {
          position: relative;
          z-index: 1;
          opacity: 0;
          transition: opacity .6s ease .3s;
        }
        .left-footer.show { opacity: 1; }

        .stats-row {
          display: flex;
          gap: 32px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-num {
          font-family: var(--font-mono);
          font-size: 22px;
          color: white;
          font-weight: 500;
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255,255,255,.45);
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .left-divider {
          height: 1px;
          background: rgba(255,255,255,.12);
          margin-bottom: 28px;
        }

        /* Decorative circle */
        .deco-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.08);
          pointer-events: none;
        }
        .deco-c1 { width: 320px; height: 320px; top: -80px; right: -80px; }
        .deco-c2 { width: 180px; height: 180px; bottom: 80px; right: 20px; }
        .deco-c3 { width: 80px;  height: 80px;  bottom: 40px; right: 80px; }

        /* ── RIGHT PANEL ── */
        .login-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
          background: var(--clr-bg);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .5s ease .15s, transform .5s ease .15s;
        }
        .login-card.show { opacity: 1; transform: none; }

        .card-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--clr-accent);
          margin-bottom: 10px;
          font-family: var(--font-mono);
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--clr-ink);
          line-height: 1.1;
          margin-bottom: 8px;
        }

        .card-subtitle {
          font-size: 14px;
          color: var(--clr-ink-3);
          margin-bottom: 40px;
          font-weight: 300;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: var(--clr-ink-2);
          margin-bottom: 8px;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--clr-ink-3);
          font-size: 16px;
          pointer-events: none;
          transition: color var(--dur-fast, 150ms);
        }

        .form-input {
          width: 100%;
          height: 48px;
          padding: 0 16px 0 42px;
          border: 1.5px solid var(--clr-border);
          border-radius: 10px;
          background: var(--clr-surface);
          font-size: 15px;
          color: var(--clr-ink);
          font-family: var(--font-body);
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease;
          -webkit-font-smoothing: antialiased;
        }

        .form-input::placeholder { color: var(--clr-ink-3); }

        .form-input:focus {
          border-color: var(--clr-accent);
          box-shadow: 0 0 0 3px rgba(29,78,107,.1);
        }

        .form-input:focus + .input-icon,
        .input-wrap:focus-within .input-icon {
          color: var(--clr-accent);
        }

        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--clr-ink-3);
          font-size: 16px;
          padding: 4px;
          line-height: 1;
          transition: color 150ms;
        }
        .pw-toggle:hover { color: var(--clr-ink); }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #fdf0ef;
          border: 1.5px solid #f3c4c0;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 20px;
          animation: shake .35s ease;
        }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }

        .error-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
        .error-text { font-size: 13px; color: var(--clr-danger); line-height: 1.5; }

        .submit-btn {
          width: 100%;
          height: 50px;
          background: var(--clr-accent);
          color: white;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          transition: background 200ms ease, transform 150ms ease, box-shadow 200ms ease;
          letter-spacing: .01em;
        }

        .submit-btn:hover:not(:disabled) {
          background: #16394f;
          box-shadow: 0 8px 24px rgba(29,78,107,.3);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: .7;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .card-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--clr-border);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .footer-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--clr-border-dark);
        }

        .footer-text {
          font-size: 12px;
          color: var(--clr-ink-3);
          font-family: var(--font-mono);
        }

        @media (max-width: 768px) {
          .login-root { grid-template-columns: 1fr; }
          .login-left { display: none; }
          .login-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* ── Left decorative panel ── */}
        <div className="login-left">
          <div className="deco-circle deco-c1" />
          <div className="deco-circle deco-c2" />
          <div className="deco-circle deco-c3" />

          <div className={`left-brand ${mounted ? "show" : ""}`}>
            <div className="brand-mark">
              <div className="brand-icon">⚕</div>
              <span className="brand-name">TecMed</span>
            </div>
            <h1 className="left-heading">
              Sistema de<br />
              <em>gestión</em><br />
              académica
            </h1>
            <p className="left-sub">
              Administración de materias, docentes, estudiantes y calificaciones en un solo lugar.
            </p>
          </div>

          <div className={`left-footer ${mounted ? "show" : ""}`}>
            <div className="left-divider" />
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">4</span>
                <span className="stat-label">Materias</span>
              </div>
              <div className="stat">
                <span className="stat-num">9</span>
                <span className="stat-label">Estudiantes</span>
              </div>
              <div className="stat">
                <span className="stat-num">2026</span>
                <span className="stat-label">Gestión</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="login-right">
          <div className={`login-card ${mounted ? "show" : ""}`}>
            <p className="card-eyebrow">Acceso al sistema</p>
            <h2 className="card-title">Bienvenido</h2>
            <p className="card-subtitle">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Usuario</label>
                <div className="input-wrap">
                  <input
                    id="username"
                    className="form-input"
                    type="text"
                    placeholder="nombre de usuario"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(""); }}
                    autoComplete="username"
                    autoFocus
                  />
                  <span className="input-icon">👤</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <div className="input-wrap">
                  <input
                    id="password"
                    className="form-input"
                    type={visible ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                  />
                  <span className="input-icon">🔒</span>
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setVisible(v => !v)}
                    tabIndex={-1}
                  >
                    {visible ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-box" key={error}>
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> Verificando…</>
                ) : (
                  <>Iniciar sesión →</>
                )}
              </button>
            </form>

            <div className="card-footer">
              <div className="footer-dot" />
              <span className="footer-text">TecMed · Gestión 2026</span>
              <div className="footer-dot" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}