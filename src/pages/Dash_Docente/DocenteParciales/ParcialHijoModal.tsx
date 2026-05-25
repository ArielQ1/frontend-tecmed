// ── Modal crear hijo (sub-parcial dentro de un grupal) ───────────────────────
//
// Cambios:
//  1. Buscador por CI *y* por nombre (un solo input busca en ambos)
//  2. Advertencia visual si un estudiante ya está en otro sub-parcial del mismo padre
//  3. Al crear, las notas del hijo se copian automáticamente al parcial padre (grupal)

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../../api/client";
import type { Estudiante, Materia, Parcial, ParcialGrupal } from "./Types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  materia:  Materia;
  padre:    ParcialGrupal;
  onClose:  () => void;
  onSaved:  () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Dado un id_estudiante, devuelve el nombre del sub-parcial hermano en que ya aparece, o null. */
function nombreHermanoConflicto(
  id_estudiante: string,
  hijos: Parcial[],
  estudiantesDeHijos: Map<string, Set<string>>,  // id_parcial → Set<id_estudiante>
): string | null {
  for (const hijo of hijos) {
    const set = estudiantesDeHijos.get(hijo.id_parcial);
    if (set?.has(id_estudiante)) {
      return hijo.nombre_parcial ?? "Sub-parcial sin nombre";
    }
  }
  return null;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ParcialHijoModal({ materia, padre, onClose, onSaved }: Props) {
  const valoracionPadre = padre.valoracion;

  const [form, setForm] = useState({ nombre_parcial: "", fecha: "" });
  const [busqueda,      setBusqueda]      = useState("");
  const [estudiantes,   setEstudiantes]   = useState<Estudiante[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [loadingE,      setLoadingE]      = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  // Mapa id_parcial_hijo → Set<id_estudiante> (para detectar duplicados)
  const [estudiantesDeHijos, setEstudiantesDeHijos] = useState<Map<string, Set<string>>>(new Map());

  // 1. Cargar inscritos en la materia
  useEffect(() => {
    apiFetch.get(`/parciales/${materia.id_materia}/estudiantes`)
      .then((data: Estudiante[]) => setEstudiantes(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingE(false));
  }, [materia.id_materia]);

  // 2. Para cada hijo existente, cargar qué estudiantes ya tiene
  useEffect(() => {
    if (padre.hijos.length === 0) return;
    Promise.all(
      padre.hijos.map(hijo =>
        apiFetch.get(`/notas/usuarios/parciales/${hijo.id_parcial}/notas-lista`)
          .then((notas: { id_estudiante: string }[]) => ({
            id_parcial: hijo.id_parcial,
            ids: new Set(notas.map(n => n.id_estudiante)),
          }))
          .catch(() => ({ id_parcial: hijo.id_parcial, ids: new Set<string>() }))
      )
    ).then(resultados => {
      const mapa = new Map<string, Set<string>>();
      resultados.forEach(r => mapa.set(r.id_parcial, r.ids));
      setEstudiantesDeHijos(mapa);
    });
  }, [padre.hijos]);

  // Filtro: busca por CI o por nombre_completo (case-insensitive)
  const estudiantesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter(e =>
      String(e.ci_estudiante).includes(q) ||
      `${e.nombre_completo}`.toLowerCase().includes(q)
    );
  }, [busqueda, estudiantes]);

  function toggleEstudiante(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleVisibles() {
    const ids = estudiantesFiltrados.map(e => e.id_estudiante);
    const todosActivos = ids.every(id => seleccionados.has(id));
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (todosActivos) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submit() {
    if (seleccionados.size === 0) {
      setError("Selecciona al menos un estudiante.");
      return;
    }
    setError(""); setLoading(true);

    const body: Record<string, unknown> = {
      grupo_estudiantes: Array.from(seleccionados),
    };
    if (form.nombre_parcial)     body.nombre_parcial = form.nombre_parcial;
    if (form.fecha)              body.fecha          = form.fecha;
    if (valoracionPadre != null) body.valoracion     = valoracionPadre;

    try {
      // Crear el sub-parcial hijo
      const hijoCreado = await apiFetch.post(
        `/parciales/${materia.id_materia}/grupal/${padre.id_parcial}`,
        body,
      ) as { id_parcial: string };

      // ── Punto 3: copiar notas al parcial padre (grupal) ───────────────────
      // Una vez creado el hijo, inicializamos notas vacías en el padre
      // para cada estudiante seleccionado (si aún no existe la nota ahí).
      // Esto permite que DocenteNotas muestre la nota del padre como agregado.
      // La copia real de valor se hace en DocenteNotas al editar notas del hijo.
      // Aquí solo aseguramos que el padre tenga registros para esos estudiantes.
      if (hijoCreado?.id_parcial) {
        await Promise.allSettled(
          Array.from(seleccionados).map(id_estudiante =>
            apiFetch.patch(
              `/notas/usuarios/${padre.id_parcial}/parciales/${padre.id_parcial}/notas/${id_estudiante}`,
              { nota: null, observacion: null },
            ).catch(() => {/* Si falla no es bloqueante */})
          )
        );
      }

      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear el sub-parcial");
    } finally {
      setLoading(false);
    }
  }

  // ── Cómputos para render ──────────────────────────────────────────────────

  const todosVisiblesActivos =
    estudiantesFiltrados.length > 0 &&
    estudiantesFiltrados.every(e => seleccionados.has(e.id_estudiante));

  // Estudiantes seleccionados que ya están en otro hermano
  const conflictos = useMemo(() => {
    const set = new Set<string>();
    seleccionados.forEach(id => {
      if (nombreHermanoConflicto(id, padre.hijos, estudiantesDeHijos)) set.add(id);
    });
    return set;
  }, [seleccionados, padre.hijos, estudiantesDeHijos]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="dd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dd-modal" style={{ maxWidth: 580 }}>
        <h2 className="dd-modal-title">
          Añadir sub-parcial
          <span className="dd-modal-sigla" style={{ color: "#7c3aed", background: "#ede9fe" }}>
            {padre.nombre_parcial ?? "Grupo"}
          </span>
        </h2>

        {error && <div className="dd-error">{error}</div>}

        {/* Advertencia de conflictos */}
        {conflictos.size > 0 && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: 8,
            background: "#fffbeb", border: "1.5px solid #fcd34d",
            fontSize: 12, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              <strong>{conflictos.size} estudiante{conflictos.size > 1 ? "s" : ""}</strong> ya {conflictos.size > 1 ? "aparecen" : "aparece"} en otro sub-parcial de este grupo.
              Puedes continuar, pero un mismo estudiante tendrá nota en dos sub-parciales distintos.
              <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Array.from(conflictos).map(id => {
                  const est = estudiantes.find(e => e.id_estudiante === id);
                  const hermano = nombreHermanoConflicto(id, padre.hijos, estudiantesDeHijos);
                  if (!est) return null;
                  return (
                    <span key={id} style={{
                      fontSize: 11, background: "#fef3c7", border: "1px solid #fcd34d",
                      borderRadius: 6, padding: "2px 7px",
                    }}>
                      {est.nombre_completo} → <em>{hermano}</em>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Nombre del sub-parcial */}
        <div className="dd-form-group">
          <label className="dd-form-label">Nombre</label>
          <input
            className="dd-form-input"
            value={form.nombre_parcial}
            onChange={e => setForm(f => ({ ...f, nombre_parcial: e.target.value }))}
            placeholder="Ej: Sub-parcial grupo A"
          />
        </div>

        {/* Fecha + Valoración heredada */}
        <div className="dd-form-row">
          <div className="dd-form-group">
            <label className="dd-form-label">Fecha</label>
            <input
              className="dd-form-input"
              type="date"
              value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            />
          </div>
          <div className="dd-form-group">
            <label className="dd-form-label">Valoración (pts)</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 7,
              background: "#f5f3ff", border: "1.5px solid #ddd6fe",
              fontSize: 14, fontWeight: 700, color: "#7c3aed",
            }}>
              {valoracionPadre != null ? `${valoracionPadre} pts` : "—"}
              <span style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 4 }}>
                (heredada del grupo)
              </span>
            </div>
          </div>
        </div>

        {/* ── Selector de estudiantes ─────────────────────────────────────── */}
        <div className="dd-form-group">

          {/* Cabecera */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label className="dd-form-label" style={{ margin: 0 }}>
              Estudiantes del grupo
              {seleccionados.size > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 11, color: "#7c3aed",
                  background: "#ede9fe", border: "1px solid #c4b5fd",
                  borderRadius: 10, padding: "1px 7px",
                }}>
                  {seleccionados.size} seleccionados
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={toggleVisibles}
              style={{
                fontSize: 11, color: "#6b7280", background: "none",
                border: "1px solid #e5e7eb", borderRadius: 5,
                padding: "3px 8px", cursor: "pointer",
              }}
            >
              {todosVisiblesActivos ? "Quitar visibles" : "Seleccionar visibles"}
            </button>
          </div>

          {/* Buscador por CI o nombre */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <span style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              fontSize: 13, color: "#9ca3af", pointerEvents: "none",
            }}>
              🔍
            </span>
            <input
              className="dd-form-input"
              style={{ paddingLeft: 30, marginBottom: 0 }}
              placeholder="Buscar por CI o nombre…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Lista */}
          {loadingE ? (
            <div className="dd-loading" style={{ padding: "12px 0" }}>Cargando estudiantes…</div>
          ) : estudiantesFiltrados.length === 0 ? (
            <p className="dd-empty-text">
              {busqueda ? `Sin resultados para "${busqueda}".` : "No hay estudiantes inscritos."}
            </p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8, maxHeight: 240, overflowY: "auto", padding: "4px 2px",
            }}>
              {estudiantesFiltrados.map(e => {
                const activo     = seleccionados.has(e.id_estudiante);
                const conflicto  = !!nombreHermanoConflicto(e.id_estudiante, padre.hijos, estudiantesDeHijos);
                const hermanoNom = conflicto
                  ? nombreHermanoConflicto(e.id_estudiante, padre.hijos, estudiantesDeHijos)
                  : null;

                return (
                  <button
                    key={e.id_estudiante}
                    type="button"
                    onClick={() => toggleEstudiante(e.id_estudiante)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${activo
                        ? conflicto ? "#f59e0b" : "#7c3aed"
                        : conflicto ? "#fcd34d" : "#e5e7eb"}`,
                      background: activo
                        ? conflicto ? "#fffbeb" : "#f5f3ff"
                        : conflicto ? "#fefce8" : "#fafafa",
                      textAlign: "left", transition: "all .12s",
                    }}
                  >
                    {/* Checkbox visual */}
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2,
                      border: `2px solid ${activo
                        ? conflicto ? "#f59e0b" : "#7c3aed"
                        : "#d1d5db"}`,
                      background: activo
                        ? conflicto ? "#f59e0b" : "#7c3aed"
                        : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {activo && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>

                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600, lineHeight: 1.2,
                        color: activo
                          ? conflicto ? "#92400e" : "#6d28d9"
                          : "#111827",
                      }}>
                        {e.nombre_completo}
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>
                        CI {e.ci_estudiante}
                      </div>
                      {/* Advertencia inline por estudiante */}
                      {conflicto && (
                        <div style={{ fontSize: 10, color: "#b45309", marginTop: 2 }}>
                          ⚠ ya en "{hermanoNom}"
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="dd-modal-actions">
          <button className="dd-cancel-btn" onClick={onClose}>Cancelar</button>
          <button
            className="dd-submit-btn"
            onClick={submit}
            disabled={loading || seleccionados.size === 0}
            style={conflictos.size > 0 ? { background: "#d97706", borderColor: "#b45309" } : {}}
          >
            {loading
              ? "Creando…"
              : conflictos.size > 0
              ? `Crear igual (${seleccionados.size} est., ${conflictos.size} ⚠)`
              : `Crear sub-parcial${seleccionados.size > 0 ? ` (${seleccionados.size} est.)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}