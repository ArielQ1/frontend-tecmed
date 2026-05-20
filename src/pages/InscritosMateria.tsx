import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../api/client";
import { ModalBulk } from "./comp_bulks/ModalBulk_admin";
import type { BulkResult } from "./comp_bulks/ModalBulk_admin";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia:     string;
  nombre_materia: string;
  sigla:          string;
  horario:        string | null;
  anio:           number | null;
  docente: { id_usuario: string; nombre: string; apellido: string; titulo: string } | null;
  auxiliar: { id_usuario: string; nombre: string } | null;
}

interface Inscrito {
  id_estudiante:   string;
  ci_estudiante:   number;
  matricula:       number;
  nombre_completo: string;
  anio:            number | null;
  mencion:         string | null;
}

interface ParcialCol {
  id_parcial: string;
  nombre:     string;
  valoracion: number | null;
  tipo:       "parcial" | "practica";
}

interface KardexEstudiante {
  id_estudiante:   string;
  nombre_completo: string;
  materias: {
    id_materia: string;
    parciales: {
      id_parcial:   string;
      nota_detalle: { nota: number | null } | null;
    }[];
  }[];
}

interface Props {
  materia:  Materia;
  onVolver: () => void;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function InscritosMateria({ materia, onVolver }: Props) {
  const [inscritos,  setInscritos]  = useState<Inscrito[]>([]);
  const [columnas,   setColumnas]   = useState<ParcialCol[]>([]);
  const [notasMap,   setNotasMap]   = useState<Record<string, Record<string, number | null>>>({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showModal,  setShowModal]  = useState(false);

  // ── Carga de datos ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [inscritosData, parcialesData] = await Promise.all([
        apiFetch.get(`/admin/materias/${materia.id_materia}/inscritos`) as Promise<Inscrito[]>,
        apiFetch.get(`/admin/materias/${materia.id_materia}/parciales`) as Promise<{
          id_parcial:     string;
          nombre_parcial: string | null;
          valoracion:     number | null;
          tipo:           string;
        }[]>,
      ]);

      setInscritos(inscritosData);
      setColumnas(
        parcialesData.map((p) => ({
          id_parcial: p.id_parcial,
          nombre:     p.nombre_parcial ?? "Parcial",
          valoracion: p.valoracion,
          tipo:       p.tipo === "practica" ? "practica" : "parcial",
        }))
      );

      if (inscritosData.length === 0 || parcialesData.length === 0) return;

      const kardexList = await Promise.all(
        inscritosData.map((e) =>
          apiFetch.get(`/admin/estudiantes/${e.id_estudiante}/kardex`) as Promise<KardexEstudiante>
        )
      );

