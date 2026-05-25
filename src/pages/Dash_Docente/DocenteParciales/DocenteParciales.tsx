// ── DocenteParciales — componente principal (orquestador) ────────────────────
//
// Estructura de archivos de esta carpeta:
//   types.ts            — interfaces, tipos y type guards
//   utils.ts            — esBloqueado, fmtFecha
//   FilaParcial.tsx     — FilaParcial + FilaHijo (filas de la tabla)
//   ParcialModal.tsx    — modal crear / editar parcial normal o grupal
//   ParcialHijoModal.tsx— modal crear sub-parcial con selector de estudiantes
//   DeleteModal.tsx     — modal de confirmación para eliminar
//   DocenteParciales.tsx— este archivo: estado global + layout

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../api/client";
import type { DatosNotas } from "../DocenteLayout";

import type { DocenteParcialesProps, ItemLista, Materia, Parcial, ParcialGrupal } from "./Types";
import { FilaParcial } from "./FilaParcial";
import { ParcialModal } from "./ParcialModal";
import { ParcialHijoModal } from "./ParcialHijoModal";
import { DeleteModal } from "./DeleteModal";
import type { ModalState } from "./Types";

export function DocenteParciales({ onVerNotas }: DocenteParcialesProps) {
  const [materias,  setMaterias]  = useState<Materia[]>([]);
  const [materia,   setMateria]   = useState<Materia | null>(null);
  const [parciales, setParciales] = useState<ItemLista[]>([]);
  const [loadingM,  setLoadingM]  = useState(false);
  const [loadingP,  setLoadingP]  = useState(false);
  const [error,     setError]     = useState("");
  const [modal,     setModal]     = useState<ModalState>({ type: "none" });
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  // Cargar materias del docente al montar
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

      {/* Modales */}
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