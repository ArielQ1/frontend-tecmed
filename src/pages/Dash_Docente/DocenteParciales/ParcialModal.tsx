// ── Modal crear / editar parcial (normal o grupal padre) ─────────────────────

import { useState } from "react";
import { apiFetch } from "../../../api/client";
import type { Materia, Parcial } from "./Types";

export function ParcialModal({
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

        {/* Selector de tipo — solo al crear */}
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