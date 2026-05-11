import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";
import "./style/estilos.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Parcial {
  id_parcial:     string;
  nombre_parcial: string;
  tipo:           string;
  fecha:          string | null;
  valoracion:     number;
  nota:           number | null;
  observacion:    string | null;
}

interface Materia {
  id_materia:     string;
  sigla:          string;
  nombre_materia: string;
  horario:        string;
  anio:           number;
  mencion:        string | null;
  parciales:      Parcial[];
}

interface Estudiante {
  id_estudiante: string;
  ci_estudiante: number;
  matricula:     number;
  nombre:        string;
  apellido:      string;
  anio:          number | null;
  mencion:       string | null;   // ahora es string directo, no UUID
  materias:      Materia[];
}

interface MateriaDisponible {
  id_materia:     string;
  sigla:          string;
  nombre_materia: string;
  horario:        string;
  mencion:        string | null;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = {
  Search: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
    </svg>
  ),
  BookOpen: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  UserMinus: () => (
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M16 11h6M1 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
    </svg>
  ),
};

// ─── Badge mención ────────────────────────────────────────────────────────────

const MencionBadge = ({ mencion }: { mencion: string | null }) => {
  const map: Record<string, string> = {
    fisioterapia:          "pe-badge-fis",
    bioimagenologia:       "pe-badge-bio",
    laboratorio:           "pe-badge-lab",
    "laboratorio clinico": "pe-badge-lab",
  };
  const cls = map[mencion?.toLowerCase() ?? ""] ?? "pe-badge-default";
  return <span className={`pe-badge ${cls}`}>{mencion ?? "—"}</span>;
};

// ─── Modal wrapper ────────────────────────────────────────────────────────────

