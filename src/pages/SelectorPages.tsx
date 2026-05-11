import { useState, useEffect } from "react";
import { EstudiantePage } from "./Dash_Estudiante";

interface SelectRolePageProps {
  onSelect: (tipo: "personal") => void;
}

export function SelectRolePage({ onSelect }: SelectRolePageProps) {
  const [showEstudiante, setShowEstudiante] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hover, setHover]     = useState<"personal" | "estudiante" | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (showEstudiante) {
    return <EstudiantePage onBack={() => setShowEstudiante(false)} />;
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

        /* ── LAYOUT ── */
        .sel-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-body);
          background: var(--clr-bg);
          overflow: hidden;
        }

        /* ── LEFT — igual que LoginPage ── */
        .sel-left {
          position: relative;
          background: var(--clr-accent);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          overflow: hidden;
        }

        .sel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(45,122,154,.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 10%, rgba(255,255,255,.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .sel-left::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .deco-circle {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.08);
          pointer-events: none;
        }
        .deco-c1 { width: 320px; height: 320px; top: -80px; right: -80px; }
        .deco-c2 { width: 180px; height: 180px; bottom: 80px; right: 20px; }
        .deco-c3 { width: 80px;  height: 80px;  bottom: 40px; right: 80px; }

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

        .left-divider {
          height: 1px;
          background: rgba(255,255,255,.12);
          margin-bottom: 28px;
        }

        .stats-row { display: flex; gap: 32px; }

        .stat { display: flex; flex-direction: column; gap: 2px; }

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

        /* ── RIGHT ── */
        .sel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
          background: var(--clr-bg);
        }

        .sel-card {
          width: 100%;
          max-width: 420px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .5s ease .15s, transform .5s ease .15s;
        }
        .sel-card.show { opacity: 1; transform: none; }

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

        /* ── OPTION CARDS ── */
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .option-card {
          width: 100%;
          background: var(--clr-surface);
          border: 1.5px solid var(--clr-border);
          border-radius: 14px;
          padding: 24px 28px;
          cursor: pointer;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 20px;
          transition:
            border-color 200ms ease,
            box-shadow   200ms ease,
            transform    150ms ease,
            background   200ms ease;
          position: relative;
          overflow: hidden;
        }

        .option-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(29,78,107,.04) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .option-card:hover {
          border-color: var(--clr-accent);
          box-shadow: 0 8px 28px rgba(29,78,107,.12);
          transform: translateY(-2px);
        }

        .option-card:hover::before { opacity: 1; }

        .option-card:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(29,78,107,.08);
        }

        .option-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: var(--clr-accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
          transition: background 200ms ease, transform 200ms ease;
        }

        .option-card:hover .option-icon-wrap {
          background: var(--clr-accent);
          transform: scale(1.05);
        }

        .option-card:hover .option-icon-wrap .opt-icon-emoji {
          filter: brightness(10);
        }

        .opt-icon-emoji {
          transition: filter 200ms ease;
          font-style: normal;
        }

        .option-body {
          flex: 1;
        }

        .option-label {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--clr-ink);
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .option-desc {
          font-size: 13px;
          color: var(--clr-ink-3);
          font-weight: 300;
          line-height: 1.5;
        }

        .option-arrow {
          font-size: 18px;
          color: var(--clr-border-dark);
          transition: color 200ms ease, transform 200ms ease;
          flex-shrink: 0;
        }

        .option-card:hover .option-arrow {
          color: var(--clr-accent);
          transform: translateX(4px);
        }

        /* ── FOOTER ── */
        .card-footer {
          margin-top: 36px;
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
          .sel-root { grid-template-columns: 1fr; }
          .sel-left  { display: none; }
          .sel-right { padding: 32px 24px; }
        }
      `}</style>

      <div className="sel-root">
        {/* ── Left decorative panel ── */}
        <div className="sel-left">
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

        {/* ── Right selection panel ── */}
        <div className="sel-right">
          <div className={`sel-card ${mounted ? "show" : ""}`}>
            <p className="card-eyebrow">Acceso al sistema</p>
            <h2 className="card-title">¿Quién eres?</h2>
            <p className="card-subtitle">Selecciona tu tipo de acceso para continuar</p>

            <div className="options-grid">
              {/* Opción 1 — Personal académico */}
              <button
                className="option-card"
                onClick={() => onSelect("personal")}
                onMouseEnter={() => setHover("personal")}
                onMouseLeave={() => setHover(null)}
              >
                <div className="option-icon-wrap">
                  <em className="opt-icon-emoji">🎓</em>
                </div>
                <div className="option-body">
                  <p className="option-label">Docente / Auxiliar</p>
                  <p className="option-desc">
                    Acceso con usuario y contraseña para gestionar materias, parciales y calificaciones.
                  </p>
                </div>
                <span className="option-arrow">→</span>
              </button>

              {/* Opción 2 — Estudiante */}
              <button
                className="option-card"
                onClick={() => setShowEstudiante(true)}
                onMouseEnter={() => setHover("estudiante")}
                onMouseLeave={() => setHover(null)}
              >
                <div className="option-icon-wrap">
                  <em className="opt-icon-emoji">📋</em>
                </div>
                <div className="option-body">
                  <p className="option-label">Estudiante</p>
                  <p className="option-desc">
                    Consulta tus notas y materias inscritas usando tu carnet de identidad.
                  </p>
                </div>
                <span className="option-arrow">→</span>
              </button>
            </div>

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