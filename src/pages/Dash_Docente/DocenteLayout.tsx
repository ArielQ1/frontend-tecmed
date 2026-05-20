import { useState } from "react";
import "./DocenteStyle.css";
import { DocenteResumen }    from "./DocenteResumen";
import { DocenteEstudiantes } from "./DocenteEstudiantes";
import { DocenteParciales }   from "./DocenteParciales";
import { DocenteNotas }       from "./DocenteNotas";
// import { NotasResumen }       from "./NotasResumen";\

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DatosNotas {
  id_parcial:     string;
  id_materia:     string;
  nombre_parcial: string;
  sigla:          string;
  fecha:          string | null;
  valoracion:     number | null;
  parcial_grupal: string;
}

type Vista =
  | { tab: "resumen"      }
  | { tab: "notas"; id_materia?: string }
  | { tab: "estudiantes"  }
  | { tab: "parciales"    }
  | { tab: "notas-parc"; datos: DatosNotas };

interface DocenteInfo {
  username: string;
  rol:      string;
}

interface Props {
  onLogout:     () => void;
  docenteInfo?: DocenteInfo;
}

// ── Componente raíz ───────────────────────────────────────────────────────────

export function DashDocente({ onLogout, docenteInfo }: Props) {
  const [vista, setVista] = useState<Vista>({ tab: "resumen" });

  const tabActivo = vista.tab === "notas-parc" ? "parciales" : vista.tab;

  return (
    <div className="dd-root">
      <Sidebar
        tabActivo={tabActivo}
        onTab={tab => setVista({ tab } as Vista)}
        onLogout={onLogout}
        username={docenteInfo?.username ?? "Docente"}
      />
      <main className="dd-main">
        {vista.tab === "resumen"     && (<DocenteResumen />)}
        {vista.tab === "estudiantes" && <DocenteEstudiantes />}
        {vista.tab === "parciales"   && (
          <DocenteParciales
            onVerNotas={datos => setVista({ tab: "notas-parc", datos })}
          />
        )}
        {vista.tab === "notas-parc"  && (
          <DocenteNotas
            datos={vista.datos}
            onVolver={() => setVista({ tab: "parciales" })}
          />
        )}
      </main>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  tabActivo, onTab, onLogout, username,
}: {
  tabActivo: string;
  onTab:     (t: string) => void;
  onLogout:  () => void;
  username:  string;
}) {
  const items = [
    { id: "resumen",     icon: "◈",  label: "Resumen"     },
    { id: "estudiantes", icon: "👥", label: "Estudiantes" },
    { id: "parciales",   icon: "📝", label: "Parciales"   },
  ];

  return (
    <aside className="dd-sidebar">
      <div className="dd-brand">
        <span className="dd-brand-icon">⚕</span>
        <span className="dd-brand-name">TecMed</span>
      </div>
      <div className="dd-role-chip">Docente</div>
      <nav className="dd-nav">
        {items.map(it => (
          <button
            key={it.id}
            className={`dd-nav-item ${tabActivo === it.id ? "active" : ""}`}
            onClick={() => onTab(it.id)}
          >
            <span className="dd-nav-icon">{it.icon}</span>
            <span className="dd-nav-label">{it.label}</span>
            {tabActivo === it.id && <span className="dd-nav-bar" />}
          </button>
        ))}
      </nav>
      <div className="dd-sidebar-footer">
        <div className="dd-user">
          <div className="dd-user-avatar">{username[0]?.toUpperCase()}</div>
          <span className="dd-user-name">@{username}</span>
        </div>
        <button className="dd-logout" onClick={onLogout} title="Cerrar sesión">⏻</button>
      </div>
    </aside>
  );
}