      const mapa: Record<string, Record<string, number | null>> = {};
      kardexList.forEach((kardex) => {
        const mk = kardex.materias.find((m) => m.id_materia === materia.id_materia);
        mapa[kardex.id_estudiante] = {};
        mk?.parciales.forEach((p) => {
          mapa[kardex.id_estudiante][p.id_parcial] = p.nota_detalle?.nota ?? null;
        });
      });
      setNotasMap(mapa);

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [materia.id_materia]);

  useEffect(() => { cargar(); }, [cargar]);

  // Al cerrar el modal → refrescar tabla con los nuevos inscritos
  const handleModalClose = () => {
    setShowModal(false);
    cargar();
  };

  // ── Separar columnas ──────────────────────────────────────────────────────
  const colsParciales = columnas.filter((c) => c.tipo === "parcial");
  const colsPracticas = columnas.filter((c) => c.tipo === "practica");
  const totalValPrac  = colsPracticas.reduce((a, p) => a + (p.valoracion ?? 0), 0);

  function sumaPracticas(notas: Record<string, number | null>): number | null {
    if (colsPracticas.length === 0) return null;
    const vals = colsPracticas
      .map((p) => notas[p.id_parcial] ?? null)
      .filter((v): v is number => v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dd-tab rn-root" style={{ maxWidth: 1100 }}>

      {/* Modal de bulk — se monta solo cuando showModal es true */}
      {showModal && (
        <ModalBulk
          idMateria={materia.id_materia}
          onClose={handleModalClose}
          onSuccess={(_r: BulkResult) => { /* resumen ya se muestra dentro del modal */ }}
        />
      )}

      <header className="dd-tab-header" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <button className="dd-btn-volver" onClick={onVolver}>← Materias</button>
            <span className="dd-sigla-badge">{materia.sigla}</span>
            {materia.horario && (
              <span style={{ fontSize: 12, color: "var(--clr-ink-3)" }}>{materia.horario}</span>
            )}
          </div>
          <h1 className="dd-tab-title">{materia.nombre_materia}</h1>
          <p className="dd-tab-sub">
            {inscritos.length} estudiante{inscritos.length !== 1 ? "s" : ""} inscrito{inscritos.length !== 1 ? "s" : ""}
            {materia.anio ? ` · Año ${materia.anio}` : ""}
            {materia.docente
              ? ` · ${materia.docente.titulo} ${materia.docente.nombre} ${materia.docente.apellido}`
              : ""}
          </p>
        </div>

        <button
          className="dd-btn-primary rn-no-print"
          style={{ flexShrink: 0, marginTop: 4 }}
          onClick={() => setShowModal(true)}
        >
          📂 Subir lista Excel
        </button>
      </header>

      {error   && <div className="dd-error">⚠ {error}</div>}
      {loading && <div className="dd-loading">Cargando inscritos…</div>}

      {!loading && !error && (
        <div className="dr-reporte-wrap">
          <table className="dr-reporte-table">
            <thead>
              <tr>
                <th className="dr-th dr-th-ci"     rowSpan={2}>CI</th>
                <th className="dr-th dr-th-nombre" rowSpan={2}>Nombre completo</th>

                {colsParciales.length > 0 && (
                  <th className="dr-th dr-th-grupo" colSpan={colsParciales.length}>
                    Parciales
                  </th>
                )}
                {colsPracticas.length > 0 && (
                  <th className="dr-th dr-th-grupo rn-grupo-practica" colSpan={1}>
                    Prácticas
                  </th>
                )}
                <th className="dr-th dr-th-nota" rowSpan={2}>Nota final</th>
              </tr>

              <tr>
                {colsParciales.map((c) => (
                  <th key={c.id_parcial} className="dr-th dr-th-nota">
                    {c.nombre}
                    {c.valoracion != null && <span className="dr-th-val">/ {c.valoracion}</span>}
                  </th>
                ))}
                {colsPracticas.length > 0 && (
                  <th className="dr-th dr-th-nota rn-col-practica">
                    Total prácticas
                    {totalValPrac > 0 && <span className="dr-th-val">/ {totalValPrac}</span>}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {inscritos.length === 0 ? (
                <tr>
                  <td
                    colSpan={2 + colsParciales.length + (colsPracticas.length > 0 ? 1 : 0) + 1}
                    style={{ textAlign: "center", padding: 24, color: "var(--clr-ink-3)", fontStyle: "italic" }}
                  >
                    Sin estudiantes inscritos.
                  </td>
                </tr>
              ) : inscritos.map((e) => {
                const notas     = notasMap[e.id_estudiante] ?? {};
                const sumPrac   = sumaPracticas(notas);
                const vals      = [
                  ...colsParciales.map((c) => notas[c.id_parcial] ?? null),
                  sumPrac,
                ].filter((v): v is number => v !== null);
                const notaFinal = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;

                return (
                  <tr key={e.id_estudiante} className="dr-reporte-row">
                    <td className="dr-td dr-td-ci">{e.ci_estudiante}</td>
                    <td className="dr-td dr-td-nombre">{e.nombre_completo}</td>

                    {colsParciales.map((c) => (
                      <td key={c.id_parcial} className="dr-td dr-td-nota">
                        <NotaCell nota={notas[c.id_parcial] ?? null} valoracion={c.valoracion} />
                      </td>
                    ))}

                    {colsPracticas.length > 0 && (
                      <td className="dr-td dr-td-nota rn-col-practica">
                        <NotaCell nota={sumPrac} valoracion={totalValPrac || null} />
                      </td>
                    )}

                    <td className="dr-td dr-td-nota rn-nota-final">
                      {notaFinal != null
                        ? <strong>{notaFinal.toFixed(2)}</strong>
                        : <span style={{ color: "var(--clr-ink-3)" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Celda de nota ─────────────────────────────────────────────────────────────

function NotaCell({ nota, valoracion }: { nota: number | null; valoracion: number | null }) {
  if (nota === null) return <span className="rn-sin-nota">—</span>;
  const aprobado = valoracion !== null ? nota >= valoracion / 2 : null;
  return (
    <span className={`rn-nota-pill ${aprobado === true ? "ap" : aprobado === false ? "re" : ""}`}>
      {nota % 1 === 0 ? nota : nota.toFixed(2)}
    </span>
  );
}