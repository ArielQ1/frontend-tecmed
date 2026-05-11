import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotaDetalle {
  nota:        number | null;
  observacion: string | null;
}

interface Parcial {
  id_parcial:     string;
  nombre_parcial: string | null;
  tipo:           string | null;
  fecha:          string | null;
  valoracion:     number | null;
  nota_detalle:   NotaDetalle | null;
}

interface Materia {
  id_materia:     string;
  sigla:          string;
  nombre_materia: string | null;
  horario:        string | null;
  anio:           number | null;
  parciales:      Parcial[];
}

interface Estudiante {
  id_estudiante: string;
  ci_estudiante: number;
  matricula:     number;
  nombre:        string;
  apellido:      string;
  anio:          number | null;
  mencion:       string | null;
  materias:      Materia[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function estadoParcial(nota: number | null, valoracion: number | null): "aprobado" | "reprobado" | "sin nota" {
  if (nota === null || valoracion === null) return "sin nota";
  return nota >= valoracion / 2 ? "aprobado" : "reprobado";
}

function notaColor(estado: ReturnType<typeof estadoParcial>): string {
  if (estado === "aprobado")  return "#2d7a4a";
  if (estado === "reprobado") return "#9b2226";
  return "#9a9088";
}

function notaBg(estado: ReturnType<typeof estadoParcial>): string {
  if (estado === "aprobado")  return "#d1fae5";
  if (estado === "reprobado") return "#fdf0ef";
  return "#f0ede8";
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EstudiantePageProps {
  onBack?: () => void;
}

export function EstudiantePage({ onBack }: EstudiantePageProps) {
  const [ci,        setCi]        = useState("");
  const [matricula, setMatricula] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [mounted,   setMounted]   = useState(false);
  const [expandedMaterias, setExpandedMaterias] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function toggleMateria(id: string) {
    setExpandedMaterias(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

    async function handleBuscar() {
        if (!ci || !matricula) {
            setError("Ingresa tu carnet de identidad y matrícula.");
            return;
        }
        setError("");
        setLoading(true);
        setEstudiante(null);

        try {
            const data: Estudiante = await apiFetch.get(
              `/admin/estudiantes/acceder?ci=${Number(ci)}&matricula=${Number(matricula)}`
            );

            setEstudiante(data);
            setExpandedMaterias(new Set(data.materias.map(m => m.id_materia)));

        } catch (e: any) {
            const msg: string = e?.message ?? String(e);
            const esNotFound = msg.includes("404") || msg.toLowerCase().includes("no encontrado") || msg.toLowerCase().includes("credenciales");
            setError(esNotFound
                ? "No se encontró un estudiante con esos datos. Verifica tu carnet y matrícula."
                : msg
            );
        } finally {
            setLoading(false);
        }
    }

  function handleReset() {
    setEstudiante(null);
    setCi("");
    setMatricula("");
    setError("");
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

        /* ── ROOT ── */
        .est-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-body);
          background: var(--clr-bg);
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .est-left {
          position: relative;
          background: var(--clr-accent);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          overflow: hidden;
        }

        .est-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(45,122,154,.35) 0%, transparent 60%),
            radial-gradient(ellipse 60% 80% at 80% 10%, rgba(255,255,255,.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .est-left::after {
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
          position: relative; z-index: 1;
          opacity: 0; transform: translateY(16px);
          transition: opacity .6s ease, transform .6s ease;
        }
        .left-brand.show { opacity: 1; transform: none; }

        .brand-mark {
          display: flex; align-items: center; gap: 12px; margin-bottom: 48px;
        }

        .brand-icon {
          width: 40px; height: 40px;
          border: 1.5px solid rgba(255,255,255,.4);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 18px;
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 22px; color: white; letter-spacing: -.3px;
        }

        .left-heading {
          font-family: var(--font-display);
          font-size: clamp(36px, 4vw, 52px);
          line-height: 1.08; color: white;
          font-style: italic; margin-bottom: 20px;
        }
        .left-heading em { font-style: normal; color: rgba(255,255,255,.55); }

        .left-sub {
          font-size: 15px; color: rgba(255,255,255,.6);
          line-height: 1.6; max-width: 340px; font-weight: 300;
        }

        .left-footer {
          position: relative; z-index: 1;
          opacity: 0; transition: opacity .6s ease .3s;
        }
        .left-footer.show { opacity: 1; }

        .left-divider { height: 1px; background: rgba(255,255,255,.12); margin-bottom: 28px; }

        .stats-row { display: flex; gap: 32px; }
        .stat { display: flex; flex-direction: column; gap: 2px; }
        .stat-num {
          font-family: var(--font-mono); font-size: 22px; color: white; font-weight: 500;
        }
        .stat-label {
          font-size: 11px; color: rgba(255,255,255,.45);
          text-transform: uppercase; letter-spacing: .08em;
        }

        /* ── RIGHT PANEL ── */
        .est-right {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 56px;
          background: var(--clr-bg);
          overflow-y: auto;
          max-height: 100vh;
        }

        .est-card {
          width: 100%; max-width: 440px;
          padding-top: 12px;
          opacity: 0; transform: translateY(24px);
          transition: opacity .5s ease .15s, transform .5s ease .15s;
        }
        .est-card.show { opacity: 1; transform: none; }

        /* ── BACK BUTTON ── */
        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-family: var(--font-mono); font-size: 11px;
          color: var(--clr-ink-3); letter-spacing: .06em;
          text-transform: uppercase;
          margin-bottom: 32px; padding: 0;
          transition: color 150ms ease;
        }
        .back-btn:hover { color: var(--clr-accent); }

        /* ── CARD HEADER ── */
        .card-eyebrow {
          font-size: 11px; font-weight: 600;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--clr-accent); margin-bottom: 10px;
          font-family: var(--font-mono);
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 32px; color: var(--clr-ink);
          line-height: 1.1; margin-bottom: 8px;
        }

        .card-subtitle {
          font-size: 14px; color: var(--clr-ink-3);
          margin-bottom: 36px; font-weight: 300;
        }

        /* ── FORM ── */
        .form-group { margin-bottom: 20px; }

        .form-label {
          display: block; font-size: 12px; font-weight: 600;
          letter-spacing: .05em; text-transform: uppercase;
          color: var(--clr-ink-2); margin-bottom: 8px;
        }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--clr-ink-3); font-size: 16px;
          pointer-events: none;
          transition: color 150ms;
        }

        .form-input {
          width: 100%; height: 48px;
          padding: 0 16px 0 42px;
          border: 1.5px solid var(--clr-border);
          border-radius: 10px;
          background: var(--clr-surface);
          font-size: 15px; color: var(--clr-ink);
          font-family: var(--font-body);
          outline: none;
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }

        .form-input::placeholder { color: var(--clr-ink-3); }

        .form-input:focus {
          border-color: var(--clr-accent);
          box-shadow: 0 0 0 3px rgba(29,78,107,.1);
        }

        .form-input:focus + .input-icon { color: var(--clr-accent); }

        /* ── ERROR ── */
        .error-box {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fdf0ef;
          border: 1.5px solid #f3c4c0;
          border-radius: 10px; padding: 12px 16px;
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

        .error-icon  { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
        .error-text  { font-size: 13px; color: var(--clr-danger); line-height: 1.5; }

        /* ── SUBMIT BTN ── */
        .submit-btn {
          width: 100%; height: 50px;
          background: var(--clr-accent); color: white;
          font-family: var(--font-body); font-size: 15px; font-weight: 600;
          border: none; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px;
          transition: background 200ms ease, transform 150ms ease, box-shadow 200ms ease;
          letter-spacing: .01em;
        }
        .submit-btn:hover:not(:disabled) {
          background: #16394f;
          box-shadow: 0 8px 24px rgba(29,78,107,.3);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: .7; cursor: not-allowed; }

        .spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── RESULTADO ── */
        .resultado-wrap {
          animation: fadeUp .4s ease;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: none; }
        }

        /* Perfil del estudiante */
        .perfil-card {
          background: var(--clr-surface);
          border: 1.5px solid var(--clr-border);
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .perfil-avatar {
          width: 48px; height: 48px;
          background: var(--clr-accent-light);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }

        .perfil-info { flex: 1; }

        .perfil-nombre {
          font-family: var(--font-display);
          font-size: 20px; color: var(--clr-ink);
          margin-bottom: 4px;
        }

        .perfil-meta {
          display: flex; gap: 12px; flex-wrap: wrap;
        }

        .meta-badge {
          font-family: var(--font-mono);
          font-size: 11px; color: var(--clr-ink-3);
          background: var(--clr-bg);
          border: 1px solid var(--clr-border);
          border-radius: 6px; padding: 2px 8px;
          text-transform: uppercase; letter-spacing: .04em;
        }

        .meta-badge.accent {
          color: var(--clr-accent);
          background: var(--clr-accent-light);
          border-color: rgba(29,78,107,.2);
        }

        /* Sección materias */
        .section-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--clr-ink-3); font-family: var(--font-mono);
          margin-bottom: 12px;
        }

        /* Materia acordeón */
        .materia-block {
          background: var(--clr-surface);
          border: 1.5px solid var(--clr-border);
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          transition: border-color 200ms ease;
        }
        .materia-block:hover { border-color: var(--clr-border-dark); }

        .materia-header {
          width: 100%; background: none; border: none;
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; text-align: left;
        }

        .materia-sigla {
          font-family: var(--font-mono);
          font-size: 12px; font-weight: 500;
          color: white;
          background: var(--clr-accent);
          border-radius: 6px; padding: 3px 10px;
          flex-shrink: 0;
          letter-spacing: .04em;
        }

        .materia-nombre {
          font-size: 15px; font-weight: 500;
          color: var(--clr-ink); flex: 1;
        }

        .materia-horario {
          font-size: 12px; color: var(--clr-ink-3);
          font-family: var(--font-mono);
        }

        .materia-chevron {
          font-size: 12px; color: var(--clr-ink-3);
          transition: transform 200ms ease;
          flex-shrink: 0;
        }
        .materia-chevron.open { transform: rotate(180deg); }

        /* Parciales */
        .parciales-wrap {
          border-top: 1px solid var(--clr-border);
          padding: 0 20px 16px;
        }

        .parciales-table {
          width: 100%; border-collapse: collapse;
          margin-top: 14px;
        }

        .parciales-table th {
          font-size: 10px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase;
          color: var(--clr-ink-3); font-family: var(--font-mono);
          text-align: left; padding: 0 0 8px;
          border-bottom: 1px solid var(--clr-border);
        }

        .parciales-table th:last-child,
        .parciales-table td:last-child { text-align: right; }

        .parciales-table td {
          padding: 10px 0;
          font-size: 13px; color: var(--clr-ink-2);
          border-bottom: 1px solid var(--clr-bg);
          vertical-align: middle;
        }

        .parciales-table tr:last-child td { border-bottom: none; }

        .tipo-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          border-radius: 4px; padding: 2px 6px;
          text-transform: uppercase; letter-spacing: .04em;
        }

        .tipo-parcial  { background: #e8f3f8; color: #1d4e6b; }
        .tipo-practica { background: #f3f0ff; color: #5b21b6; }

        .nota-pill {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 52px; height: 26px;
          border-radius: 6px; padding: 0 10px;
          font-family: var(--font-mono);
          font-size: 13px; font-weight: 500;
        }

        .sin-nota {
          font-family: var(--font-mono);
          font-size: 12px; color: var(--clr-ink-3);
        }

        .obs-text {
          font-size: 11px; color: var(--clr-ink-3);
          font-style: italic; margin-top: 2px;
        }

        .no-parciales {
          font-size: 13px; color: var(--clr-ink-3);
          padding: 12px 0; text-align: center;
          font-style: italic;
        }

        /* Footer */
        .card-footer {
          margin-top: 28px; padding-top: 24px;
          border-top: 1px solid var(--clr-border);
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        .footer-dot {
          width: 5px; height: 5px;
          border-radius: 50%; background: var(--clr-border-dark);
        }

        .footer-text {
          font-size: 12px; color: var(--clr-ink-3);
          font-family: var(--font-mono);
        }

        /* Reset link */
        .reset-link {
          display: block; text-align: center;
          margin-top: 16px; margin-bottom: 4px;
          font-size: 13px; color: var(--clr-ink-3);
          cursor: pointer; background: none; border: none;
          font-family: var(--font-body);
          text-decoration: underline; text-underline-offset: 3px;
          transition: color 150ms;
        }
        .reset-link:hover { color: var(--clr-accent); }

        @media (max-width: 768px) {
          .est-root { grid-template-columns: 1fr; }
          .est-left  { display: none; }
          .est-right { padding: 32px 24px; max-height: unset; }
        }
      `}</style>

      <div className="est-root">
        {/* ── Left decorative panel ── */}
        <div className="est-left">
          <div className="deco-circle deco-c1" />
          <div className="deco-circle deco-c2" />
          <div className="deco-circle deco-c3" />

          <div className={`left-brand ${mounted ? "show" : ""}`}>
            <div className="brand-mark">
              <div className="brand-icon">⚕</div>
              <span className="brand-name">TecMed</span>
            </div>
            <h1 className="left-heading">
              Consulta<br />
              <em>tus</em><br />
              notas
            </h1>
            <p className="left-sub">
              Ingresa tu carnet de identidad y matrícula para ver tus materias, parciales y calificaciones.
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

        {/* ── Right panel ── */}
        <div className="est-right">
          <div className={`est-card ${mounted ? "show" : ""}`}>

            {/* Botón volver */}
            {onBack && !estudiante && (
              <button className="back-btn" onClick={onBack}>
                ← Volver
              </button>
            )}

            {/* ── FORMULARIO ── */}
            {!estudiante && (
              <>
                <p className="card-eyebrow">Portal estudiante</p>
                <h2 className="card-title">Consulta tus notas</h2>
                <p className="card-subtitle">Ingresa tus datos para continuar</p>

                <div className="form-group">
                  <label className="form-label">Carnet de identidad</label>
                  <div className="input-wrap">
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Ej: 12345678"
                      value={ci}
                      onChange={e => { setCi(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleBuscar()}
                    />
                    <span className="input-icon">🪪</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Matrícula</label>
                  <div className="input-wrap">
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Ej: 1876543"
                      value={matricula}
                      onChange={e => { setMatricula(e.target.value); setError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleBuscar()}
                    />
                    <span className="input-icon">📋</span>
                  </div>
                </div>

                {error && (
                  <div className="error-box" key={error}>
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                  </div>
                )}

                <button
                  className="submit-btn"
                  onClick={handleBuscar}
                  disabled={loading}
                >
                  {loading
                    ? <><div className="spinner" /> Buscando…</>
                    : <>Ver mis notas →</>
                  }
                </button>

                <div className="card-footer">
                  <div className="footer-dot" />
                  <span className="footer-text">TecMed · Gestión 2026</span>
                  <div className="footer-dot" />
                </div>
              </>
            )}

            {/* ── RESULTADO ── */}
            {estudiante && (
              <div className="resultado-wrap">
                {/* Botón volver al formulario */}
                <button className="back-btn" onClick={handleReset}>
                  ← Buscar otro estudiante
                </button>

                {/* Perfil */}
                <div className="perfil-card">
                  <div className="perfil-avatar">🎓</div>
                  <div className="perfil-info">
                    <p className="perfil-nombre">
                      {estudiante.nombre} {estudiante.apellido}
                    </p>
                    <div className="perfil-meta">
                      <span className="meta-badge">CI {estudiante.ci_estudiante}</span>
                      <span className="meta-badge">Mat. {estudiante.matricula}</span>
                      {estudiante.anio && (
                        <span className="meta-badge">Año {estudiante.anio}</span>
                      )}
                      {estudiante.mencion && (
                        <span className="meta-badge accent">{estudiante.mencion}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Materias */}
                <p className="section-label">
                  {estudiante.materias.length} materia{estudiante.materias.length !== 1 ? "s" : ""} inscrita{estudiante.materias.length !== 1 ? "s" : ""}
                </p>

                {estudiante.materias.length === 0 && (
                  <div className="no-parciales">Sin materias inscritas.</div>
                )}

                {estudiante.materias.map(m => {
                  const isOpen = expandedMaterias.has(m.id_materia);
                  return (
                    <div className="materia-block" key={m.id_materia}>
                      <button
                        className="materia-header"
                        onClick={() => toggleMateria(m.id_materia)}
                      >
                        <span className="materia-sigla">{m.sigla}</span>
                        <span className="materia-nombre">
                          {m.nombre_materia ?? m.sigla}
                        </span>
                        {m.horario && (
                          <span className="materia-horario">{m.horario}</span>
                        )}
                        <span className={`materia-chevron ${isOpen ? "open" : ""}`}>▼</span>
                      </button>

                      {isOpen && (
                        <div className="parciales-wrap">
                          {m.parciales.length === 0 ? (
                            <p className="no-parciales">Sin parciales registrados.</p>
                          ) : (
                            <table className="parciales-table">
                              <thead>
                                <tr>
                                  <th>Parcial</th>
                                  <th>Tipo</th>
                                  <th>Fecha</th>
                                  <th>Nota / Val.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {m.parciales.map(p => (
                                  <tr key={p.id_parcial}>
                                    <td>
                                      <div>{p.nombre_parcial ?? "—"}</div>
                                      {p.nota_detalle?.observacion && (
                                        <div className="obs-text">"{p.nota_detalle.observacion}"</div>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`tipo-badge ${p.tipo === "parcial" ? "tipo-parcial" : "tipo-practica"}`}>
                                        {p.tipo ?? "—"}
                                      </span>
                                    </td>
                                    <td>
                                      {p.fecha
                                        ? new Date(p.fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })
                                        : "—"
                                      }
                                    </td>
                                    <td>
                                      {p.nota_detalle?.nota != null ? (() => {
                                        const estado = estadoParcial(p.nota_detalle.nota, p.valoracion);
                                        return (
                                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                            <span
                                              className="nota-pill"
                                              style={{ color: notaColor(estado), background: notaBg(estado) }}
                                            >
                                              {p.nota_detalle.nota} / {p.valoracion ?? "?"}
                                            </span>
                                            <span
                                              className="nota-pill"
                                              style={{ color: notaColor(estado), background: notaBg(estado), fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}
                                            >
                                              {estado}
                                            </span>
                                          </div>
                                        );
                                      })() : (
                                        <span className="sin-nota">Sin nota</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="card-footer">
                  <div className="footer-dot" />
                  <span className="footer-text">TecMed · Gestión 2026</span>
                  <div className="footer-dot" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}