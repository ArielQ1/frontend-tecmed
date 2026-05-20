import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia: string;
  sigla:      string;
  horario:    string | null;
  anio:       number | null;
}

interface Parcial {
  id_parcial: string;
  valoracion: number | null;
}

interface Estudiante {
  id_estudiante: string;
  ci_estudiante: number;
  matricula:     number;
  nombre_completo: string;
  anio:          number | null;
  mencion:       string | null;
}

type NotasResumen = Record<string, Record<string, number | null>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularEstado(
  id_estudiante: string,
  parciales:     Parcial[],
  notas:         NotasResumen,
): "aprobando" | "reprobando" | "sin notas" {
  const notasEst = notas[id_estudiante];
  if (!notasEst) return "sin notas";

  let totalVal  = 0;
  let totalNota = 0;
  let tieneNota = false;

  for (const p of parciales) {
    if (p.valoracion == null) continue;
    const nota = notasEst[p.id_parcial];
    if (nota != null) {
      totalNota += nota;
      totalVal  += p.valoracion;
      tieneNota  = true;
    }
  }
  if (!tieneNota) return "sin notas";
  return totalNota / totalVal >= 0.5 ? "aprobando" : "reprobando";
}

function EstadoBadge({ estado }: { estado: "aprobando" | "reprobando" | "sin notas" }) {
  const cfg = {
    aprobando:   { bg: "#eafaf1", color: "#1e8449", border: "#a9dfbf", label: "✓ Aprobando"  },
    reprobando:  { bg: "#fdf0ef", color: "#9b2226", border: "#f5c6c2", label: "✗ Reprobando" },
    "sin notas": { bg: "#f4f3f0", color: "#9a9088", border: "#e0dbd3", label: "— Sin notas"  },
  }[estado];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
      fontFamily: "var(--font-mono)",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocenteEstudiantes() {
  const [materias,    setMaterias]    = useState<Materia[]>([]);
  const [materia,     setMateria]     = useState<Materia | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [parciales,   setParciales]   = useState<Parcial[]>([]);
  const [notas,       setNotas]       = useState<NotasResumen>({});
  const [loadingM,    setLoadingM]    = useState(false);
  const [loadingE,    setLoadingE]    = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    setLoadingM(true);
    apiFetch.get("/parciales/mis-materias")
      .then(data => setMaterias(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingM(false));
  }, []);

  function seleccionar(m: Materia) {
    setMateria(m);
    setLoadingE(true);
    setEstudiantes([]); setParciales([]); setNotas({});
    Promise.all([
      apiFetch.get(`/parciales/${m.id_materia}/estudiantes`),
      apiFetch.get(`/parciales/${m.id_materia}`),
      apiFetch.get(`/parciales/${m.id_materia}/notas-resumen`),
    ])
      .then(([ests, pars, nts]) => {
        setEstudiantes(ests as Estudiante[]);
        setParciales(pars   as Parcial[]);
        setNotas(nts        as NotasResumen);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingE(false));
  }

  return (
    <div className="dd-tab">
      <header className="dd-tab-header">
        <h1 className="dd-tab-title">Estudiantes</h1>
        <p className="dd-tab-sub">Selecciona una materia para ver los inscritos</p>
      </header>

      {error && <div className="dd-error">⚠ {error}</div>}

      {loadingM ? (
        <div className="dd-loading">Cargando materias…</div>
      ) : (
        <div className="dd-materia-tabs">
          {materias.map(m => (
            <button
              key={m.id_materia}
              className={`dd-materia-chip ${materia?.id_materia === m.id_materia ? "active" : ""}`}
              onClick={() => seleccionar(m)}
            >
              <span className="dd-chip-sigla">{m.sigla}</span>
              {m.horario && <span className="dd-chip-horario">{m.horario}</span>}
            </button>
          ))}
          {materias.length === 0 && <p className="dd-empty-text">No tienes materias asignadas.</p>}
        </div>
      )}

      {materia && (
        <div className="dd-card" style={{ marginTop: 24 }}>
          <div className="dd-card-header">
            <span className="dd-sigla-badge">{materia.sigla}</span>
            <span className="dd-card-label">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} inscritos
            </span>
          </div>

          {loadingE ? (
            <div className="dd-loading" style={{ padding: "24px 20px" }}>Cargando…</div>
          ) : estudiantes.length === 0 ? (
            <div className="dd-empty-text" style={{ padding: "24px 20px" }}>Sin estudiantes inscritos.</div>
          ) : (
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>CI</th>
                  <th>Matrícula</th>
                  <th>Año</th>
                  <th>Mención</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map(e => (
                  <tr key={e.id_estudiante}>
                    <td className="dd-td-name">{e.nombre_completo}</td>
                    <td>{e.ci_estudiante}</td>
                    <td>{e.matricula}</td>
                    <td>{e.anio ?? "—"}</td>
                    <td>
                      {e.mencion
                        ? <span className="dd-mencion-badge">{e.mencion}</span>
                        : "—"}
                    </td>
                    <td>
                      <EstadoBadge estado={calcularEstado(e.id_estudiante, parciales, notas)} />
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
}