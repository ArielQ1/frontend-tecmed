import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "../api/client";
import { InscritosMateria } from "./InscritosMateria";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia: string;
  nombre_materia: string;
  sigla: string;
  horario: string | null;
  anio: number | null;
  mencion: string | null;
  docente: { id_usuario: string; nombre: string; apellido: string; titulo: string } | null;
  auxiliar: { id_usuario: string; nombre: string } | null;
  id_gestion: string;
}

type ModalState =
  | { type: "none" }
  | { type: "crear" }
  | { type: "editar"; materia: Materia }
  | { type: "eliminar"; materia: Materia };

// Badge de color por mención
const MENCION_COLORS: Record<string, string> = {
  fisioterapia:          "#3b82f6",
  bioimagenologia:       "#8b5cf6",
  "laboratorio clinico": "#10b981",
  laboratorio:           "#10b981",
};

function MencionBadge({ mencion }: { mencion: string | null }) {
  if (!mencion) return <span className="dp-mencion-badge dp-mencion-none">Sin mención</span>;
  const color = MENCION_COLORS[mencion.toLowerCase()] ?? "#6b7280";
  return (
    <span
      className="dp-mencion-badge"
      style={{ background: color + "1a", color, border: `1px solid ${color}44` }}
    >
      {mencion}
    </span>
  );
}

