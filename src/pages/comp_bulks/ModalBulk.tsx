import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BulkResult {
  mensaje:             string;
  materia:             string;
  total_excel:         number;
  estudiantes_nuevos:  number;
  estudiantes_previos: number;
  total_inscritos:     number;
}

interface Props {
  idMateria: string;
  onClose:   () => void;
  onSuccess: (r: BulkResult) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ModalBulk({ idMateria, onClose, onSuccess }: Props) {
  const [file,     setFile]     = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [result,   setResult]   = useState<BulkResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isExcel = (f: File) => f.name.endsWith(".xlsx") || f.name.endsWith(".xls");

  const pickFile = (f: File) => {
    if (!isExcel(f)) { setError("Solo se aceptan archivos .xlsx o .xls"); return; }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("id_materia", idMateria);
    form.append("file", file);

    try {
      // postForm inyecta el token y apunta a http://localhost:8000 automáticamente
      const data = await apiFetch.postForm("/admin/bulk-inscripcion", form);
      setResult(data);
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error del servidor");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={s.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={s.modal}>

        {/* cabecera */}
        <div style={s.modalHead}>
          <span style={s.modalTitle}>📂 Subir lista Excel</span>
          <button style={s.btnClose} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <p style={s.modalHint}>
          El archivo debe tener encabezados en la <strong>fila 7</strong> con las
          columnas&nbsp;<code style={s.code}>NRO · CI · RU · NOMBRE_COMPLETO · NOTA · OBSERVACION</code>.
          Los datos inician desde la fila 8.
        </p>

        {!result ? (
          <>
            {/* zona de drop */}
            <div
              style={{
                ...s.dropzone,
                ...(dragging ? s.dropDrag  : {}),
                ...(file     ? s.dropReady : {}),
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
              />

              {file ? (
                <>
                  <span style={s.dropIcon}>📄</span>
                  <p style={s.dropFileName}>{file.name}</p>
                  <p style={s.dropFileSize}>{(file.size / 1024).toFixed(1)} KB</p>
                  <button
                    style={s.btnGhost}
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                  >
                    Cambiar archivo
                  </button>
                </>
              ) : (
                <>
                  <span style={s.dropIcon}>📂</span>
                  <p style={s.dropLabel}>
                    {dragging ? "Suelta aquí" : "Arrastra tu Excel o haz clic para seleccionar"}
                  </p>
                  <p style={s.dropSub}>.xlsx · .xls</p>
                </>
              )}
            </div>

            {error && <div style={s.errorBox}>⚠ {error}</div>}

            <div style={s.modalActions}>
              <button style={s.btnCancel} onClick={onClose}>Cancelar</button>
              <button
                style={{ ...s.btnUpload, ...(!file || loading ? s.btnUploadOff : {}) }}
                disabled={!file || loading}
                onClick={handleSubmit}
              >
                {loading
                  ? <><span style={s.spin} /> Procesando…</>
                  : "Subir e inscribir"}
              </button>
            </div>
          </>
        ) : (
          /* resultado */
          <div style={s.resultWrap}>
            <div style={s.resultBadge}>✅ {result.mensaje}</div>
            <div style={s.statsGrid}>
              <StatCard label="Filas en Excel"    value={result.total_excel}           color="var(--clr-accent, #6366f1)" />
              <StatCard label="Nuevos creados"     value={result.estudiantes_nuevos}    color="#10b981" />
              <StatCard label="Ya existían"        value={result.estudiantes_previos}   color="#f59e0b" />
              <StatCard label="Total inscritos"    value={result.total_inscritos}       color="#3b82f6" />
            </div>
            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={reset}>Cargar otro archivo</button>
              <button style={s.btnUpload} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...s.statCard, borderTop: `3px solid ${color}` }}>
      <span style={{ ...s.statVal, color }}>{value}</span>
      <span style={s.statLabel}>{label}</span>
    </div>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position:       "fixed",
    inset:          0,
    background:     "rgba(0,0,0,0.55)",
    backdropFilter: "blur(3px)",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    zIndex:         1000,
    padding:        "1rem",
  },
  modal: {
    background:   "var(--clr-surface, #1e293b)",
    border:       "1px solid var(--clr-border, #334155)",
    borderRadius: 14,
    padding:      "1.75rem",
    width:        "100%",
    maxWidth:     520,
    color:        "var(--clr-ink, #e2e8f0)",
    fontFamily:   "inherit",
  },
  modalHead: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   "0.75rem",
  },
  modalTitle: {
    fontWeight:    700,
    fontSize:      "1.05rem",
    letterSpacing: "-0.01em",
    color:         "var(--clr-ink-1, #f8fafc)",
  },
  btnClose: {
    background: "transparent",
    border:     "none",
    cursor:     "pointer",
    fontSize:   "1rem",
    color:      "var(--clr-ink-3, #64748b)",
    padding:    "0 4px",
    lineHeight: 1,
  },
  modalHint: {
    fontSize:     "0.78rem",
    color:        "var(--clr-ink-3, #94a3b8)",
    marginBottom: "1.25rem",
    lineHeight:   1.6,
  },
  code: {
    background:   "var(--clr-bg, #0f172a)",
    padding:      "1px 5px",
    borderRadius: 4,
    fontSize:     "0.75rem",
    color:        "var(--clr-accent, #818cf8)",
  },
  dropzone: {
    border:       "2px dashed var(--clr-border, #334155)",
    borderRadius: 10,
    padding:      "2rem 1.5rem",
    textAlign:    "center",
    cursor:       "pointer",
    transition:   "all 0.2s",
    background:   "var(--clr-bg, #0f172a)",
    marginBottom: "0.75rem",
  },
  dropDrag: {
    borderColor: "var(--clr-accent, #6366f1)",
    background:  "rgba(99,102,241,0.07)",
  },
  dropReady: {
    borderStyle:  "solid",
    borderColor:  "#10b981",
    background:   "rgba(16,185,129,0.06)",
  },
  dropIcon:     { fontSize: "2rem", display: "block", marginBottom: "0.5rem" },
  dropLabel:    { margin: "0 0 0.25rem", fontSize: "0.875rem", color: "var(--clr-ink-2, #cbd5e1)" },
  dropSub:      { margin: 0, fontSize: "0.72rem", color: "var(--clr-ink-3, #475569)" },
  dropFileName: { margin: "0 0 0.2rem", fontWeight: 600, fontSize: "0.9rem", color: "#10b981" },
  dropFileSize: { margin: "0 0 0.75rem", fontSize: "0.72rem", color: "var(--clr-ink-3, #64748b)" },
  errorBox: {
    background:   "rgba(127,29,29,0.3)",
    border:       "1px solid rgba(239,68,68,0.4)",
    borderRadius: 8,
    padding:      "0.6rem 0.9rem",
    fontSize:     "0.82rem",
    color:        "#fca5a5",
    marginBottom: "0.75rem",
  },
  modalActions: {
    display:        "flex",
    justifyContent: "flex-end",
    gap:            "0.6rem",
    marginTop:      "1rem",
  },
  btnCancel: {
    padding:      "0.55rem 1.1rem",
    borderRadius: 8,
    border:       "1px solid var(--clr-border, #334155)",
    background:   "transparent",
    color:        "var(--clr-ink-3, #94a3b8)",
    fontSize:     "0.85rem",
    cursor:       "pointer",
  },
  btnGhost: {
    padding:      "0.5rem 1rem",
    borderRadius: 8,
    border:       "1px solid var(--clr-border, #334155)",
    background:   "transparent",
    color:        "var(--clr-ink-3, #94a3b8)",
    fontSize:     "0.8rem",
    cursor:       "pointer",
  },
  btnUpload: {
    display:      "inline-flex",
    alignItems:   "center",
    gap:          "0.5rem",
    padding:      "0.55rem 1.25rem",
    borderRadius: 8,
    border:       "none",
    background:   "var(--clr-accent, #6366f1)",
    color:        "#fff",
    fontWeight:   600,
    fontSize:     "0.875rem",
    cursor:       "pointer",
    transition:   "opacity 0.15s",
  },
  btnUploadOff: { opacity: 0.4, cursor: "not-allowed" },
  spin: {
    display:        "inline-block",
    width:          14,
    height:         14,
    border:         "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius:   "50%",
    animation:      "spin 0.7s linear infinite",
  },
  resultWrap:  { marginTop: "0.5rem" },
  resultBadge: {
    fontWeight:   700,
    fontSize:     "0.95rem",
    color:        "#4ade80",
    marginBottom: "1rem",
  },
  statsGrid: {
    display:             "grid",
    gridTemplateColumns: "1fr 1fr",
    gap:                 "0.6rem",
    marginBottom:        "0.25rem",
  },
  statCard: {
    background:    "var(--clr-bg, #0f172a)",
    borderRadius:  8,
    padding:       "0.7rem 0.9rem",
    display:       "flex",
    flexDirection: "column",
    gap:           "0.15rem",
  },
  statVal:   { fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 },
  statLabel: {
    fontSize:      "0.68rem",
    color:         "var(--clr-ink-3, #64748b)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
};