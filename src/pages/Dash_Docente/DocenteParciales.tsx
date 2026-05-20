import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../api/client";
import type { DatosNotas } from "./DocenteLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia: string;
  sigla:      string;
  horario:    string | null;
  anio:       number | null;
}

interface Estudiante {
  id_estudiante: string;
  nombre:        string;
  apellido:      string;
  ci_estudiante: number;
}

/** Parcial normal o hijo de un grupal */
interface Parcial {
  id_parcial:     string;
  nombre_parcial: string | null;
  fecha:          string | null;
  valoracion:     number | null;
  id_materia:     string;
  tipo:           "parcial" | "grupal" | string;
  parcial_grupal: string;   // UUID del padre si es hijo
}

/** Parcial grupal padre con sus hijos embebidos (respuesta del GET) */
interface ParcialGrupal extends Parcial {
  tipo:  "grupal";
  hijos: Parcial[];
}

type ItemLista = Parcial | ParcialGrupal;

function esGrupal(p: ItemLista): p is ParcialGrupal {
  return p.tipo === "grupal";
}

type ModalState =
  | { type: "none" }
  | { type: "create";       materia: Materia }
  | { type: "create-hijo";  materia: Materia; padre: ParcialGrupal }
  | { type: "edit";         materia: Materia; parcial: Parcial }
  | { type: "delete";       materia: Materia; parcial: Parcial; esGrupalPadre?: boolean };

interface Props {
  onVerNotas: (datos: DatosNotas) => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function esBloqueado(fecha: string | null): boolean {
  if (!fecha) return false;
  return (Date.now() - new Date(fecha + "T00:00:00").getTime()) / 86400000 > 10;
}

function fmtFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocenteParciales({ onVerNotas }: Props) {
  const [materias,  setMaterias]  = useState<Materia[]>([]);
  const [materia,   setMateria]   = useState<Materia | null>(null);
  const [parciales, setParciales] = useState<ItemLista[]>([]);
  const [loadingM,  setLoadingM]  = useState(false);
  const [loadingP,  setLoadingP]  = useState(false);
  const [error,     setError]     = useState("");
  const [modal,     setModal]     = useState<ModalState>({ type: "none" });
  // Qué filas grupales están expandidas
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoadingM(true);
    apiFetch.get("/parciales/mis-materias")
      .then(data => setMaterias(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingM(false));
  }, []);

