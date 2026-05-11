import { useState } from "react";
import "../Dash_Docente/DocenteStyle.css";
import { AuxiliarEstudiantes } from "./AuxiliarEstudiantes";
import { AuxiliarPracticas }   from "./AuxiliarPracticas";
import { AuxiliarNotas }       from "./AuxiliarNotas";
import { AuxiliarResumen }     from "./AuxiliarResumen";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DatosNotas {
  id_parcial:     string;
  id_materia:     string;
  nombre_parcial: string;
  sigla:          string;
  fecha:          string | null;
  valoracion:     number | null;
}

type Vista =
  | { tab: "resumen"      }
  | { tab: "estudiantes"  }
  | { tab: "practicas"    }
  | { tab: "notas"; datos: DatosNotas };

interface AuxiliarInfo {
  username: string;
  rol:      string;
}

interface Props {
  onLogout:      () => void;
  auxiliarInfo?: AuxiliarInfo;
}

// ── Componente raíz ───────────────────────────────────────────────────────────

export function DashAuxiliar({ onLogout, auxiliarInfo }: Props) {
  const [vista, setVista] = useState<Vista>({ tab: "resumen" });

  const tabActivo = vista.tab === "notas" ? "practicas" : vista.tab;

  function irANotas(datos: DatosNotas) {
    setVista({ tab: "notas", datos });
  }

  function volverAPracticas() {
    setVista({ tab: "practicas" });
  }

  return (
    <div className="dd-root">
      <Sidebar
        tabActivo={tabActivo}
        onTab={tab => setVista({ tab } as Vista)}
        onLogout={onLogout}
        username={auxiliarInfo?.username ?? "Auxiliar"}
      />
      <main className="dd-main">
        {vista.tab === "resumen"     && <AuxiliarResumen />}
        {vista.tab === "estudiantes" && <AuxiliarEstudiantes />}
        {vista.tab === "practicas"   && <AuxiliarPracticas onVerNotas={irANotas} />}
        {vista.tab === "notas"       && (
          <AuxiliarNotas datos={vista.datos} onVolver={volverAPracticas} />
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
    { id: "resumen",     icon: "◈",  label: "Resumen"      },
    { id: "estudiantes", icon: "👥", label: "Estudiantes"  },
    { id: "practicas",   icon: "🧪", label: "Prácticas"    },
  ];

  return (
    <aside className="dd-sidebar">
      <div className="dd-brand">
        <span className="dd-brand-icon">⚕</span>
        <span className="dd-brand-name">TecMed</span>
      </div>
      <div className="dd-role-chip">Auxiliar</div>
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