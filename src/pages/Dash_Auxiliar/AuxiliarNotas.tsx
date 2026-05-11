import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../api/client";
import type { DatosNotas } from "./AuxiliarLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotaFila {
  id_estudiante:       string;
  nombre:              string;
  apellido:            string;
  nota:                number | null;
  observacion:         string | null;
  ultima_modificacion: string | null;
}

type EstadoFila = "idle" | "saving" | "saved" | "error";

interface FilaState {
  nota:        string;       // valor del input (string para manejar decimales)
  observacion: string;
  estado:      EstadoFila;
  error:       string;
  dirty:       boolean;      // true si el usuario tocó el input
}

interface Props {
  datos:    DatosNotas;
  onVolver: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function estadoNota(
  nota: number | null,
  valoracion: number | null,
): "aprobado" | "reprobado" | "sin-nota" {
  if (nota === null || valoracion === null) return "sin-nota";
  return nota >= valoracion / 2 ? "aprobado" : "reprobado";
}

// Extrae el id_usuario del JWT almacenado en localStorage
function getUsuarioId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// Bloqueado si han pasado más de 10 días desde la fecha del parcial
function esBloqueado(fecha: string | null): boolean {
  if (!fecha) return false;
  const dias = (Date.now() - new Date(fecha + "T00:00:00").getTime()) / 86400000;
  return dias > 10;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AuxiliarNotas({ datos, onVolver }: Props) {
  const { id_parcial, id_materia, nombre_parcial, sigla, fecha, valoracion } = datos;

  const [filas,   setFilas]   = useState<NotaFila[]>([]);
  const [estados, setEstados] = useState<Record<string, FilaState>>({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const usuarioId = useRef<string | null>(getUsuarioId());

  // ── Carga inicial: estudiantes inscritos + sus notas existentes ─────────────
  useEffect(() => {
    if (!usuarioId.current) {
      setError("No se pudo obtener el usuario del token.");
      return;
    }

    setLoading(true);
    setError("");

    Promise.all([
      // Estudiantes inscritos en la materia
      apiFetch.get(`/practicas/${id_materia}/estudiantes`),
      // Notas ya guardadas para este parcial
      apiFetch.get(
        `/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas`
      ),
    ])
      .then(([inscritos, notasExistentes]: [any[], NotaFila[]]) => {
        // Combinar: para cada inscrito, buscar su nota si ya existe
        const notaMap: Record<string, NotaFila> = {};
        notasExistentes.forEach(n => { notaMap[n.id_estudiante] = n; });

        const filasInicial: NotaFila[] = inscritos.map(e => ({
          id_estudiante:       e.id_estudiante,
          nombre:              e.nombre,
          apellido:            e.apellido,
          nota:                notaMap[e.id_estudiante]?.nota        ?? null,
          observacion:         notaMap[e.id_estudiante]?.observacion ?? null,
          ultima_modificacion: notaMap[e.id_estudiante]?.ultima_modificacion ?? null,
        }));

        setFilas(filasInicial);

        // Estado local de cada fila
        const est: Record<string, FilaState> = {};
        filasInicial.forEach(f => {
          est[f.id_estudiante] = {
            nota:        f.nota != null ? String(f.nota) : "",
            observacion: f.observacion ?? "",
            estado:      "idle",
            error:       "",
            dirty:       false,
          };
        });
        setEstados(est);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id_parcial, id_materia]);

  // ── Actualizar campo local ─────────────────────────────────────────────────

  function setFilaField(
    id: string,
    campo: "nota" | "observacion",
    valor: string,
  ) {
    setEstados(prev => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor, dirty: true, estado: "idle", error: "" },
    }));
  }

  // ── Guardar nota individual ────────────────────────────────────────────────

  async function guardar(id_estudiante: string) {
    if (!usuarioId.current) return;
    const fila = estados[id_estudiante];
    if (!fila) return;

    const notaNum = fila.nota === "" ? null : Number(fila.nota);

    if (notaNum !== null && isNaN(notaNum)) {
      setEstados(prev => ({
        ...prev,
        [id_estudiante]: { ...prev[id_estudiante], estado: "error", error: "Valor inválido" },
      }));
      return;
    }

    if (notaNum !== null && valoracion !== null && notaNum > valoracion) {
      setEstados(prev => ({
        ...prev,
        [id_estudiante]: {
          ...prev[id_estudiante],
          estado: "error",
          error:  `Máximo ${valoracion} pts`,
        },
      }));
      return;
    }

    setEstados(prev => ({
      ...prev,
      [id_estudiante]: { ...prev[id_estudiante], estado: "saving", error: "" },
    }));

    try {
      const body: Record<string, unknown> = {};
      if (notaNum !== null)        body.nota        = notaNum;
      if (fila.observacion !== "") body.observacion = fila.observacion;

      await apiFetch.patch(
        `/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas/${id_estudiante}`,
        body,
      );

      // Actualizar fila con la nota guardada
      setFilas(prev =>
        prev.map(f =>
          f.id_estudiante === id_estudiante
            ? { ...f, nota: notaNum, observacion: fila.observacion || null }
            : f,
        ),
      );

      setEstados(prev => ({
        ...prev,
        [id_estudiante]: { ...prev[id_estudiante], estado: "saved", dirty: false },
      }));

      // Reset estado visual tras 2s
      setTimeout(() => {
        setEstados(prev => ({
          ...prev,
          [id_estudiante]: { ...prev[id_estudiante], estado: "idle" },
        }));
      }, 2000);
    } catch (e: unknown) {
      setEstados(prev => ({
        ...prev,
        [id_estudiante]: {
          ...prev[id_estudiante],
          estado: "error",
          error:  e instanceof Error ? e.message : "Error al guardar",
        },
      }));
    }
  }

  // ── Guardar todo de una vez ────────────────────────────────────────────────

  async function guardarTodo() {
    const sucios = Object.entries(estados)
      .filter(([, f]) => f.dirty)
      .map(([id]) => id);

    await Promise.all(sucios.map(id => guardar(id)));
  }

  const haySucios  = Object.values(estados).some(f => f.dirty);
  const bloqueado  = esBloqueado(fecha);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dd-tab">
        <div className="dd-loading" style={{ marginTop: 40 }}>Cargando estudiantes y notas…</div>
      </div>
    );
  }

  return (
    <div className="dd-tab">
      {/* Cabecera */}
      <header className="dd-tab-header" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <button className="dd-btn-volver" onClick={onVolver}>
              ← Prácticas
            </button>
            <span className="dd-sigla-badge">{sigla}</span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--clr-ink-3)",
                background: "#f0ede8",
                border: "1px solid var(--clr-border)",
                borderRadius: 6,
                padding: "3px 8px",
              }}
            >
              {valoracion != null ? `/ ${valoracion} pts` : "sin valoración"}
            </span>
          </div>
          <h1 className="dd-tab-title">{nombre_parcial}</h1>
          <p className="dd-tab-sub">
            {fecha
              ? `Fecha: ${new Date(fecha).toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })}`
              : "Sin fecha asignada"}
            {" · "}
            {filas.length} estudiante{filas.length !== 1 ? "s" : ""} inscritos
          </p>
        </div>

        {haySucios && !bloqueado && (
          <button
            className="dd-btn-primary"
            onClick={guardarTodo}
            style={{ flexShrink: 0, marginTop: 4 }}
          >
            💾 Guardar todo
          </button>
        )}
      </header>

      {error && <div className="dd-error">⚠ {error}</div>}

      {bloqueado && (
        <div className="dn-bloqueado-banner">
          🔒 Han pasado más de 10 días desde la fecha de este parcial. Las notas son de solo lectura.
        </div>
      )}

      {filas.length === 0 ? (
        <div className="dd-empty-text">No hay estudiantes inscritos en esta materia.</div>
      ) : (
        <div className="dd-card">
          <table className="dd-table dn-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Estudiante</th>
                <th style={{ width: "18%" }}>Nota <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>/ {valoracion ?? "?"} pts</span></th>
                <th>Observación</th>
                <th style={{ width: "80px" }}>Estado</th>
                <th style={{ width: "90px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const est  = estados[f.id_estudiante];
                const nota = est?.nota ?? "";
                const notaNum = nota === "" ? null : Number(nota);
                const estado = estadoNota(notaNum, valoracion);

                return (
                  <tr key={f.id_estudiante} className={est?.dirty ? "dn-row-dirty" : ""}>

                    {/* Nombre */}
                    <td className="dd-td-name">
                      {f.nombre} {f.apellido}
                    </td>

                    {/* Input nota */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          className="dn-nota-input"
                          type="number"
                          min={0}
                          max={valoracion ?? undefined}
                          step="0.01"
                          value={nota}
                          placeholder="—"
                          disabled={bloqueado}
                          onChange={e => setFilaField(f.id_estudiante, "nota", e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !bloqueado && guardar(f.id_estudiante)}
                          style={{
                            borderColor:
                              est?.estado === "error"  ? "var(--clr-danger)"  :
                              est?.estado === "saved"  ? "#2d7a4a"            :
                              est?.dirty               ? "var(--clr-accent)"  :
                              undefined,
                          }}
                        />
                        {notaNum !== null && valoracion !== null && (
                          <span
                            className={`dn-estado-pill dn-${estado}`}
                            style={{ flexShrink: 0 }}
                          >
                            {estado === "aprobado" ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                      {est?.estado === "error" && (
                        <div className="dn-error-msg">{est.error}</div>
                      )}
                    </td>

                    {/* Observación */}
                    <td>
                      <input
                        className="dn-obs-input"
                        type="text"
                        value={est?.observacion ?? ""}
                        placeholder={bloqueado ? "solo lectura" : "opcional…"}
                        disabled={bloqueado}
                        onChange={e => setFilaField(f.id_estudiante, "observacion", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !bloqueado && guardar(f.id_estudiante)}
                      />
                    </td>

                    {/* Estado visual */}
                    <td>
                      {est?.estado === "saving" && (
                        <span className="dn-badge dn-badge-saving">guardando</span>
                      )}
                      {est?.estado === "saved" && (
                        <span className="dn-badge dn-badge-saved">✓ guardado</span>
                      )}
                      {est?.dirty && est.estado === "idle" && (
                        <span className="dn-badge dn-badge-pending">pendiente</span>
                      )}
                    </td>

                    {/* Botón guardar fila */}
                    <td>
                      <button
                        className="dd-btn-sm dd-btn-guardar"
                        onClick={() => guardar(f.id_estudiante)}
                        disabled={bloqueado || est?.estado === "saving" || !est?.dirty}
                        title="Guardar esta nota"
                      >
                        {est?.estado === "saving" ? "…" : "Guardar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      {filas.length > 0 && valoracion !== null && (
        <div className="dn-leyenda">
          <span className="dn-estado-pill dn-aprobado">✓</span> Aprobado (≥ {valoracion / 2} pts)
          <span style={{ margin: "0 12px", color: "var(--clr-border-dark)" }}>·</span>
          <span className="dn-estado-pill dn-reprobado">✗</span> Reprobado (&lt; {valoracion / 2} pts)
          <span style={{ margin: "0 12px", color: "var(--clr-border-dark)" }}>·</span>
          Enter o "Guardar" para registrar · "Guardar todo" guarda los pendientes
        </div>
      )}
    </div>
  );
}