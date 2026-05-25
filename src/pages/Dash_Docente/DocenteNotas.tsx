import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../api/client";
import type { DatosNotas } from "./DocenteLayout";
import { descargarListaEstudiantes, descargarNotasEstudiantes } from "./DocenteNotas/excel_InscritosMateria";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotaFila {
  id_estudiante:       string;
  nombre_completo:     string;
  nota:                number | null;
  observacion:         string | null;
  ultima_modificacion: string | null;
}

type EstadoFila = "idle" | "saving" | "saved" | "error";

interface FilaState {
  nota:        string;
  observacion: string;
  estado:      EstadoFila;
  error:       string;
  dirty:       boolean;
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

function esBloqueado(fecha: string | null): boolean {
  if (!fecha) return false;
  const dias = (Date.now() - new Date(fecha + "T00:00:00").getTime()) / 86400000;
  return dias > 10;
}

// ── Sincronización de nota al parcial grupal padre ────────────────────────────
//
// Cuando este parcial es un hijo (parcial_grupal != null), cada vez que se
// guarda una nota aquí se copia automáticamente al parcial padre (grupal).
// Esto mantiene las notas del padre siempre actualizadas con lo del hijo.

async function sincronizarConPadre(
  usuarioId:        string,
  id_parcial_padre: string,
  id_estudiante:    string,
  nota:             number | null,
  observacion:      string,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (nota !== null)       body.nota        = nota;
  if (observacion !== "") body.observacion = observacion;

  await apiFetch.patch(
    `/notas/usuarios/${usuarioId}/parciales/${id_parcial_padre}/notas/${id_estudiante}`,
    body,
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DocenteNotas({ datos, onVolver }: Props) {
  const {
    id_parcial,
    id_materia,
    nombre_parcial,
    sigla,
    valoracion,
    fecha,
    parcial_grupal,   // UUID del padre si este parcial es un hijo de un grupal
  } = datos;

  // Es hijo de un grupal si parcial_grupal es un UUID válido (no vacío, no nulo)
  const esHijoDeGrupal = !!parcial_grupal && parcial_grupal.trim() !== "";
  // Es el grupal padre si tipo === "grupal" — lo detectamos por ausencia de parcial_grupal
  const esGrupal       = !esHijoDeGrupal && datos.tipo === "grupal";

  const [filas,       setFilas]       = useState<NotaFila[]>([]);
  const [estados,     setEstados]     = useState<Record<string, FilaState>>({});
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [syncError,   setSyncError]   = useState<string | null>(null); // error no-bloqueante de sync
  const [descargando,      setDescargando]      = useState(false);
  const [descargandoNotas, setDescargandoNotas] = useState(false);
  const [subiendo,    setSubiendo]    = useState(false);
  const [bulkResumen, setBulkResumen] = useState<{
    notas_registradas: number;
    sin_nota_en_excel: number;
    omitidos:          number;
    advertencias:      string[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const usuarioId    = useRef<string | null>(getUsuarioId());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!usuarioId.current) {
      setError("No se pudo obtener el usuario del token.");
      return;
    }
    setLoading(true);
    setError("");

    if (esGrupal || esHijoDeGrupal) {
      // Para el padre grupal y para hijos: solo los estudiantes del grupo
      apiFetch
        .get(`/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas`)
        .then((notasExistentes: NotaFila[]) => {
          setFilas(notasExistentes);
          const est: Record<string, FilaState> = {};
          notasExistentes.forEach(f => {
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
    } else {
      // Parcial normal: todos los inscritos en la materia
      Promise.all([
        apiFetch.get(`/parciales/${id_materia}/estudiantes`),
        apiFetch.get(`/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas`),
      ])
        .then(([inscritos, notasExistentes]: [any[], NotaFila[]]) => {
          const notaMap: Record<string, NotaFila> = {};
          notasExistentes.forEach(n => { notaMap[n.id_estudiante] = n; });

          const filasInicial: NotaFila[] = inscritos.map(e => ({
            id_estudiante:       e.id_estudiante,
            nombre_completo:     e.nombre_completo,
            nota:                notaMap[e.id_estudiante]?.nota        ?? null,
            observacion:         notaMap[e.id_estudiante]?.observacion ?? null,
            ultima_modificacion: notaMap[e.id_estudiante]?.ultima_modificacion ?? null,
          }));

          setFilas(filasInicial);
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
    }
  }, [id_parcial, id_materia, esGrupal, esHijoDeGrupal]);

  // ── Actualizar campo local ─────────────────────────────────────────────────

  function setFilaField(id: string, campo: "nota" | "observacion", valor: string) {
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
          error: `Máximo ${valoracion} pts`,
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

      // 1. Guardar nota en el parcial hijo (o normal)
      await apiFetch.patch(
        `/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas/${id_estudiante}`,
        body,
      );

      // 2. ── Sincronizar con el parcial padre grupal ──────────────────────────
      //    Si este parcial es hijo de un grupal, replicamos la misma nota al padre.
      //    El error de sincronización es NO bloqueante: la nota del hijo ya se guardó.
      if (esHijoDeGrupal && parcial_grupal) {
        setSyncError(null);
        try {
          await sincronizarConPadre(
            usuarioId.current,
            parcial_grupal,
            id_estudiante,
            notaNum,
            fila.observacion,
          );
        } catch (syncErr: unknown) {
          // Mostramos aviso pero no revertimos la nota del hijo
          setSyncError(
            syncErr instanceof Error
              ? `Nota guardada, pero no se pudo copiar al parcial grupal: ${syncErr.message}`
              : "Nota guardada, pero no se pudo copiar al parcial grupal.",
          );
        }
      }

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
          error: e instanceof Error ? e.message : "Error al guardar",
        },
      }));
    }
  }

  // ── Guardar todo ───────────────────────────────────────────────────────────

  async function guardarTodo() {
    const sucios = Object.entries(estados)
      .filter(([, f]) => f.dirty)
      .map(([id]) => id);
    await Promise.all(sucios.map(id => guardar(id)));
  }

  // ── Descargar lista Excel ──────────────────────────────────────────────────

  async function descargarLista() {
    if (descargando || filas.length === 0) return;
    setDescargando(true);
    try {
      const inscritos: {
        id_estudiante:  string;
        ci_estudiante:  number;
        matricula:      number;
        nombre:         string;
        apellido:       string;
        nombre_completo?: string;
      }[] = await apiFetch.get(`/parciales/${id_materia}/estudiantes`);

      const estudiantesExcel = inscritos.map(e => ({
        matricula:     e.matricula     ?? 0,
        ci_estudiante: e.ci_estudiante ?? 0,
        nombre:        e.nombre        ?? (e.nombre_completo?.split(" ")[0]                  ?? ""),
        apellido:      e.apellido      ?? (e.nombre_completo?.split(" ").slice(1).join(" ") ?? ""),
      }));

      const token = localStorage.getItem("token") ?? "";
      let nombreDocente = "Docente";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        nombreDocente = payload.username ?? "Docente";
      } catch { /* ignorar */ }

      descargarListaEstudiantes({
        nombreMateria: sigla,
        nombreDocente,
        estudiantes:   estudiantesExcel,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al generar la lista");
    } finally {
      setDescargando(false);
    }
  }


  // ── Descargar notas actuales en Excel ─────────────────────────────────────

  async function descargarNotas() {
    if (descargandoNotas || filas.length === 0) return;
    setDescargandoNotas(true);
    try {
      const inscritos: {
        id_estudiante:   string;
        ci_estudiante:   number;
        matricula:       number;
        nombre_completo: string;
      }[] = await apiFetch.get(`/parciales/${id_materia}/estudiantes`);

      const token = localStorage.getItem("token") ?? "";
      let nombreDocente = "Docente";
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        nombreDocente = payload.username ?? "Docente";
      } catch { /* ignorar */ }

      // Combinar inscritos con notas actuales del estado local
      const estudiantesConNotas = inscritos.map(e => {
        const est      = estados[e.id_estudiante];
        const notaStr  = est?.nota ?? "";
        const notaNum  = notaStr !== "" ? Number(notaStr) : null;
        const filaBase = filas.find(f => f.id_estudiante === e.id_estudiante);

        // Separar nombre_completo en nombre / apellido
        const partes   = e.nombre_completo.trim().split(" ");
        const nombre   = partes[0]          ?? "";
        const apellido = partes.slice(1).join(" ") ?? "";

        return {
          matricula:     e.matricula,
          ci_estudiante: e.ci_estudiante,
          nombre,
          apellido,
          nota:        est?.dirty ? notaNum      : (filaBase?.nota        ?? null),
          observacion: est?.dirty ? (est.observacion || null) : (filaBase?.observacion ?? null),
        };
      });

      await descargarNotasEstudiantes({
        nombreMateria: sigla,
        nombreDocente,
        nombreParcial: nombre_parcial ?? "Parcial",
        valoracion,
        estudiantes:   estudiantesConNotas,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al generar el Excel de notas");
    } finally {
      setDescargandoNotas(false);
    }
  }

  // ── Subir notas desde Excel ────────────────────────────────────────────────

  async function subirExcel(file: File) {
    setSubiendo(true);
    setBulkResumen(null);

    try {
      const formData = new FormData();
      formData.append("id_parcial", id_parcial);
      formData.append("file", file);

      const resultado = await apiFetch.postForm(
        "/docente/bulk-notas",
        formData,
      ) as {
        notas_registradas: number;
        sin_nota_en_excel: number;
        omitidos:          number;
        advertencias:      string[];
      };

      setBulkResumen(resultado);

      if (resultado.notas_registradas > 0) {
        const notasActualizadas: NotaFila[] = await apiFetch.get(
          `/notas/usuarios/${usuarioId.current}/parciales/${id_parcial}/notas`,
        );

        const notaMap: Record<string, NotaFila> = {};
        notasActualizadas.forEach(n => { notaMap[n.id_estudiante] = n; });

        setFilas(prev =>
          prev.map(f => ({
            ...f,
            nota:                notaMap[f.id_estudiante]?.nota                ?? f.nota,
            observacion:         notaMap[f.id_estudiante]?.observacion         ?? f.observacion,
            ultima_modificacion: notaMap[f.id_estudiante]?.ultima_modificacion ?? f.ultima_modificacion,
          })),
        );

        setEstados(prev => {
          const next = { ...prev };
          notasActualizadas.forEach(n => {
            if (next[n.id_estudiante]) {
              next[n.id_estudiante] = {
                ...next[n.id_estudiante],
                nota:        n.nota != null ? String(n.nota) : "",
                observacion: n.observacion ?? "",
                dirty:       false,
                estado:      "saved",
                error:       "",
              };
            }
          });
          return next;
        });

        // ── Sincronizar bulk con el padre grupal ─────────────────────────────
        if (esHijoDeGrupal && parcial_grupal && usuarioId.current) {
          const uid = usuarioId.current;
          await Promise.allSettled(
            notasActualizadas.map(n =>
              sincronizarConPadre(
                uid,
                parcial_grupal,
                n.id_estudiante,
                n.nota,
                n.observacion ?? "",
              ),
            ),
          );
        }

        setTimeout(() => {
          setEstados(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(id => {
              if (next[id].estado === "saved") {
                next[id] = { ...next[id], estado: "idle" };
              }
            });
            return next;
          });
        }, 3000);
      }
    } catch (err: unknown) {
      setBulkResumen({
        notas_registradas: 0,
        sin_nota_en_excel: 0,
        omitidos:          0,
        advertencias: [
          err instanceof Error ? err.message : "Error al subir el archivo",
        ],
      });
    } finally {
      setSubiendo(false);
    }
  }

  const bloqueado = esBloqueado(fecha);

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
              ← Parciales
            </button>
            <span className="dd-sigla-badge">{sigla}</span>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--clr-ink-3)", background: "#f0ede8",
              border: "1px solid var(--clr-border)", borderRadius: 6, padding: "3px 8px",
            }}>
              {valoracion != null ? `/ ${valoracion} pts` : "sin valoración"}
            </span>

            {/* Badge: parcial hijo */}
            {esHijoDeGrupal && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#7c3aed",
                background: "#ede9fe", border: "1px solid #c4b5fd",
                borderRadius: 6, padding: "3px 8px",
              }}>
                └ Sub-parcial
              </span>
            )}

            {/* Badge: parcial grupal padre */}
            {esGrupal && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: "#7c3aed",
                background: "#ede9fe", border: "1px solid #c4b5fd",
                borderRadius: 6, padding: "3px 8px",
              }}>
                👥 Parcial grupal
              </span>
            )}
          </div>
          <h1 className="dd-tab-title">{nombre_parcial}</h1>
          <p className="dd-tab-sub">
            {fecha
              ? `Fecha: ${new Date(fecha).toLocaleDateString("es-BO", {
                  day: "2-digit", month: "long", year: "numeric",
                })}`
              : "Sin fecha asignada"}
            {" · "}
            {filas.length} estudiante{filas.length !== 1 ? "s" : ""}
            {esHijoDeGrupal ? " en este sub-grupo" : esGrupal ? " en el grupo" : " inscritos"}
          </p>
        </div>

        {/* Botones */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 4, flexWrap: "wrap" }}>
          {/* Descargar lista vacía (para que el docente llene y suba) */}
          <button
            className="dd-btn-secondary"
            onClick={descargarLista}
            disabled={descargando || filas.length === 0}
            title="Descargar lista vacía de estudiantes en formato Excel"
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: filas.length === 0 ? 0.5 : 1 }}
          >
            {descargando ? "⏳ Generando…" : "📋 Lista estudiantes"}
          </button>

          {/* Descargar notas actuales con colores aprobado/reprobado */}
          <button
            className="dd-btn-secondary"
            onClick={descargarNotas}
            disabled={descargandoNotas || filas.length === 0}
            title="Descargar notas actuales en formato Excel"
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: filas.length === 0 ? 0.5 : 1 }}
          >
            {descargandoNotas ? "⏳ Generando…" : "📊 Descargar notas"}
          </button>
        </div>
      </header>

      {/* Errores */}
      {error && <div className="dd-error">⚠ {error}</div>}

      {/* Aviso de sincronización fallida (no bloqueante) */}
      {syncError && (
        <div style={{
          margin: "0 0 12px", padding: "10px 14px", borderRadius: 8,
          background: "#fffbeb", border: "1.5px solid #fcd34d",
          fontSize: 12, color: "#92400e", display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>{syncError}</span>
          <button
            onClick={() => setSyncError(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#92400e", fontSize: 15 }}
          >×</button>
        </div>
      )}

      {/* Aviso de lectura en parcial grupal padre */}
      {esGrupal && (
        <div style={{
          margin: "0 0 16px", padding: "10px 14px", borderRadius: 8,
          background: "#f5f3ff", border: "1.5px solid #c4b5fd",
          fontSize: 12, color: "#5b21b6", display: "flex", gap: 8,
        }}>
          <span>👥</span>
          <span>
            Este es el <strong>parcial grupal padre</strong>. Las notas mostradas aquí son copias de los sub-parciales.
            Para editar, entra al sub-parcial correspondiente desde la tabla de parciales.
          </span>
        </div>
      )}

      {bloqueado && (
        <div className="dn-bloqueado-banner">
          🔒 Han pasado más de 10 días desde la fecha de este parcial. Las notas son de solo lectura.
        </div>
      )}

      {/* Zona de carga masiva Excel — oculta en grupal padre y en parciales bloqueados */}
      {!bloqueado && !esGrupal && (
        <div
          onDragOver={e  => { e.preventDefault(); setDragOver(true);  }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault(); setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) subirExcel(file);
          }}
          onClick={() => !subiendo && fileInputRef.current?.click()}
          style={{
            margin:       "0 0 16px",
            padding:      bulkResumen ? "14px 18px" : "22px 18px",
            borderRadius: 10,
            border:       `2px dashed ${dragOver
              ? "var(--clr-accent)"
              : bulkResumen
              ? (bulkResumen.advertencias.length === 0 ? "#86efac" : "#fca5a5")
              : "var(--clr-border-dark)"}`,
            background:   dragOver
              ? "var(--clr-accent-soft, #f0f4ff)"
              : bulkResumen
              ? (bulkResumen.advertencias.length === 0 ? "#f0fdf4" : "#fff7f7")
              : "var(--clr-surface, #fafaf8)",
            cursor:     subiendo ? "wait" : "pointer",
            transition: "border-color 0.15s, background 0.15s",
            userSelect: "none",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) subirExcel(f); }}
          />

          {!bulkResumen && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, pointerEvents: "none" }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{subiendo ? "⏳" : "📂"}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--clr-ink-1)" }}>
                  {subiendo ? "Leyendo archivo…" : "Subir notas desde Excel"}
                </div>
                <div style={{ fontSize: 12, color: "var(--clr-ink-3)", marginTop: 2 }}>
                  {subiendo
                    ? "Por favor espere"
                    : "Arrastra un .xlsx aquí o haz clic para seleccionar · columnas: Nota, Observacion"}
                </div>
              </div>
            </div>
          )}

          {bulkResumen && (
            <div onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>
                    {bulkResumen.advertencias.length === 0 ? "✅" : "⚠️"}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--clr-ink-1)" }}>
                      {bulkResumen.notas_registradas > 0
                        ? `${bulkResumen.notas_registradas} nota${bulkResumen.notas_registradas !== 1 ? "s" : ""} guardada${bulkResumen.notas_registradas !== 1 ? "s" : ""}`
                        : "No se registró ninguna nota"}
                      {bulkResumen.omitidos > 0 && (
                        <span style={{ fontWeight: 400, color: "var(--clr-ink-3)", marginLeft: 8 }}>
                          · {bulkResumen.omitidos} omitido{bulkResumen.omitidos !== 1 ? "s" : ""}
                        </span>
                      )}
                      {bulkResumen.sin_nota_en_excel > 0 && (
                        <span style={{ fontWeight: 400, color: "var(--clr-ink-3)", marginLeft: 8 }}>
                          · {bulkResumen.sin_nota_en_excel} sin nota en Excel
                        </span>
                      )}
                    </div>
                    {bulkResumen.advertencias.length > 0 && (
                      <ul style={{ margin: "5px 0 0 16px", padding: 0, fontSize: 12, color: "#b91c1c" }}>
                        {bulkResumen.advertencias.map((adv, i) => <li key={i}>{adv}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 11, color: "var(--clr-ink-3)" }}>Clic para subir otro</span>
                  <button
                    onClick={e => { e.stopPropagation(); setBulkResumen(null); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, lineHeight: 1, color: "var(--clr-ink-3)", padding: "0 2px" }}
                    title="Cerrar"
                  >×</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de notas */}
      {filas.length === 0 ? (
        <div className="dd-empty-text">
          {esGrupal
            ? "No hay estudiantes asignados a este parcial grupal."
            : esHijoDeGrupal
            ? "No hay estudiantes asignados a este sub-parcial."
            : "No hay estudiantes inscritos en esta materia."}
        </div>
      ) : (
        <div className="dd-card">
          <table className="dd-table dn-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Estudiante</th>
                <th style={{ width: "18%" }}>
                  Nota{" "}
                  <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                    / {valoracion ?? "?"} pts
                  </span>
                </th>
                <th>Observación</th>
                <th style={{ width: "80px" }}>Estado</th>
                <th style={{ width: "90px" }}>
                  <button className="dd-btn-primary" onClick={guardarTodo}>
                    💾 Guardar todo
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map(f => {
                const est     = estados[f.id_estudiante];
                const nota    = est?.nota ?? "";
                const notaNum = nota === "" ? null : Number(nota);
                const estado  = estadoNota(notaNum, valoracion);
                // El grupal padre es solo lectura — las notas vienen de los hijos
                const soloLectura = bloqueado || esGrupal;

                return (
                  <tr key={f.id_estudiante} className={est?.dirty ? "dn-row-dirty" : ""}>
                    <td className="dd-td-name">{f.nombre_completo}</td>

                    {/* Nota */}
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
                          disabled={soloLectura}
                          onChange={e => setFilaField(f.id_estudiante, "nota", e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !soloLectura && guardar(f.id_estudiante)}
                          style={{
                            borderColor:
                              est?.estado === "error" ? "var(--clr-danger)"  :
                              est?.estado === "saved" ? "#2d7a4a"            :
                              est?.dirty              ? "var(--clr-accent)"  :
                              undefined,
                          }}
                        />
                        {notaNum !== null && valoracion !== null && (
                          <span className={`dn-estado-pill dn-${estado}`} style={{ flexShrink: 0 }}>
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
                        placeholder={soloLectura ? "solo lectura" : "opcional…"}
                        disabled={soloLectura}
                        onChange={e => setFilaField(f.id_estudiante, "observacion", e.target.value)}
                        onKeyDown={e => e.key === "Enter" && !soloLectura && guardar(f.id_estudiante)}
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
                        disabled={soloLectura || est?.estado === "saving" || !est?.dirty}
                        title={esGrupal ? "Las notas del grupal se editan desde los sub-parciales" : "Guardar esta nota"}
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
          {!esGrupal && (
            <>
              <span style={{ margin: "0 12px", color: "var(--clr-border-dark)" }}>·</span>
              Enter o "Guardar" para registrar · "Guardar todo" guarda los pendientes
              {esHijoDeGrupal && (
                <span style={{ marginLeft: 12, color: "#7c3aed" }}>
                  · ✦ Notas copiadas automáticamente al parcial grupal padre
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}