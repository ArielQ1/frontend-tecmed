// ── Filas de la tabla de parciales ───────────────────────────────────────────

import type { DatosNotas } from "../DocenteLayout";
import type { ItemLista, Materia, Parcial, ParcialGrupal, } from "./Types";
import { esGrupal, esBloqueado, fmtFecha  } from "./Types";


// ── Fila parcial (normal o grupal con hijos) ──────────────────────────────────

export function FilaParcial({
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
    return (
      <>
        <tr style={{ background: "rgba(124, 58, 237, 0.04)", borderLeft: "3px solid #7c3aed" }}>
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

          <td>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {item.hijos.length} sub-parcial{item.hijos.length !== 1 ? "es" : ""}
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
                  nombre_parcial: item.nombre_parcial ?? "Grupal",
                  sigla:          materia.sigla,
                  fecha:          item.fecha,
                  valoracion:     item.valoracion,
                  parcial_grupal: item.parcial_grupal,
                })}
                title="Ver notas del parcial grupal"
              >
                📋 Notas
              </button>
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

        {/* Placeholder si está expandido pero sin hijos */}
        {expandido && item.hijos.length === 0 && (
          <tr>
            <td colSpan={5} style={{
              paddingLeft: 48, fontSize: 13, color: "#9ca3af",
              fontStyle: "italic", borderLeft: "3px solid #e9d5ff",
            }}>
              Sin sub-parciales. Usa "+ Añadir parcial" para crear el primero.
            </td>
          </tr>
        )}
      </>
    );
  }

  // ── Fila parcial normal ───────────────────────────────────────────────────
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
              parcial_grupal: item.parcial_grupal,
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
          <button className="dd-btn-sm dd-btn-del" onClick={() => onDelete(item)}>
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Fila hijo (dentro de un grupal expandido) ─────────────────────────────────

export function FilaHijo({
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
      <td className="dd-td-name" style={{ paddingLeft: 40 }}>
        <span style={{ color: "#9ca3af", marginRight: 6, fontSize: 12 }}>└</span>
        {hijo.nombre_parcial ?? "—"}
      </td>

      <td>
        <span style={{
          fontSize: 11, color: "#7c3aed", background: "#f5f3ff",
          border: "1px solid #ddd6fe", borderRadius: 4, padding: "2px 6px",
        }}>
          Sub-parcial
        </span>
      </td>

      <td>{fmtFecha(hijo.fecha)}</td>

      <td>
        {hijo.valoracion != null
          ? <span className="dd-val-badge">{hijo.valoracion} pts</span>
          : "—"}
      </td>

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
              parcial_grupal: hijo.parcial_grupal,
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
          <button className="dd-btn-sm dd-btn-del" onClick={() => onDelete(hijo)}>
            🗑
          </button>
        </div>
      </td>
    </tr>
  );
}