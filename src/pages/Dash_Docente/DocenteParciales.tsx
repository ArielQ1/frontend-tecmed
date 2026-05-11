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

interface Parcial {
  id_parcial:     string;
  nombre_parcial: string | null;
  fecha:          string | null;
  valoracion:     number | null;
  id_materia:     string;
}

type ModalState =
  | { type: "none" }
  | { type: "create"; materia: Materia }
  | { type: "edit";   materia: Materia; parcial: Parcial }
  | { type: "delete"; materia: Materia; parcial: Parcial };

interface Props {
  onVerNotas: (datos: DatosNotas) => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

function esBloqueado(fecha: string | null): boolean {
  if (!fecha) return false;
  return (Date.now() - new Date(fecha).getTime()) / 86400000 > 10;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocenteParciales({ onVerNotas }: Props) {
  const [materias,  setMaterias]  = useState<Materia[]>([]);
  const [materia,   setMateria]   = useState<Materia | null>(null);
  const [parciales, setParciales] = useState<Parcial[]>([]);
  const [loadingM,  setLoadingM]  = useState(false);
  const [loadingP,  setLoadingP]  = useState(false);
  const [error,     setError]     = useState("");
  const [modal,     setModal]     = useState<ModalState>({ type: "none" });

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
          {materias.length === 0 && <p className="dd-empty-text">No tienes materias asignadas.</p>}
        </div>
      )}

      {/* Tabla de parciales */}
      {materia && (
        <div className="dd-card" style={{ marginTop: 24 }}>
          <div className="dd-card-header">
            <span className="dd-sigla-badge">{materia.sigla}</span>
            <span className="dd-card-label">
              {parciales.length} parcial{parciales.length !== 1 ? "es" : ""}
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
                  <th>Fecha</th>
                  <th>Valoración</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {parciales.map(p => {
                  const bloqueado = esBloqueado(p.fecha);
                  return (
                    <tr key={p.id_parcial}>
                      <td className="dd-td-name">{p.nombre_parcial ?? "—"}</td>
                      <td>
                        {p.fecha
                          ? new Date(p.fecha).toLocaleDateString("es-BO", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        {p.valoracion != null
                          ? <span className="dd-val-badge">{p.valoracion} pts</span>
                          : "—"}
                      </td>
                      <td>
                        <div className="dd-row-actions">
                          <button
                            className="dd-btn-sm dd-btn-notas"
                            onClick={() => onVerNotas({
                              id_parcial:     p.id_parcial,
                              id_materia:     materia.id_materia,
                              nombre_parcial: p.nombre_parcial ?? "Parcial",
                              sigla:          materia.sigla,
                              fecha:          p.fecha,
                              valoracion:     p.valoracion,
                            })}
                          >
                            📋 Notas
                          </button>
                          <button
                            className="dd-btn-sm dd-btn-edit"
                            disabled={bloqueado}
                            title={bloqueado ? "Han pasado más de 10 días" : "Editar"}
                            onClick={() => setModal({ type: "edit", materia, parcial: p })}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="dd-btn-sm dd-btn-del"
                            onClick={() => setModal({ type: "delete", materia, parcial: p })}
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal.type === "create" && (
        <ParcialModal materia={modal.materia} onClose={() => setModal({ type: "none" })} onSaved={onSaved} />
      )}
      {modal.type === "edit" && (
        <ParcialModal materia={modal.materia} parcial={modal.parcial} onClose={() => setModal({ type: "none" })} onSaved={onSaved} />
      )}
      {modal.type === "delete" && (
        <DeleteModal materia={modal.materia} parcial={modal.parcial} onClose={() => setModal({ type: "none" })} onDeleted={onSaved} />
      )}
    </div>
  );
}

// ── Modal crear/editar ────────────────────────────────────────────────────────

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
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function submit() {
    setError(""); setLoading(true);
    const body: Record<string, unknown> = {};
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
        <div className="dd-form-group">
          <label className="dd-form-label">Nombre</label>
          <input className="dd-form-input" value={form.nombre_parcial}
            onChange={e => setForm(f => ({ ...f, nombre_parcial: e.target.value }))}
            placeholder="Ej: 1er parcial, temas 1 y 2" />
        </div>
        <div className="dd-form-row">
          <div className="dd-form-group">
            <label className="dd-form-label">Fecha</label>
            <input className="dd-form-input" type="date" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
          <div className="dd-form-group">
            <label className="dd-form-label">Valoración (pts)</label>
            <input className="dd-form-input" type="number" min={0} value={form.valoracion}
              placeholder="Ej: 20"
              onChange={e => setForm(f => ({ ...f, valoracion: e.target.value }))} />
          </div>
        </div>
        <div className="dd-modal-actions">
          <button className="dd-cancel-btn" onClick={onClose}>Cancelar</button>
          <button className="dd-submit-btn" onClick={submit} disabled={loading}>
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear parcial"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal eliminar ────────────────────────────────────────────────────────────

function DeleteModal({
  materia, parcial, onClose, onDeleted,
}: {
  materia:   Materia;
  parcial:   Parcial;
  onClose:   () => void;
  onDeleted: () => void;
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
          <strong>{materia.sigla}</strong>? Se borrarán todas las notas asociadas.
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