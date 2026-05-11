import { useState } from "react";
import { apiFetch } from "../api/client";
import { DocentesPanel } from "./PanelDocente";
import { AuxiliaresPanel } from "./PanelAuxiliar";
import { MateriasPanel } from "./PanelMaterias";
// import { EstudiantePage } from "./Dash_Estudiante";
import EstudiantePanel_admin, { } from "./PanelEstudiante";

type AdminSection = "materias" | "docentes" | "auxiliares" | "estudiantes";

interface AdminLayoutProps {
  onLogout: () => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: string }[] = [
  { id: "materias",    label: "Materias",    icon: "📚" },
  { id: "docentes",    label: "Docentes",    icon: "🎓" },
  { id: "auxiliares",  label: "Auxiliares",  icon: "🧑‍💼" },
  { id: "estudiantes", label: "Estudiantes", icon: "👥" },
];

export function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive]       = useState<AdminSection>("materias");

  async function handleLogout() {
    try { await apiFetch.post("/users/logout"); } catch { /* ignorar */ }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      onLogout();
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
          --sidebar-w:       240px;
          --sidebar-w-col:   68px;
          --header-h:        56px;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-font-smoothing: antialiased; }
        body { font-family: var(--font-body); background: var(--clr-bg); color: var(--clr-ink); }

        /* ── Shell ── */
        .admin-shell {
          display: flex;
          min-height: 100vh;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: var(--sidebar-w);
          min-height: 100vh;
          background: var(--clr-accent);
          display: flex;
          flex-direction: column;
          transition: width 280ms cubic-bezier(.4,0,.2,1);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .sidebar.collapsed { width: var(--sidebar-w-col); }

        /* decorative grid */
        .sidebar::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* ── Sidebar header ── */
        .sidebar-header {
          height: var(--header-h);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          border: 1.5px solid rgba(255,255,255,.35);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          flex-shrink: 0;
          background: rgba(255,255,255,.06);
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 19px;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          opacity: 1;
          transition: opacity 200ms ease, width 280ms ease;
        }
        .sidebar.collapsed .brand-name {
          opacity: 0;
          width: 0;
        }

        /* ── Toggle button ── */
        .sidebar-toggle {
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 1.5px solid var(--clr-border);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--clr-accent);
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0,0,0,.12);
          transition: transform 200ms ease, background 150ms;
        }
        .sidebar-toggle:hover { background: var(--clr-accent-light); }
        .sidebar.collapsed .sidebar-toggle { transform: translateY(-50%) rotate(180deg); }

        /* ── Nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(255,255,255,.35);
          padding: 8px 8px 4px;
          white-space: nowrap;
          overflow: hidden;
          transition: opacity 200ms ease;
          font-family: var(--font-mono);
        }
        .sidebar.collapsed .nav-section-label { opacity: 0; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          color: rgba(255,255,255,.65);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: background 150ms, color 150ms;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(255,255,255,.08);
          color: white;
        }

        .nav-item.active {
          background: rgba(255,255,255,.14);
          color: white;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: white;
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          font-size: 18px;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
        }

        .nav-label {
          overflow: hidden;
          opacity: 1;
          transition: opacity 200ms ease;
        }
        .sidebar.collapsed .nav-label { opacity: 0; }

        /* Tooltip on collapsed */
        .nav-item[data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--clr-ink);
          color: white;
          font-size: 12px;
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          font-family: var(--font-body);
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,.2);
        }

        /* ── Sidebar footer ── */
        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid rgba(255,255,255,.1);
          position: relative;
          z-index: 1;
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 8px;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.2);
        }

        .user-info {
          overflow: hidden;
          opacity: 1;
          transition: opacity 200ms ease;
        }
        .sidebar.collapsed .user-info { opacity: 0; }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
        }

        .user-role {
          font-size: 11px;
          color: rgba(255,255,255,.45);
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: .06em;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          color: rgba(255,255,255,.5);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 500;
          transition: background 150ms, color 150ms;
          white-space: nowrap;
        }
        .logout-btn:hover {
          background: rgba(155,34,38,.25);
          color: #ff9999;
        }

        .logout-icon { font-size: 17px; width: 24px; text-align: center; flex-shrink: 0; }
        .logout-label { overflow: hidden; opacity: 1; transition: opacity 200ms ease; }
        .sidebar.collapsed .logout-label { opacity: 0; }

        /* ── Main area ── */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── Topbar ── */
        .topbar {
          height: var(--header-h);
          background: var(--clr-surface);
          border-bottom: 1px solid var(--clr-border);
          display: flex;
          align-items: center;
          padding: 0 28px;
          gap: 12px;
          flex-shrink: 0;
        }

        .topbar-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--clr-ink-3);
        }

        .topbar-breadcrumb span:last-child {
          color: var(--clr-ink);
          font-weight: 600;
        }

        .topbar-sep { color: var(--clr-border-dark); }

        .topbar-spacer { flex: 1; }

        .topbar-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: var(--clr-accent-light);
          border: 1px solid rgba(29,78,107,.15);
          border-radius: 999px;
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--clr-accent);
          font-weight: 500;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--clr-accent-2);
        }

        /* ── Content ── */
        .admin-content {
          flex: 1;
          padding: 32px 36px;
          overflow-y: auto;
        }

        .content-header {
          margin-bottom: 28px;
        }

        .content-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--clr-accent-2);
          margin-bottom: 6px;
          font-family: var(--font-mono);
        }

        .content-title {
          font-family: var(--font-display);
          font-size: 30px;
          color: var(--clr-ink);
          line-height: 1.1;
        }

        /* placeholder panel */
        .placeholder-panel {
          background: var(--clr-surface);
          border: 1px solid var(--clr-border);
          border-radius: 14px;
          padding: 64px 40px;
          text-align: center;
          color: var(--clr-ink-3);
        }

        .placeholder-icon { font-size: 40px; margin-bottom: 16px; }
        .placeholder-text { font-size: 15px; font-weight: 300; }
      `}</style>

      <div className="admin-shell">
        {/* ── Sidebar ── */}
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          {/* Header */}
          <div className="sidebar-header">
            <div className="brand-icon">⚕</div>
            <span className="brand-name">TecMed</span>
            <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
              ◀
            </button>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            <span className="nav-section-label">Administración</span>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => setActive(item.id)}
                data-tooltip={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <div className="user-name">Administrador</div>
                <div className="user-role">admin</div>
              </div>
            </div>
            <button
              className="logout-btn"
              onClick={handleLogout}
              data-tooltip={collapsed ? "Cerrar sesión" : undefined}
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-label">Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="admin-main">
          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-breadcrumb">
              <span>Admin</span>
              <span className="topbar-sep">/</span>
              <span>{NAV_ITEMS.find(i => i.id === active)?.label}</span>
            </div>
            <div className="topbar-spacer" />
            <div className="topbar-badge">
              <div className="badge-dot" />
              Gestión 2026
            </div>
          </header>

          {/* Content */}
          <main className="admin-content">
            <div className="content-header">
              <p className="content-eyebrow">
                {NAV_ITEMS.find(i => i.id === active)?.icon}{" "}
                {active}
              </p>
              <h1 className="content-title">
                {NAV_ITEMS.find(i => i.id === active)?.label}
              </h1>
            </div>

            {/* Placeholder — aquí irán los paneles reales */}
            <div className="placeholder-panel">
              {active === "docentes"    && <DocentesPanel />}
                {active === "materias"    && <MateriasPanel />}
                {active === "auxiliares"  && <AuxiliaresPanel />}
                {active === "estudiantes" && <EstudiantePanel_admin />}
            </div>
        
          </main>
        </div>
      </div>
    </>
  );
}