export function MateriasPanel() {
  const [materias, setMaterias]                 = useState<Materia[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [modal, setModal]                       = useState<ModalState>({ type: "none" });
  const [materiaInscritos, setMateriaInscritos] = useState<Materia | null>(null);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda]           = useState("");
  const [filtroMencion, setFiltroMencion] = useState("");

  const fetchMaterias = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch.get("/admin/materias/");
      setMaterias(data);
    } catch {
      setError("Error al cargar las materias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaterias(); }, [fetchMaterias]);

  // Menciones únicas para el <select> de filtro
  const menciones = useMemo(() => {
    const set = new Set<string>();
    materias.forEach(m => { if (m.mencion) set.add(m.mencion); });
    return Array.from(set).sort();
  }, [materias]);

  // Materias filtradas (búsqueda + mención)
  const materiasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return materias.filter(m => {
      const coincideBusqueda =
        !q ||
        m.nombre_materia.toLowerCase().includes(q) ||
        m.sigla.toLowerCase().includes(q) ||
        (m.docente &&
          `${m.docente.nombre} ${m.docente.apellido}`.toLowerCase().includes(q));
      let coincideMencion = true;
      if (filtroMencion === "__sin__") {
        coincideMencion = !m.mencion;
      } else if (filtroMencion) {
        coincideMencion = (m.mencion ?? "").toLowerCase() === filtroMencion.toLowerCase();
      }
      return coincideBusqueda && coincideMencion;
    });
  }, [materias, busqueda, filtroMencion]);

  // Sub-vista: inscritos
  if (materiaInscritos) {
    return (
      <InscritosMateria
        materia={materiaInscritos}
        onVolver={() => setMateriaInscritos(null)}
      />
    );
  }

  return (
    <div className="dp-wrap">
      {/* Breadcrumb */}
      <div className="dp-bc">
        <button className="dp-bc-btn" onClick={() => window.history.back()}>
          Panel Admin
        </button>
        <span className="dp-bc-sep">/</span>
        <span className="dp-bc-cur">Materias</span>
      </div>

      {/* Toolbar */}
      <div className="dp-toolbar">
        <div className="dp-count">
          {materiasFiltradas.length}
          {materiasFiltradas.length !== materias.length && ` / ${materias.length}`} materias
        </div>
        <button className="btn-primary" onClick={() => setModal({ type: "crear" })}>
          + Nueva Materia
        </button>
      </div>

      {/* Filtros */}
      <div className="dp-filters">
        <input
          className="dp-search"
          placeholder="🔍 Buscar por nombre, sigla o docente…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <select
          className="dp-filter-select"
          value={filtroMencion}
          onChange={e => setFiltroMencion(e.target.value)}
        >
          <option value="">Todas las menciones</option>
          {menciones.map(mn => (
            <option key={mn} value={mn}>{mn}</option>
          ))}
          <option value="__sin__">Sin mención</option>
        </select>
      </div>

      {error && <div className="dp-error">{error}</div>}

      {loading ? (
        <div className="dp-loading">Cargando...</div>
      ) : materiasFiltradas.length === 0 ? (
        <div className="dp-empty">No se encontraron materias con los filtros actuales.</div>
      ) : (
        <div className="dp-grid">
          {materiasFiltradas.map((m) => (
            <div className="dp-card" key={m.id_materia}>
              <div className="dp-card-top">
                <div className="dp-avatar">📘</div>
                <div className="dp-info">
                  <div className="dp-name">{m.nombre_materia}</div>
                  <div className="dp-meta">
                    <span className="dp-titulo-badge">{m.sigla}</span>
                    <span>{m.horario || "Sin horario"}</span>
                    <span>Año {m.anio}</span>
                  </div>
                  {/* Mención */}
                  <div className="dp-meta" style={{ marginTop: "4px" }}>
                    <MencionBadge mencion={m.mencion} />
                  </div>
                  <div className="dp-meta" style={{ marginTop: "4px" }}>
                    <span>
                      👩‍🏫{" "}
                      {m.docente
                        ? `${m.docente.titulo} ${m.docente.nombre} ${m.docente.apellido}`
                        : "Sin docente"}
                    </span>
                  </div>
                  {m.auxiliar && (
                    <div className="dp-meta">
                      <span>🧑‍🔬 {m.auxiliar.nombre}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="dp-card-actions">
                <button
                  className="btn-sm btn-inscritos"
                  onClick={() => setMateriaInscritos(m)}
                >
                  👥 Inscritos
                </button>
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

      {(modal.type === "crear" || modal.type === "editar") && (
        <MateriaFormModal
          materia={modal.type === "editar" ? modal.materia : undefined}
          onClose={() => setModal({ type: "none" })}
          onSaved={() => { setModal({ type: "none" }); fetchMaterias(); }}
        />
      )}

      {modal.type === "eliminar" && (
        <ConfirmEliminarModal
          materia={modal.materia}
          onClose={() => setModal({ type: "none" })}
          onDone={() => { setModal({ type: "none" }); fetchMaterias(); }}
        />
      )}
    </div>
  );
}

// ── Formulario Modal ──────────────────────────────────────────────────────────

const MENCIONES_SISTEMA = ["fisioterapia", "bioimagenologia", "laboratorio clinico"];

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
  const [loading, setLoading]       = useState(false);
  const [docentes, setDocentes]     = useState<any[]>([]);
  const [auxiliares, setAuxiliares] = useState<any[]>([]);
  const [saveError, setSaveError]   = useState("");

  const [formData, setFormData] = useState({
    nombre_materia: materia?.nombre_materia        ?? "",
    sigla:          materia?.sigla                 ?? "",
    horario:        materia?.horario               ?? "",
    anio:           materia?.anio                  ?? new Date().getFullYear(),
    mencion:        materia?.mencion               ?? "",
    id_docente:     materia?.docente?.id_usuario   ?? "",
    id_auxiliar:    materia?.auxiliar?.id_usuario  ?? "",
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
    setSaveError("");
    setLoading(true);
    try {
      // Strings vacíos → null para todos los campos opcionales
      const payload = {
        ...formData,
        horario:     formData.horario     || null,
        mencion:     formData.mencion     || null,
        id_docente:  formData.id_docente  || null,
        id_auxiliar: formData.id_auxiliar || null,
      };
      if (isEdit) {
        await apiFetch.patch(`/admin/materias/${materia!.id_materia}`, payload);
      } else {
        await apiFetch.post("/admin/materias/", payload);
      }
      onSaved();
    } catch (err: any) {
      setSaveError(err?.message ?? "Error al guardar la materia");
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
              placeholder="Ej: Introducción a Laboratorio"
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
                placeholder="Ej: LAB-101"
              />
            </div>
            <div className="dp-form-group">
              <label className="dp-form-label">Año</label>
              <input
                type="number"
                className="dp-form-input"
                value={formData.anio}
                onChange={(e) =>
                  setFormData({ ...formData, anio: parseInt(e.target.value) || new Date().getFullYear() })
                }
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

          {/* ── Mención ── */}
          <div className="dp-form-group">
            <label className="dp-form-label">
              Mención <span className="dp-optional">(opcional)</span>
            </label>
            <select
              className="dp-form-select"
              value={formData.mencion}
              onChange={(e) => setFormData({ ...formData, mencion: e.target.value })}
            >
              <option value="">Sin mención</option>
              {MENCIONES_SISTEMA.map(mn => (
                <option key={mn} value={mn}>{mn}</option>
              ))}
            </select>
          </div>

          <div className="dp-form-group">
            <label className="dp-form-label">
              Docente <span className="dp-optional">(opcional)</span>
            </label>
            <select
              className="dp-form-select"
              value={formData.id_docente}
              onChange={(e) => setFormData({ ...formData, id_docente: e.target.value })}
            >
              <option value="">Sin docente asignado</option>
              {docentes.map((d) => (
                <option key={d.id_usuario} value={d.id_usuario}>
                  {d.titulo ? `${d.titulo} ` : ""}{d.nombre} {d.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="dp-form-group">
            <label className="dp-form-label">
              Auxiliar <span className="dp-optional">(opcional)</span>
            </label>
            <select
              className="dp-form-select"
              value={formData.id_auxiliar}
              onChange={(e) => setFormData({ ...formData, id_auxiliar: e.target.value })}
            >
              <option value="">Sin auxiliar asignado</option>
              {auxiliares.map((a) => (
                <option key={a.id_usuario} value={a.id_usuario}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {saveError && <div className="dp-form-error">{saveError}</div>}

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

// ── Modal de confirmación de eliminación ──────────────────────────────────────

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
    } catch {
      alert("No se pudo eliminar la materia");
    }
  }

  return (
    <div className="dp-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dp-modal">
        <h2 className="dp-modal-title">Eliminar Materia</h2>
        <p className="dp-delete-msg">
          ¿Estás seguro de eliminar{" "}
          <span className="dp-delete-name">{materia.nombre_materia}</span>?
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