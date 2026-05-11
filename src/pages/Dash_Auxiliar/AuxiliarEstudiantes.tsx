import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

interface Materia {
  id_materia: string;
  sigla:      string;
  horario:    string | null;
  anio:       number | null;
}

interface Estudiante {
  id_estudiante: string;
  ci_estudiante: number;
  matricula:     number;
  nombre:        string;
  apellido:      string;
  anio:          number | null;
  mencion:       string | null;
}

export function AuxiliarEstudiantes() {
  const [materias,    setMaterias]    = useState<Materia[]>([]);
  const [materia,     setMateria]     = useState<Materia | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loadingM,    setLoadingM]    = useState(false);
  const [loadingE,    setLoadingE]    = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    setLoadingM(true);
    apiFetch.get("/practicas/mis-materias")
      .then((d: any) => setMaterias(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingM(false));
  }, []);

  useEffect(() => {
    if (!materia) return;
    setLoadingE(true);
    setEstudiantes([]);
    apiFetch.get(`/practicas/${materia.id_materia}/estudiantes`)
      .then((d: any) => setEstudiantes(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingE(false));
  }, [materia]);

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
              onClick={() => setMateria(m)}
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
                  <th>Nombre</th><th>CI</th><th>Matrícula</th><th>Año</th><th>Mención</th>
                </tr>
              </thead>
              <tbody>
                {estudiantes.map(e => (
                  <tr key={e.id_estudiante}>
                    <td className="dd-td-name">{e.nombre} {e.apellido}</td>
                    <td>{e.ci_estudiante}</td>
                    <td>{e.matricula}</td>
                    <td>{e.anio ?? "—"}</td>
                    <td>{e.mencion
                      ? <span className="dd-mencion-badge">{e.mencion}</span>
                      : "—"}
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