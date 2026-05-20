import { useState, useRef } from "react";

// ─── tipos ────────────────────────────────────────────────────────────────────
interface BulkResult {
  mensaje: string;
  materia: string;
  total_excel: number;
  estudiantes_nuevos: number;
  estudiantes_previos: number;
  total_inscritos: number;
}

interface Props {
  idMateria: string;           // UUID de la materia ya seleccionada
  onSuccess?: (r: BulkResult) => void;
}

// ─── componente ───────────────────────────────────────────────────────────────
export default function BulkInscripcion({ idMateria, onSuccess }: Props) {
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<BulkResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  // ── drag & drop ──
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && isExcel(dropped)) {
      setFile(dropped);
      setResult(null);
      setError(null);
    } else {
      setError("Solo se aceptan archivos .xlsx o .xls");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    if (chosen && isExcel(chosen)) {
      setFile(chosen);
      setResult(null);
      setError(null);
    } else if (chosen) {
      setError("Solo se aceptan archivos .xlsx o .xls");
    }
  };

  const isExcel = (f: File) =>
    f.name.endsWith(".xlsx") || f.name.endsWith(".xls");

  // ── submit ──
  const handleSubmit = async () => {
    if (!file || !idMateria) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const form = new FormData();
    form.append("id_materia", idMateria);
    form.append("file", file);

    try {
      const res = await fetch("/admin/estudiantes/bulk-inscripcion", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.detail ?? "Error desconocido del servidor");
      } else {
        setResult(data);
        onSuccess?.(data);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Carga masiva de estudiantes</h2>
      <p style={styles.subtitle}>
        El Excel debe tener encabezados en la <strong>fila 6</strong> con las
        columnas: <code>NRO · CI · RU · NOMBRE_COMPLETO · NOTA · OBSERVACION</code>
      </p>

      {/* ── drop zone ── */}
      {!result && (
        <div
          style={{
            ...styles.dropzone,
            ...(dragging ? styles.dropzoneDrag : {}),
            ...(file ? styles.dropzoneReady : {}),
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
            onChange={handleFileChange}
          />

          {file ? (
            <>
              <span style={styles.icon}>📄</span>
              <p style={styles.fileName}>{file.name}</p>
              <p style={styles.fileSize}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                style={styles.btnSecondary}
                onClick={(e) => { e.stopPropagation(); reset(); }}
              >
                Cambiar archivo
              </button>
            </>
          ) : (
            <>
              <span style={styles.icon}>📂</span>
              <p style={styles.dropText}>
                {dragging
                  ? "Suelta el archivo aquí"
                  : "Arrastra tu Excel aquí o haz clic para seleccionar"}
              </p>
              <p style={styles.dropHint}>.xlsx · .xls</p>
            </>
          )}
        </div>
      )}

      {/* ── error ── */}
      {error && (
        <div style={styles.errorBox}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── botón enviar ── */}
      {!result && (
        <button
          style={{
            ...styles.btnPrimary,
            ...((!file || loading) ? styles.btnDisabled : {}),
          }}
          disabled={!file || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <span style={styles.loadingRow}>
              <span style={styles.spinner} /> Procesando…
            </span>
          ) : (
            "Subir e inscribir"
          )}
        </button>
      )}

      {/* ── resultado ── */}
      {result && (
        <div style={styles.resultBox}>
          <div style={styles.resultHeader}>
            <span style={styles.checkIcon}>✅</span>
            <span style={styles.resultTitle}>{result.mensaje}</span>
          </div>

          <p style={styles.materiaNombre}>📚 {result.materia}</p>

          <div style={styles.statsGrid}>
            <Stat label="Filas en Excel"       value={result.total_excel}           color="#6366f1" />
            <Stat label="Estudiantes nuevos"   value={result.estudiantes_nuevos}    color="#10b981" />
            <Stat label="Ya existían"          value={result.estudiantes_previos}   color="#f59e0b" />
            <Stat label="Total inscritos"      value={result.total_inscritos}       color="#3b82f6" />
          </div>

          <button style={styles.btnSecondary} onClick={reset}>
            Cargar otro Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── sub-componente stat ──────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <span style={{ ...styles.statValue, color }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// ─── estilos ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    maxWidth: 560,
    margin: "0 auto",
    padding: "2rem",
    background: "#0f172a",
    borderRadius: 16,
    color: "#e2e8f0",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    margin: "0 0 0.25rem",
    color: "#f8fafc",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    marginBottom: "1.5rem",
    lineHeight: 1.6,
  },

  // drop zone
  dropzone: {
    border: "2px dashed #334155",
    borderRadius: 12,
    padding: "2.5rem 1.5rem",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: "#1e293b",
    marginBottom: "1rem",
  },
  dropzoneDrag: {
    borderColor: "#6366f1",
    background: "#1e2a4a",
  },
  dropzoneReady: {
    borderColor: "#10b981",
    background: "#0f2a20",
    borderStyle: "solid",
  },
  icon: { fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" },
  dropText: { margin: "0 0 0.25rem", fontSize: "0.9rem", color: "#cbd5e1" },
  dropHint: { margin: 0, fontSize: "0.75rem", color: "#475569" },
  fileName: { margin: "0 0 0.25rem", fontWeight: 600, color: "#10b981", fontSize: "0.95rem" },
  fileSize: { margin: "0 0 1rem", fontSize: "0.75rem", color: "#64748b" },

  // error
  errorBox: {
    background: "#451a1a",
    border: "1px solid #7f1d1d",
    borderRadius: 8,
    padding: "0.75rem 1rem",
    fontSize: "0.85rem",
    color: "#fca5a5",
    marginBottom: "1rem",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },

  // botones
  btnPrimary: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "opacity 0.2s",
    letterSpacing: "0.01em",
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  btnSecondary: {
    padding: "0.5rem 1.25rem",
    borderRadius: 8,
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.8rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },

  // loading
  loadingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
  },
  spinner: {
    display: "inline-block",
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  // resultado
  resultBox: {
    background: "#0f2218",
    border: "1px solid #166534",
    borderRadius: 12,
    padding: "1.5rem",
  },
  resultHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  checkIcon: { fontSize: "1.4rem" },
  resultTitle: { fontWeight: 700, color: "#4ade80", fontSize: "1rem" },
  materiaNombre: { color: "#86efac", fontSize: "0.85rem", margin: "0 0 1.25rem" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  statCard: {
    background: "#0f172a",
    borderRadius: 8,
    padding: "0.75rem 1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  statValue: { fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
};