  const cargarParciales = useCallback((m: Materia) => {
    setLoadingP(true);
    setParciales([]);
    setExpandidos(new Set());
    apiFetch.get(`/parciales/${m.id_materia}`)
      .then(data => setParciales(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingP(false));
  }, []);

  function seleccionar(m: Materia) {
    setMateria(m);
    cargarParciales(m);
  }

  function onSaved() {
    setModal({ type: "none" });
    if (materia) cargarParciales(materia);
  }

  function toggleExpandir(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Total de parciales raíz (grupales cuentan como 1 aunque tengan hijos)
  const totalRaices = parciales.length;

  return (
    <div className="dd-tab">
      <header className="dd-tab-header">
        <h1 className="dd-tab-title">Parciales</h1>
        <p className="dd-tab-sub">Gestiona los parciales de tus materias</p>
      </header>

      {error && <div className="dd-error">⚠ {error}</div>}

      {/* Selector de materia */}
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
          {materias.length === 0 && (
            <p className="dd-empty-text">No tienes materias asignadas.</p>
          )}
        </div>
      )}

      {/* Tabla de parciales */}
      {materia && (
        <div className="dd-card" style={{ marginTop: 24 }}>
          <div className="dd-card-header">
            <span className="dd-sigla-badge">{materia.sigla}</span>
            <span className="dd-card-label">
              {totalRaices} parcial{totalRaices !== 1 ? "es" : ""}
            </span>
            <button
              className="dd-btn-primary"
              style={{ marginLeft: "auto" }}
              onClick={() => setModal({ type: "create", materia })}
            >
              + Nuevo parcial
            </button>
          </div>

          {loadingP ? (
            <div className="dd-loading" style={{ padding: "24px 20px" }}>Cargando…</div>
          ) : parciales.length === 0 ? (
            <div className="dd-empty-text" style={{ padding: "24px 20px" }}>
              Sin parciales. Crea el primero.
            </div>
          ) : (
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Valoración</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parciales.map(p => (
                  <FilaParcial
                    key={p.id_parcial}
                    item={p}
                    materia={materia}
                    expandido={expandidos.has(p.id_parcial)}
                    onToggle={() => toggleExpandir(p.id_parcial)}
                    onVerNotas={onVerNotas}
                    onEdit={parcial => setModal({ type: "edit", materia, parcial })}
                    onDelete={(parcial, esGrupalPadre) =>
                      setModal({ type: "delete", materia, parcial, esGrupalPadre })
                    }
                    onAddHijo={padre =>
                      setModal({ type: "create-hijo", materia, padre })
                    }
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal.type === "create" && (
        <ParcialModal
          materia={modal.materia}
          onClose={() => setModal({ type: "none" })}
          onSaved={onSaved}
        />
      )}
      {modal.type === "create-hijo" && (
        <ParcialHijoModal
          materia={modal.materia}
          padre={modal.padre}
          onClose={() => setModal({ type: "none" })}
          onSaved={onSaved}
        />
      )}
      {modal.type === "edit" && (
        <ParcialModal
          materia={modal.materia}
          parcial={modal.parcial}
          onClose={() => setModal({ type: "none" })}
          onSaved={onSaved}
        />
      )}
      {modal.type === "delete" && (
        <DeleteModal
          materia={modal.materia}
          parcial={modal.parcial}
          esGrupalPadre={modal.esGrupalPadre}
          onClose={() => setModal({ type: "none" })}
          onDeleted={onSaved}
        />
      )}
    </div>
  );
}

// ── Fila parcial (normal o grupal con hijos) ──────────────────────────────────

function FilaParcial({
  item,
  materia,
  expandido,
  onToggle,
  onVerNotas,
  onEdit,
  onDelete,
  onAddHijo,
}: {
  item:       ItemLista;
  materia:    Materia;
  expandido:  boolean;
  onToggle:   () => void;
  onVerNotas: (datos: DatosNotas) => void;
  onEdit:     (p: Parcial) => void;
  onDelete:   (p: Parcial, esGrupalPadre?: boolean) => void;
  onAddHijo:  (padre: ParcialGrupal) => void;
}) {
  const bloqueado = esBloqueado(item.fecha);

  if (esGrupal(item)) {
    // ── Fila padre grupal ─────────────────────────────────────────────────────
    return (
      <>
        <tr
          style={{
            background: "rgba(124, 58, 237, 0.04)",
            borderLeft: "3px solid #7c3aed",
          }}
        >
          {/* Nombre con toggle */}
          <td className="dd-td-name" style={{ paddingLeft: 12 }}>
            <button
              onClick={onToggle}
              style={{
                background: "none", border: "none", cursor: "pointer",
                marginRight: 6, fontSize: 12, color: "#7c3aed", fontWeight: 700,
              }}
              title={expandido ? "Colapsar" : "Expandir hijos"}
            >
              {expandido ? "▾" : "▸"}
            </button>
            {item.nombre_parcial ?? "—"}
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              color: "#7c3aed", background: "#ede9fe",
              border: "1px solid #c4b5fd", borderRadius: 4,
              padding: "2px 6px", verticalAlign: "middle",
            }}>
              GRUPAL
            </span>
          </td>

          {/* Tipo */}
          <td>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {item.hijos.length} sub-parcial{item.hijos.length !== 1 ? "es" : ""}
            </span>
          </td>

          {/* Fecha */}
          <td>{fmtFecha(item.fecha)}</td>

          {/* Valoración */}
          <td>
            {item.valoracion != null
              ? <span className="dd-val-badge">{item.valoracion} pts</span>
              : "—"}
          </td>

          {/* Acciones padre */}
          <td>
            <div className="dd-row-actions">
              <button
                className="dd-btn-sm"
                style={{
                  background: "#ede9fe", color: "#7c3aed",
                  border: "1px solid #c4b5fd", borderRadius: 6,
                  padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
                onClick={() => onAddHijo(item)}
                title="Añadir parcial al grupo"
              >
                + Añadir parcial
              </button>
              <button
                className="dd-btn-sm dd-btn-edit"
                disabled={bloqueado}
                title={bloqueado ? "Han pasado más de 10 días" : "Editar"}
                onClick={() => onEdit(item)}
              >
                ✏️ Editar
              </button>
              <button
                className="dd-btn-sm dd-btn-del"
                onClick={() => onDelete(item, true)}
                title="Eliminar grupo y todos sus sub-parciales"
              >
                🗑
              </button>
            </div>
          </td>
        </tr>

        {/* Filas hijos (colapsables) */}
        {expandido && item.hijos.map(hijo => (
          <FilaHijo
            key={hijo.id_parcial}
            hijo={hijo}
            materia={materia}
            onVerNotas={onVerNotas}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Placeholder si expandido y sin hijos */}
        {expandido && item.hijos.length === 0 && (
          <tr>
            <td colSpan={5}
              style={{
                paddingLeft: 48, fontSize: 13, color: "#9ca3af",
                fontStyle: "italic", borderLeft: "3px solid #e9d5ff",
              }}
            >
              Sin sub-parciales. Usa "+ Añadir parcial" para crear el primero.
            </td>
          </tr>
        )}
      </>
    );
  }

  // ── Fila parcial normal (no hijo, no grupal) ──────────────────────────────
  return (
    <tr key={item.id_parcial}>
      <td className="dd-td-name">{item.nombre_parcial ?? "—"}</td>
      <td>
        <span style={{
          fontSize: 11, color: "#4b5563", background: "#f3f4f6",
          border: "1px solid #e5e7eb", borderRadius: 4, padding: "2px 6px",
        }}>
          Normal
        </span>
      </td>
      <td>{fmtFecha(item.fecha)}</td>
      <td>
        {item.valoracion != null
          ? <span className="dd-val-badge">{item.valoracion} pts</span>
          : "—"}
      </td>
      <td>
        <div className="dd-row-actions">
          <button
            className="dd-btn-sm dd-btn-notas"
            onClick={() => onVerNotas({
              id_parcial:     item.id_parcial,
              id_materia:     materia.id_materia,
              nombre_parcial: item.nombre_parcial ?? "Parcial",
              sigla:          materia.sigla,
              fecha:          item.fecha,
              valoracion:     item.valoracion,
              parcial_grupal: item.parcial_grupal
            })}
          >
            📋 Notas
          </button>
          <button
            className="dd-btn-sm dd-btn-edit"
            disabled={bloqueado}
            title={bloqueado ? "Han pasado más de 10 días" : "Editar"}
            onClick={() => onEdit(item)}
          >
            ✏️ Editar
          </button>
          <button
            className="dd-btn-sm dd-btn-del"
            onClick={() => onDelete(item)}
          >
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Fila hijo (dentro de un grupal expandido) ─────────────────────────────────

function FilaHijo({
  hijo,
  materia,
  onVerNotas,
  onEdit,
  onDelete,
}: {
  hijo:       Parcial;
  materia:    Materia;
  onVerNotas: (datos: DatosNotas) => void;
  onEdit:     (p: Parcial) => void;
  onDelete:   (p: Parcial) => void;
}) {
  const bloqueado = esBloqueado(hijo.fecha);

  return (
    <tr style={{ background: "rgba(237,233,254,0.35)", borderLeft: "3px solid #e9d5ff" }}>
      {/* Nombre indentado */}
      <td className="dd-td-name" style={{ paddingLeft: 40 }}>
        <span style={{ color: "#9ca3af", marginRight: 6, fontSize: 12 }}>└</span>
        {hijo.nombre_parcial ?? "—"}
      </td>

      {/* Tipo */}
      <td>
        <span style={{
          fontSize: 11, color: "#7c3aed", background: "#f5f3ff",
          border: "1px solid #ddd6fe", borderRadius: 4, padding: "2px 6px",
        }}>
          Sub-parcial
        </span>
      </td>

      {/* Fecha */}
      <td style={{ color: "#6b7280" }}>{fmtFecha(hijo.fecha)}</td>

      {/* Valoración */}
      <td>
        {hijo.valoracion != null
          ? <span className="dd-val-badge">{hijo.valoracion} pts</span>
          : "—"}
      </td>

      {/* Acciones */}
      <td>
        <div className="dd-row-actions">
          <button
            className="dd-btn-sm dd-btn-notas"
            onClick={() => onVerNotas({
              id_parcial:     hijo.id_parcial,
              id_materia:     materia.id_materia,
              nombre_parcial: hijo.nombre_parcial ?? "Parcial",
              sigla:          materia.sigla,
              fecha:          hijo.fecha,
              valoracion:     hijo.valoracion,
              parcial_grupal: hijo.parcial_grupal,  // ← pasa el UUID del padre
            })}
          >
            📋 Notas
          </button>
          <button
            className="dd-btn-sm dd-btn-edit"
            disabled={bloqueado}
            title={bloqueado ? "Han pasado más de 10 días" : "Editar"}
            onClick={() => onEdit(hijo)}
          >
            ✏️ Editar
          </button>
          <button
            className="dd-btn-sm dd-btn-del"
            onClick={() => onDelete(hijo)}
          >
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Modal crear / editar parcial (normal o grupal padre) ──────────────────────

function ParcialModal({
  materia, parcial, onClose, onSaved,
}: {
  materia:  Materia;
  parcial?: Parcial;
  onClose:  () => void;
  onSaved:  () => void;
}) {
  const isEdit = !!parcial;

  const [form, setForm] = useState({
    nombre_parcial: parcial?.nombre_parcial ?? "",
    fecha:          parcial?.fecha          ?? "",
    valoracion:     parcial?.valoracion != null ? String(parcial.valoracion) : "",
    tipo:           (parcial?.tipo ?? "parcial") as "parcial" | "grupal",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function submit() {
    setError(""); setLoading(true);
    const body: Record<string, unknown> = { tipo: form.tipo };
    if (form.nombre_parcial) body.nombre_parcial = form.nombre_parcial;
    if (form.fecha)          body.fecha          = form.fecha;
    if (form.valoracion)     body.valoracion     = Number(form.valoracion);

    try {
      if (isEdit) {
        await apiFetch.put(`/parciales/${materia.id_materia}/${parcial!.id_parcial}`, body);
      } else {
        await apiFetch.post(`/parciales/${materia.id_materia}`, body);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dd-modal">
        <h2 className="dd-modal-title">
          {isEdit ? "Editar parcial" : "Nuevo parcial"}
          <span className="dd-modal-sigla">{materia.sigla}</span>
        </h2>

        {error && <div className="dd-error">{error}</div>}

        {/* Selector de tipo (solo al crear) */}
        {!isEdit && (
          <div className="dd-form-group">
            <label className="dd-form-label">Tipo</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["parcial", "grupal"] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: t }))}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: `2px solid ${form.tipo === t
                      ? t === "grupal" ? "#7c3aed" : "var(--clr-accent, #2563eb)"
                      : "var(--clr-border, #e5e7eb)"}`,
                    background: form.tipo === t
                      ? t === "grupal" ? "#f5f3ff" : "var(--clr-accent-bg, #eff6ff)"
                      : "#fff",
                    cursor: "pointer", textAlign: "left", transition: "all .15s",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                    {t === "parcial" ? "📋 Parcial normal" : "👥 Parcial grupal"}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>
                    {t === "parcial"
                      ? "Para todos los estudiantes inscritos"
                      : "Contenedor de sub-parciales por grupo"}
                  </div>
                </button>
              ))}
            </div>
            {form.tipo === "grupal" && (
              <p style={{
                marginTop: 8, fontSize: 12, color: "#7c3aed",
                background: "#f5f3ff", border: "1px solid #ddd6fe",
                borderRadius: 6, padding: "8px 12px",
              }}>
                💡 Se creará el contenedor grupal. Luego podrás añadir sub-parciales
                con los estudiantes que elijas.
              </p>
            )}
          </div>
        )}

        <div className="dd-form-group">
          <label className="dd-form-label">Nombre</label>
          <input
            className="dd-form-input"
            value={form.nombre_parcial}
            onChange={e => setForm(f => ({ ...f, nombre_parcial: e.target.value }))}
            placeholder={
              form.tipo === "grupal"
                ? "Ej: Evaluación grupal Tema 1-3"
                : "Ej: 1er parcial, temas 1 y 2"
            }
          />
        </div>

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
            <input
              className="dd-form-input"
              type="number"
              min={0}
              value={form.valoracion}
              placeholder="Ej: 20"
              onChange={e => setForm(f => ({ ...f, valoracion: e.target.value }))}
            />
          </div>
        </div>

        <div className="dd-modal-actions">
          <button className="dd-cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="dd-submit-btn" onClick={submit} disabled={loading}>
            {loading
              ? "Guardando…"
              : isEdit
              ? "Guardar cambios"
              : form.tipo === "grupal"
              ? "Crear grupo"
              : "Crear parcial"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear hijo (sub-parcial dentro de un grupal) ────────────────────────

function ParcialHijoModal({
  materia, padre, onClose, onSaved,
}: {
  materia: Materia;
  padre:   ParcialGrupal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nombre_parcial: "",
    fecha:          "",
    valoracion:     "",
  });
  const [estudiantes,  setEstudiantes]  = useState<Estudiante[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [loadingE,  setLoadingE]  = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  // Cargar inscritos al abrir el modal
  useEffect(() => {
    apiFetch.get(`/parciales/${materia.id_materia}/estudiantes`)
      .then((data: Estudiante[]) => setEstudiantes(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingE(false));
  }, [materia.id_materia]);

  function toggleEstudiante(id: string) {
    setSeleccionados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (seleccionados.size === estudiantes.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(estudiantes.map(e => e.id_estudiante)));
    }
  }

  async function submit() {
    if (seleccionados.size === 0) {
      setError("Selecciona al menos un estudiante.");
      return;
    }
    setError(""); setLoading(true);

    const body: Record<string, unknown> = {
      grupo_estudiantes: Array.from(seleccionados),
    };
    if (form.nombre_parcial) body.nombre_parcial = form.nombre_parcial;
    if (form.fecha)          body.fecha          = form.fecha;
    if (form.valoracion)     body.valoracion     = Number(form.valoracion);

    try {
      await apiFetch.post(
        `/parciales/${materia.id_materia}/grupal/${padre.id_parcial}`,
        body,
      );
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear el sub-parcial");
    } finally {
      setLoading(false);
    }
  }

  const todosSeleccionados =
    estudiantes.length > 0 && seleccionados.size === estudiantes.length;

  return (
    <div className="dd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dd-modal" style={{ maxWidth: 560 }}>
        <h2 className="dd-modal-title">
          Añadir sub-parcial
          <span className="dd-modal-sigla" style={{ color: "#7c3aed", background: "#ede9fe" }}>
            {padre.nombre_parcial ?? "Grupo"}
          </span>
        </h2>

        {error && <div className="dd-error">{error}</div>}

        {/* Datos del sub-parcial */}
        <div className="dd-form-group">
          <label className="dd-form-label">Nombre</label>
          <input
            className="dd-form-input"
            value={form.nombre_parcial}
            onChange={e => setForm(f => ({ ...f, nombre_parcial: e.target.value }))}
            placeholder="Ej: Sub-parcial grupo A"
          />
        </div>

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
            <input
              className="dd-form-input"
              type="number"
              min={0}
              value={form.valoracion}
              placeholder="Ej: 20"
              onChange={e => setForm(f => ({ ...f, valoracion: e.target.value }))}
            />
          </div>
        </div>

        {/* Selector de estudiantes */}
        <div className="dd-form-group">
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
              onClick={toggleTodos}
              style={{
                fontSize: 11, color: "#6b7280", background: "none",
                border: "1px solid #e5e7eb", borderRadius: 5,
                padding: "3px 8px", cursor: "pointer",
              }}
            >
              {todosSeleccionados ? "Quitar todos" : "Seleccionar todos"}
            </button>
          </div>

          {loadingE ? (
            <div className="dd-loading" style={{ padding: "12px 0" }}>
              Cargando estudiantes…
            </div>
          ) : estudiantes.length === 0 ? (
            <p className="dd-empty-text">No hay estudiantes inscritos.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              padding: "4px 2px",
            }}>
              {estudiantes.map(e => {
                const activo = seleccionados.has(e.id_estudiante);
                return (
                  <button
                    key={e.id_estudiante}
                    type="button"
                    onClick={() => toggleEstudiante(e.id_estudiante)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${activo ? "#7c3aed" : "#e5e7eb"}`,
                      background: activo ? "#f5f3ff" : "#fafafa",
                      textAlign: "left", transition: "all .12s",
                    }}
                  >
                    {/* Checkbox visual */}
                    <span style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${activo ? "#7c3aed" : "#d1d5db"}`,
                      background: activo ? "#7c3aed" : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {activo && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: activo ? "#6d28d9" : "#111827", lineHeight: 1.2 }}>
                        {e.nombre} {e.apellido}
                      </div>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>
                        CI {e.ci_estudiante}
                      </div>
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
          >
            {loading
              ? "Creando…"
              : `Crear sub-parcial${seleccionados.size > 0 ? ` (${seleccionados.size} est.)` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal eliminar ────────────────────────────────────────────────────────────

function DeleteModal({
  materia, parcial, esGrupalPadre, onClose, onDeleted,
}: {
  materia:        Materia;
  parcial:        Parcial;
  esGrupalPadre?: boolean;
  onClose:        () => void;
  onDeleted:      () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function eliminar() {
    setLoading(true);
    try {
      await apiFetch.delete(`/parciales/${materia.id_materia}/${parcial.id_parcial}`);
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
      setLoading(false);
    }
  }

  return (
    <div className="dd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dd-modal">
        <h2 className="dd-modal-title">Eliminar parcial</h2>
        <p className="dd-delete-msg">
          ¿Eliminar <strong>{parcial.nombre_parcial ?? "este parcial"}</strong> de{" "}
          <strong>{materia.sigla}</strong>?{" "}
          {esGrupalPadre
            ? "Se eliminarán todos sus sub-parciales y las notas asociadas."
            : "Se borrarán todas las notas asociadas."}
        </p>
        {error && <div className="dd-error" style={{ marginTop: 12 }}>{error}</div>}
        <div className="dd-modal-actions">
          <button className="dd-cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="dd-submit-btn danger" onClick={eliminar} disabled={loading}>
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}