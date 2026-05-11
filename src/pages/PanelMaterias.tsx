import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia: string;
  nombre_materia: string;
  sigla: string;
  horario: string | null;
  anio: number | null;
  docente: { id_usuario: string; nombre: string; apellido: string ; titulo: string} | null;
  auxiliar: { id_usuario: string; nombre: string } | null;
  id_gestion: string;
}

type ModalState =
  | { type: "none" }
  | { type: "crear" }
  | { type: "editar"; materia: Materia }
  | { type: "eliminar"; materia: Materia };

export function MateriasPanel() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const fetchMaterias = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch.get("/admin/materias/");
      setMaterias(data);
    } catch (e) {
      setError("Error al cargar las materias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterias();
  }, [fetchMaterias]);

  return (
    <div className="dp-wrap">
      {/* Breadcrumb (opcional, consistente con PanelDocente) */}
      <div className="dp-bc">
        <button className="dp-bc-btn" onClick={() => window.history.back()}>
          Panel Admin
        </button>
        <span className="dp-bc-sep">/</span>
        <span className="dp-bc-cur">Materias</span>
      </div>

      {/* Toolbar */}
      <div className="dp-toolbar">
        <div className="dp-count">{materias.length} materias</div>
        <button className="btn-primary" onClick={() => setModal({ type: "crear" })}>
          + Nueva Materia
        </button>
      </div>

      {error && <div className="dp-error">{error}</div>}

      {loading ? (
        <div className="dp-loading">Cargando...</div>
      ) : (
        <div className="dp-grid">
          {materias.map((m) => (
            <div className="dp-card" key={m.id_materia}>
              <div className="dp-card-top">
                <div className="dp-avatar">
                  📘
                </div>
                <div className="dp-info">
                  <div className="dp-name">{m.nombre_materia}</div>
                  <div className="dp-meta">
                    <span className="dp-titulo-badge">{m.sigla}</span>
                    <span>{m.horario || "Sin horario"}</span>
                    <span>Año {m.anio}</span>
                  </div>
                  <div className="dp-meta" style={{ marginTop: "6px" }}>
                    <span>👩‍🏫 Docente: {m.docente ? `${m.docente.titulo} ${m.docente.nombre} ${m.docente.apellido}` : "Sin asignar"}</span>
                  </div>
                </div>
              </div>
              <div className="dp-card-actions">
                <button
                  className="btn-sm btn-edit"
                  onClick={() => setModal({ type: "editar", materia: m })}
                >
                  ✏️ Editar
                </button>
                <button
                  className="btn-sm btn-delete"
                  onClick={() => setModal({ type: "eliminar", materia: m })}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      {(modal.type === "crear" || modal.type === "editar") && (
        <MateriaFormModal
          materia={modal.type === "editar" ? modal.materia : undefined}
          onClose={() => setModal({ type: "none" })}
          onSaved={() => {
            setModal({ type: "none" });
            fetchMaterias();
          }}
        />
      )}

      {modal.type === "eliminar" && (
        <ConfirmEliminarModal
          materia={modal.materia}
          onClose={() => setModal({ type: "none" })}
          onDone={() => {
            setModal({ type: "none" });
            fetchMaterias();
          }}
        />
      )}
    </div>
  );
}

// ── Formulario Modal (con estilos unificados) ─────────────────────────────────

function MateriaFormModal({
  materia,
  onClose,
  onSaved,
}: {
  materia?: Materia;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!materia;
  const [loading, setLoading] = useState(false);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [auxiliares, setAuxiliares] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nombre_materia: materia?.nombre_materia || "",
    sigla: materia?.sigla || "",
    horario: materia?.horario || "",
    anio: materia?.anio || new Date().getFullYear(),
    id_docente: materia?.docente?.id_usuario || "",
    id_auxiliar: materia?.auxiliar?.id_usuario || "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch.get("/admin/docentes/"),
      apiFetch.get("/admin/auxiliares/"),
    ]).then(([docs, auxs]) => {
      setDocentes(docs);
      setAuxiliares(auxs);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await apiFetch.patch(`/admin/materias/${materia.id_materia}`, formData);
      } else {
        await apiFetch.post("/admin/materias/", formData);
      }
      onSaved();
    } catch (err) {
      alert("Error al guardar la materia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">
        <h2 className="dp-modal-title">{isEdit ? "Editar Materia" : "Nueva Materia"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="dp-form-group">
            <label className="dp-form-label">Nombre de la materia</label>
            <input
              className="dp-form-input"
              value={formData.nombre_materia}
              onChange={(e) => setFormData({ ...formData, nombre_materia: e.target.value })}
              required
              placeholder="Ej: Programación I"
            />
          </div>

          <div className="dp-form-row">
            <div className="dp-form-group">
              <label className="dp-form-label">Sigla</label>
              <input
                className="dp-form-input"
                value={formData.sigla}
                onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                required
              />
            </div>
            <div className="dp-form-group">
              <label className="dp-form-label">Año</label>
              <input
                type="number"
                className="dp-form-input"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || 2024 })}
              />
            </div>
          </div>

          <div className="dp-form-group">
            <label className="dp-form-label">Horario</label>
            <input
              className="dp-form-input"
              value={formData.horario}
              onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              placeholder="Ej: Lun/Miér 14:00-16:00"
            />
          </div>

          <div className="dp-form-group">
            <label className="dp-form-label">Docente</label>
            <select
              className="dp-form-select"
              value={formData.id_docente}
              onChange={(e) => setFormData({ ...formData, id_docente: e.target.value })}
            >
              <option value="">Seleccionar docente...</option>
              {docentes.map((d) => (
                <option key={d.id_usuario} value={d.id_usuario}>
                  {d.nombre} {d.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="dp-form-group">
            <label className="dp-form-label">Auxiliar (opcional)</label>
            <select
              className="dp-form-select"
              value={formData.id_auxiliar}
              onChange={(e) => setFormData({ ...formData, id_auxiliar: e.target.value })}
            >
              <option value="">Seleccionar auxiliar...</option>
              {auxiliares.map((a) => (
                <option key={a.id_usuario} value={a.id_usuario}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="dp-modal-actions">
            <button type="button" className="dp-cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dp-submit-btn" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de confirmación de eliminación ─────────────────────────────────────

function ConfirmEliminarModal({
  materia,
  onClose,
  onDone,
}: {
  materia: Materia;
  onClose: () => void;
  onDone: () => void;
}) {
  async function handleConfirm() {
    try {
      await apiFetch.delete(`/admin/materias/${materia.id_materia}`);
      onDone();
    } catch (err) {
      alert("No se pudo eliminar la materia");
    }
  }

  return (
    <div className="dp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">
        <h2 className="dp-modal-title">Eliminar Materia</h2>
        <p className="dp-delete-msg">
          ¿Estás seguro de eliminar <span className="dp-delete-name">{materia.nombre_materia}</span>?
          <br />
          Esta acción no se puede deshacer.
        </p>
        <div className="dp-modal-actions">
          <button className="dp-cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="dp-submit-btn danger" onClick={handleConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}