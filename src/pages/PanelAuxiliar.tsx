import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";
import "./style/estilos.css";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Parcial {
  id_parcial: string;
  nombre_parcial: string | null;
  fecha: string | null;
  valoracion: number | null;
}
interface Materia {
  id_materia: string;
  sigla: string;
  nombre_materia: string | null;
  horario: string | null;
  anio: number | null;
  parciales: Parcial[];
}
interface AuxiliarConMaterias {
  id_usuario: string;
  username: string;
  // titulo: string | null;
  nombre: string;
  // apellido: string;
  materias: Materia[];
}
// Vista de la lista usa solo el subconjunto plano (para el modal de editar/eliminar)
type AuxiliarBase = Omit<AuxiliarConMaterias, "materias">;

type DrillView =
  | { type: "list" }
  | { type: "materias"; auxiliar: AuxiliarConMaterias };

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; auxiliar: AuxiliarBase }
  | { type: "delete"; auxiliar: AuxiliarBase };

// ── Main component ────────────────────────────────────────────────────────────
export function AuxiliaresPanel() {
  const [view, setView] = useState<DrillView>({ type: "list" });
  const [auxiliares, setAuxiliares] = useState<AuxiliarConMaterias[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  // Un solo fetch trae auxiliar + materias + parciales
  const fetchAuxiliares = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await apiFetch.get("/admin/auxiliares/materias-parciales");
      // El backend devuelve "practicas" en vez de "parciales" — normalizamos aquí
      const data: AuxiliarConMaterias[] = raw.map((a: any) => ({
        ...a,
        materias: a.materias.map((m: any) => ({
          ...m,
          parciales: m.practicas ?? m.parciales ?? [],
        })),
      }));
      setAuxiliares(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuxiliares();
  }, [fetchAuxiliares]);

  function handleSaved() {
    setModal({ type: "none" });
    fetchAuxiliares();
  }

  return (
    <>
      <div className="dp-wrap">
        <BreadcrumbNav view={view} onBack={() => setView({ type: "list" })} />

        {error && <div className="dp-error">⚠ {error}</div>}

        {view.type === "list" && (
          <AuxiliaresList
            auxiliares={auxiliares}
            loading={loading}
            onAdd={() => setModal({ type: "create" })}
            onEdit={(d) => setModal({ type: "edit", auxiliar: d })}
            onDelete={(d) => setModal({ type: "delete", auxiliar: d })}
            onMaterias={(d) => setView({ type: "materias", auxiliar: d })}
          />
        )}

        {view.type === "materias" && (
          <MateriasList auxiliar={view.auxiliar} />
        )}
      </div>
      {modal.type === "create" && (
        <AuxiliarFormModal onClose={() => setModal({ type: "none" })} onSaved={handleSaved} />
      )}
      {modal.type === "edit" && (
        <AuxiliarFormModal
          auxiliar={modal.auxiliar}
          onClose={() => setModal({ type: "none" })}
          onSaved={handleSaved}
        />
      )}
      {modal.type === "delete" && (
        <DeleteModal
          auxiliar={modal.auxiliar}
          onClose={() => setModal({ type: "none" })}
          onDeleted={handleSaved}
        />
      )}
    </>
  );
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────────

function BreadcrumbNav({
  view,
  onBack,
}: {
  view: DrillView;
  onBack: () => void;
}) {
  if (view.type === "list") return null;
  return (
    <div className="dp-bc">
      <button className="dp-bc-btn" onClick={onBack}>
        Auxiliares
      </button>
      <span className="dp-bc-sep">/</span>
      <span className="dp-bc-cur">
        Materias — {view.auxiliar.nombre}
      </span>
    </div>
  );
}

// ── Docentes list ──────────────────────────────────────────────────────────────

function AuxiliaresList({
  auxiliares,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onMaterias,
}: {
  auxiliares: AuxiliarConMaterias[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (d: AuxiliarBase) => void;
  onDelete: (d: AuxiliarBase) => void;
  onMaterias: (d: AuxiliarConMaterias) => void;
}) {
  return (
    <>
      <div className="dp-toolbar">
        <span className="dp-count">
          {auxiliares.length} auxiliar{auxiliares.length !== 1 ? "s" : ""}
        </span>
        <button className="btn-primary" onClick={onAdd}>
          + Nuevo auxiliar
        </button>
      </div>

      {loading ? (
        <div className="dp-loading">Cargando…</div>
      ) : auxiliares.length === 0 ? (
        <div className="dp-empty">
          <div className="dp-empty-icon">🎓</div>
          <p>No hay auxiliares registrados.</p>
        </div>
      ) : (
        <div className="dp-grid">
          {auxiliares.map((d) => (
            <div className="dp-card" key={d.id_usuario}>
              <div className="dp-card-top">
                <div className="dp-avatar">🎓</div>
                <div className="dp-info">
                  <div className="dp-name">
                    {/* {d.titulo ? tituloLabel[d.titulo] + " " : ""} */}
                    {d.nombre} {/* {d.apellido} */}
                  </div>
                  <div className="dp-meta">
                    {/* {d.titulo && (
                      <span className="dp-titulo-badge">{d.titulo}</span>
                    )} */}
                    <span>@{d.username}</span>
                    <span className="dp-meta-sep">·</span>
                    <span>
                      {d.materias.length} materia
                      {d.materias.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="dp-card-actions">
                <button
                  className="btn-sm btn-outline"
                  onClick={() => onMaterias(d)}
                >
                  📚 Materias
                </button>
                <button className="btn-sm btn-edit" onClick={() => onEdit(d)}>
                  ✏️ Editar
                </button>
                <button
                  className="btn-sm btn-delete"
                  onClick={() => onDelete(d)}
                >
                  🗑 Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Materias list ──────────────────────────────────────────────────────────────
// Los datos ya vienen cargados desde el padre — sin fetch adicional
function MateriasList({ auxiliar }: { auxiliar: AuxiliarConMaterias }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { materias } = auxiliar;

  if (materias.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon">📚</div>
        <p>Este auxiliar no tiene materias asignadas.</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="dp-toolbar">
        <span className="dp-count">
          {materias.length} materia{materias.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {materias.map((m) => {
          const isOpen = expanded === m.id_materia;
          return (
            <div key={m.id_materia} className="dp-table-wrap">
              {/* Fila materia */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: isOpen ? "1px solid #e0dbd3" : "none",
                }}
              >
                <span className="sigla-badge">{m.sigla}</span>
                {m.nombre_materia && (
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#3b3530" }}>
                    {m.nombre_materia}
                  </span>
                )}
                <span style={{ fontSize: 13, color: "#5a534c", flex: 1 }}>
                  {m.horario ?? "—"}
                  {m.anio ? ` · Año ${m.anio}` : ""}
                </span>
                <span style={{ fontSize: 12, color: "#9a9088", marginRight: 8 }}>
                  {m.parciales.length} parcial
                  {m.parciales.length !== 1 ? "es" : ""}
                </span>
                <button
                  className="btn-sm btn-outline"
                  onClick={() =>
                    setExpanded(isOpen ? null : m.id_materia)
                  }
                  disabled={m.parciales.length === 0}
                >
                  {isOpen ? "▲ Ocultar" : "📝 Ver practicas"}
                </button>
              </div>

              {/* Parciales inline */}
              {isOpen && (
                <div style={{ padding: "0 18px 14px" }}>
                  <table className="dp-table" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Valoración</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.parciales.map((p) => (
                        <tr key={p.id_parcial}>
                          <td>{p.nombre_parcial ?? "—"}</td>
                          <td>{p.fecha ?? "—"}</td>
                          <td>
                            {p.valoracion != null ? (
                              <span className="val-badge">{p.valoracion} pts</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Form Modal (create / edit) ─────────────────────────────────────────────────

function AuxiliarFormModal({
  auxiliar,
  onClose,
  onSaved,
}: {
  auxiliar?: AuxiliarBase;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!auxiliar;
  const [form, setForm] = useState({
    nombre:   auxiliar?.nombre   ?? "",
    // apellido: docent?.apellido ?? "",
    // titulo:   docent?.titulo   ?? "",
    username: auxiliar?.username ?? "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.nombre || !form.username || (!isEdit && !form.password)) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body: Record<string, string> = {
        nombre:   form.nombre,
        // apellido: form.apellido,
        username: form.username,
      };
      // if (form.titulo)   body.titulo   = form.titulo;
      if (form.password) body.password = form.password;

      if (isEdit) {
        await apiFetch.patch(`/admin/auxiliares/${auxiliar!.id_usuario}`, body);
      } else {
        await apiFetch.post("/admin/auxiliares/", body);
      }
      onSaved();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="dp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dp-modal">
        <h2 className="dp-modal-title">
          {isEdit ? "Editar auxiliar" : "Nuevo auxiliar"}
        </h2>

        {error && (
          <div className="dp-error" style={{ marginBottom: 16 }}>
            ⚠ {error}
          </div>
        )}

        <div className="dp-form-group">
          <label className="dp-form-label">Nombre *</label>
          <input
            className="dp-form-input"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Juan"
          />
          {/* <div className="dp-form-group">
            <label className="dp-form-label">Apellido *</label>
            <input
              className="dp-form-input"
              value={form.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              placeholder="Pérez"
            />
          </div> */}
        </div>
        {/* <div className="dp-form-group">
          <label className="dp-form-label">Título</label>
          <select
            className="dp-form-select"
            value={form.titulo}
            onChange={(e) => set("titulo", e.target.value)}
          >
            <option value="">Sin título</option>
            {TITULOS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div> */}

        <div className="dp-form-group">
          <label className="dp-form-label">Username *</label>
          <input
            className="dp-form-input"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="juan.perez"
          />
        </div>

        <div className="dp-form-group">
          <label className="dp-form-label">
            Contraseña {isEdit ? "(dejar vacío para no cambiar)" : "*"}
          </label>
          <input
            className="dp-form-input"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="dp-modal-actions">
          <button className="dp-cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="dp-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear auxiliar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ───────────────────────────────────────────────────────────────

function DeleteModal({
  auxiliar,
  onClose,
  onDeleted,
}: {
  auxiliar: AuxiliarBase;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    try {
      await apiFetch.delete(`/admin/auxiliares/${auxiliar.id_usuario}`);
      onDeleted();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div
      className="dp-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dp-modal">
        <h2 className="dp-modal-title">Eliminar auxiliar</h2>
        <p className="dp-delete-msg">
          ¿Estás seguro de que quieres eliminar a{" "}
          <span className="dp-delete-name">
            {auxiliar.nombre}
          </span>
          ? Esta acción no se puede deshacer.
        </p>
        {error && (
          <div className="dp-error" style={{ marginTop: 12 }}>
            ⚠ {error}
          </div>
        )}
        <div className="dp-modal-actions">
          <button className="dp-cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="dp-submit-btn danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}