const Modal = ({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="dp-overlay" onClick={onClose}>
    <div className="dp-modal" onClick={e => e.stopPropagation()}>
      <div className="pe-modal-header">
        <h2 className="dp-modal-title" style={{ marginBottom: 0 }}>{title}</h2>
        <button className="pe-btn-icon" onClick={onClose}><Icon.X /></button>
      </div>
      <div style={{ marginTop: 20 }}>{children}</div>
    </div>
  </div>
);

// ─── Formulario estudiante ────────────────────────────────────────────────────

interface EstudianteFormProps {
  initial?: Partial<Estudiante>;
  onSave:  (data: Omit<Estudiante, "id_estudiante" | "materias">) => Promise<void>;
  onClose: () => void;
}

const EstudianteForm = ({ initial, onSave, onClose }: EstudianteFormProps) => {
  const [form, setForm] = useState({
    ci_estudiante: initial?.ci_estudiante ?? "",
    matricula:     initial?.matricula     ?? "",
    nombre:        initial?.nombre        ?? "",
    apellido:      initial?.apellido      ?? "",
    anio:          initial?.anio          ?? "",
    mencion:       initial?.mencion       ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handle = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.nombre || !form.apellido || !form.ci_estudiante || !form.matricula) {
      setError("Nombre, apellido, CI y matrícula son requeridos."); return;
    }
    setLoading(true); setError("");
    try {
      await onSave({
        ci_estudiante: Number(form.ci_estudiante),
        matricula:     Number(form.matricula),
        nombre:        form.nombre,
        apellido:      form.apellido,
        anio:          form.anio ? Number(form.anio) : null,
        mencion:       (form.mencion as string) || null,
      } as any);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pe-form-grid">
      <div className="dp-form-row">
        <div className="dp-form-group">
          <label className="dp-form-label">Nombre</label>
          <input className="dp-form-input" value={form.nombre} onChange={handle("nombre")} placeholder="Ej. Melissa" />
        </div>
        <div className="dp-form-group">
          <label className="dp-form-label">Apellido</label>
          <input className="dp-form-input" value={form.apellido} onChange={handle("apellido")} placeholder="Ej. Rocabado" />
        </div>
      </div>
      <div className="dp-form-row">
        <div className="dp-form-group">
          <label className="dp-form-label">CI</label>
          <input className="dp-form-input" type="number" value={form.ci_estudiante} onChange={handle("ci_estudiante")} placeholder="44400001" />
        </div>
        <div className="dp-form-group">
          <label className="dp-form-label">Matrícula</label>
          <input className="dp-form-input" type="number" value={form.matricula} onChange={handle("matricula")} placeholder="1800001" />
        </div>
      </div>
      <div className="dp-form-row">
        <div className="dp-form-group">
          <label className="dp-form-label">Año</label>
          <input className="dp-form-input" type="number" value={form.anio} onChange={handle("anio")} placeholder="1" min={1} max={6} />
        </div>
        <div className="dp-form-group">
          <label className="dp-form-label">Mención</label>
          <select className="dp-form-select" value={form.mencion as string} onChange={handle("mencion")}>
            <option value="">Sin mención</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="bioimagenologia">Bioimagenología</option>
            <option value="laboratorio clinico">Laboratorio Clínico</option>
          </select>
        </div>
      </div>
      {error && <p className="dp-error" style={{ margin: 0 }}>{error}</p>}
      <div className="dp-modal-actions">
        <button className="dp-cancel-btn" onClick={onClose}>Cancelar</button>
        <button className="dp-submit-btn" onClick={submit} disabled={loading}>
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
};

// ─── Modal inscripciones ──────────────────────────────────────────────────────

const InscripcionModal = ({
  estudiante, onClose, onRefresh,
}: { estudiante: Estudiante; onClose: () => void; onRefresh: () => void }) => {
  const [materias, setMaterias] = useState<MateriaDisponible[]>([]);
  const [selected, setSelected] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  useEffect(() => {
    api.get("/admin/materias/").then(r => setMaterias(r.data)).catch(() => setMaterias([]));
  }, []);

  const inscritasIds = new Set(estudiante.materias.map(m => m.id_materia));

  const inscribir = async () => {
    if (!selected) { setError("Selecciona una materia."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post(`/admin/estudiantes/inscripciones/?id_estudiante=${estudiante.id_estudiante}&id_materia=${selected}`);
      setSuccess("Inscripción realizada correctamente.");
      setSelected("");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  const desinscribir = async (id_materia: string) => {
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.delete(`/admin/estudiantes/${estudiante.id_estudiante}/materias/${id_materia}`);
      setSuccess("Desinscripción realizada.");
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  };

  const disponibles = materias.filter(m => !inscritasIds.has(m.id_materia));

  return (
    <div className="pe-insc-body">
      <p className="pe-insc-subtitle">
        Materias de <strong>{estudiante.nombre} {estudiante.apellido}</strong>
      </p>
      <div className="pe-insc-list">
        {estudiante.materias.length === 0 && (
          <p className="pe-insc-empty">Sin materias inscritas.</p>
        )}
        {estudiante.materias.map(m => (
          <div key={m.id_materia} className="pe-insc-item">
            <span className="sigla-badge">{m.sigla}</span>
            <span className="pe-insc-nombre">{m.nombre_materia}</span>
            {m.mencion && <span className="pe-badge pe-badge-default" style={{ fontSize: 10 }}>{m.mencion}</span>}
            <button
              className="pe-btn-icon pe-btn-danger"
              title="Quitar materia"
              onClick={() => desinscribir(m.id_materia)}
              disabled={loading}
            >
              <Icon.UserMinus />
            </button>
          </div>
        ))}
      </div>
      <div className="pe-insc-add">
        <p className="pe-insc-add-title">Inscribir en materia</p>
        <div className="pe-insc-add-row">
          <select className="dp-form-select" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— Seleccionar materia —</option>
            {disponibles.map(m => (
              <option key={m.id_materia} value={m.id_materia}>
                {m.sigla} — {m.nombre_materia}{m.mencion ? ` (${m.mencion})` : ""}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={inscribir} disabled={loading || !selected}>
            {loading ? "…" : "Inscribir"}
          </button>
        </div>
      </div>
      {error   && <p className="dp-error"   style={{ margin: 0 }}>{error}</p>}
      {success && <p className="pe-success" style={{ margin: 0 }}>{success}</p>}
    </div>
  );
};

// ─── Fila expandible ──────────────────────────────────────────────────────────

const EstudianteRow = ({
  est, onEdit, onDelete, onInscripcion,
}: {
  est:           Estudiante;
  onEdit:        () => void;
  onDelete:      () => void;
  onInscripcion: () => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className={`pe-table-row ${open ? "pe-row-open" : ""}`}>
        <td className="dp-table td">{est.nombre} <strong>{est.apellido}</strong></td>
        <td className="dp-table td">{est.matricula}</td>
        <td className="dp-table td">{est.ci_estudiante}</td>
        <td className="dp-table td">{est.anio ?? "—"}</td>
        <td className="dp-table td"><MencionBadge mencion={est.mencion} /></td>
        <td className="dp-table td">
          <span className="pe-mats-count">
            {est.materias.length} materia{est.materias.length !== 1 ? "s" : ""}
          </span>
        </td>
        <td className="dp-table td" style={{ textAlign: "right" }}>
          <div className="dp-table-actions" style={{ justifyContent: "flex-end" }}>
            <button className="pe-btn-icon pe-btn-info"   title="Inscripciones" onClick={onInscripcion}><Icon.BookOpen /></button>
            <button className="pe-btn-icon pe-btn-edit"   title="Editar"        onClick={onEdit}><Icon.Edit /></button>
            <button className="pe-btn-icon pe-btn-danger" title="Eliminar"      onClick={onDelete}><Icon.Trash /></button>
            <button
              className={`pe-btn-icon pe-btn-chevron ${open ? "pe-chevron-up" : ""}`}
              onClick={() => setOpen(o => !o)}
            >
              <Icon.ChevronDown />
            </button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="pe-row-detail">
          <td colSpan={7}>
            <div className="pe-detail-panel">
              {est.materias.length === 0 && (
                <p style={{ color: "#aaa", fontSize: 13 }}>Sin materias inscritas.</p>
              )}
              {est.materias.map(m => (
                <div key={m.id_materia} className="pe-detail-materia">
                  <div className="pe-detail-header">
                    <span className="sigla-badge">{m.sigla}</span>
                    <span className="pe-detail-nombre">{m.nombre_materia}</span>
                    {m.mencion && <MencionBadge mencion={m.mencion} />}
                    <span className="pe-detail-horario">{m.horario}</span>
                  </div>
                  {m.parciales.length > 0 && (
                    <table className="dp-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Parcial</th>
                          <th>Tipo</th>
                          <th>Fecha</th>
                          <th>Val.</th>
                          <th>Nota</th>
                          <th>Observación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.parciales.map(p => (
                          <tr key={p.id_parcial}>
                            <td>{p.nombre_parcial}</td>
                            <td>
                              <span className="val-badge">{p.tipo}</span>
                            </td>
                            <td>{p.fecha ?? "—"}</td>
                            <td>{p.valoracion}</td>
                            <td>
                              {p.nota !== null ? (
                                <span className={p.nota >= p.valoracion * 0.5 ? "pe-nota-ok" : "pe-nota-fail"}>
                                  {p.nota}
                                </span>
                              ) : (
                                <span className="pe-nota-none">—</span>
                              )}
                            </td>
                            <td style={{ color: "#888", fontStyle: "italic" }}>{p.observacion ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function EstudiantePanel_admin() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const [fNombre,   setFNombre]   = useState("");
  const [fApellido, setFApellido] = useState("");
  const [fMencion,  setFMencion]  = useState("");
  const [fAnio,     setFAnio]     = useState("");

  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit,   setModalEdit]   = useState<Estudiante | null>(null);
  const [modalDelete, setModalDelete] = useState<Estudiante | null>(null);
  const [modalInsc,   setModalInsc]   = useState<Estudiante | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const fetchEstudiantes = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams();
      if (fNombre)   params.append("nombre",   fNombre);
      if (fApellido) params.append("apellido",  fApellido);
      if (fMencion)  params.append("mencion",   fMencion);
      if (fAnio)     params.append("anio",      fAnio);
      const { data } = await api.get(`/admin/estudiantes/Estudiantes-filter/?${params}`);
      setEstudiantes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [fNombre, fApellido, fMencion, fAnio]);

  useEffect(() => { fetchEstudiantes(); }, [fetchEstudiantes]);

  const handleCreate = async (data: any) => {
    await api.post("/admin/estudiantes/", data);
    fetchEstudiantes();
  };

  const handleEdit = async (data: any) => {
    await api.patch(`/admin/estudiantes/${modalEdit!.id_estudiante}`, data);
    fetchEstudiantes();
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/estudiantes/${modalDelete.id_estudiante}`);
      setModalDelete(null);
      fetchEstudiantes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally { setDeleting(false); }
  };

  return (
    <>
      {/* Header */}
      <div className="pe-header">
          <p className="pe-sub">Gestión académica · {estudiantes.length} registros</p>
        <button className="btn-primary" onClick={() => setModalCreate(true)}>
          <Icon.Plus /> Nuevo estudiante
        </button>
      </div>

      {/* Filtros */}
      <div className="pe-filters">
        <div className="pe-filter-field">
          <span className="pe-filter-icon"><Icon.Search /></span>
          <input className="pe-filter-input" placeholder="Nombre…" value={fNombre} onChange={e => setFNombre(e.target.value)} />
        </div>
        <div className="pe-filter-field">
          <span className="pe-filter-icon"><Icon.Search /></span>
          <input className="pe-filter-input" placeholder="Apellido…" value={fApellido} onChange={e => setFApellido(e.target.value)} />
        </div>
        <select className="pe-filter-select" value={fMencion} onChange={e => setFMencion(e.target.value)}>
          <option value="">Todas las menciones</option>
          <option value="fisioterapia">Fisioterapia</option>
          <option value="bioimagenologia">Bioimagenología</option>
          <option value="laboratorio clinico">Laboratorio Clínico</option>
        </select>
        <select className="pe-filter-select" value={fAnio} onChange={e => setFAnio(e.target.value)}>
          <option value="">Todos los años</option>
          {[1,2,3,4,5].map(a => <option key={a} value={a}>Año {a}</option>)}
        </select>
        {(fNombre || fApellido || fMencion || fAnio) && (
          <button className="btn-ghost" onClick={() => { setFNombre(""); setFApellido(""); setFMencion(""); setFAnio(""); }}>
            Limpiar
          </button>
        )}
      </div>

      {error && <div className="dp-error">{error}</div>}

      {/* Tabla */}
      <div className="dp-table-wrap">
        {loading ? (
          <div className="dp-loading">
            <div className="pe-spinner" />
            <p>Cargando estudiantes…</p>
          </div>
        ) : estudiantes.length === 0 ? (
          <div className="dp-empty">
            <div className="dp-empty-icon">🎓</div>
            <p>No se encontraron estudiantes.</p>
          </div>
        ) : (
          <table className="dp-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Matrícula</th>
                <th>CI</th>
                <th>Año</th>
                <th>Mención</th>
                <th>Materias</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(e => (
                <EstudianteRow
                  key={e.id_estudiante}
                  est={e}
                  onEdit={() => setModalEdit(e)}
                  onDelete={() => setModalDelete(e)}
                  onInscripcion={() => setModalInsc(e)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {modalCreate && (
        <Modal title="Nuevo estudiante" onClose={() => setModalCreate(false)}>
          <EstudianteForm onSave={handleCreate} onClose={() => setModalCreate(false)} />
        </Modal>
      )}
      {modalEdit && (
        <Modal title="Editar estudiante" onClose={() => setModalEdit(null)}>
          <EstudianteForm initial={modalEdit} onSave={handleEdit} onClose={() => setModalEdit(null)} />
        </Modal>
      )}
      {modalDelete && (
        <Modal title="Confirmar eliminación" onClose={() => setModalDelete(null)}>
          <p className="dp-delete-msg">
            ¿Eliminar a <span className="dp-delete-name">{modalDelete.nombre} {modalDelete.apellido}</span>?
            Se eliminarán también sus inscripciones y notas.
          </p>
          <div className="dp-modal-actions">
            <button className="dp-cancel-btn" onClick={() => setModalDelete(null)}>Cancelar</button>
            <button className="dp-submit-btn danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
      {modalInsc && (
        <Modal title="Inscripciones" onClose={() => setModalInsc(null)}>
          <InscripcionModal
            estudiante={modalInsc}
            onClose={() => setModalInsc(null)}
            onRefresh={fetchEstudiantes}
          />
        </Modal>
      )}
    </>
  );
}