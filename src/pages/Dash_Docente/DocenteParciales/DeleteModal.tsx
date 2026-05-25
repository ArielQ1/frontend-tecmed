// ── Modal de confirmación para eliminar un parcial ────────────────────────────

import { useState } from "react";
import { apiFetch } from "../../../api/client";
import type { Materia, Parcial } from "./Types";

export function DeleteModal({
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