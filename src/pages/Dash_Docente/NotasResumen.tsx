import { useState, useEffect } from "react";
import { apiFetch } from "../../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MateriaResumen {
  id_materia:    string;
  sigla:         string;
  horario:       string | null;
  anio:          number | null;
}

interface ParcialCol {
  id_parcial:  string;
  nombre:      string;
  valoracion:  number | null;
  tipo:        "parcial" | "practica";
}

interface FilaEstudiante {
  id_estudiante: string;
  ci:            number;
  nombre_completo: string;
  notas:         Record<string, number | null>;  // id_parcial → nota
}

interface Props {
  materia:        MateriaResumen;
  // datos ya cargados en DocenteResumen (parciales tipo='parcial' + notas-resumen)
  parcialesDocente: { id_parcial: string; nombre_parcial: string | null; valoracion: number | null }[];
  notasResumen:     Record<string, Record<string, number | null>>;
  inscritos:        { id_estudiante: string; ci_estudiante: number; nombre_completo: string}[];
  onVolver:         () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ResumenNotas({ materia, parcialesDocente, notasResumen, inscritos, onVolver }: Props) {
  const [practicas,       setPracticas]       = useState<ParcialCol[]>([]);
  const [notasPracticas,  setNotasPracticas]  = useState<Record<string, Record<string, number | null>>>({});
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  // Fetch prácticas (tipo='practica') de la materia vía el endpoint de notas-resumen
  // Usamos /admin/estudiantes/Estudiantes-filter para obtener notas de prácticas
  // El endpoint correcto es /parciales/{id_materia}/notas-resumen que ya devuelve TODOS los parciales
  // Necesitamos saber cuáles son prácticas — fetch a un endpoint que liste parciales tipo practica
  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        // Endpoint del auxiliar para listar parciales tipo 'practica' de esta materia
        // parciales_notas.py: GET /notas/usuarios/{id}/parciales filtra por tipo según rol
        // Pero para el docente necesitamos listar las prácticas del auxiliar asignado
        // El endpoint disponible es el kardex del estudiante o notas-resumen (devuelve todos)
        // notas-resumen ya está cargado en el padre — solo falta saber qué ids son prácticas
        // Usamos: GET /admin/estudiantes/Estudiantes-filter/?mencion=... — NO
        // La forma más directa: fetch kardex de un estudiante inscrito para ver qué parciales tienen tipo='practica'
        // Mejor: usar el endpoint de notas-resumen (ya cargado) + un endpoint que liste TODOS los parciales con tipo
        // GET /parciales/{id_materia} solo devuelve tipo='parcial' (filtrado en backend)
        // Solución: pedir el kardex del primer inscrito para extraer los parciales con tipo='practica'
        if (inscritos.length === 0) { setLoading(false); return; }

        const kardex = await apiFetch.get(
          `/admin/estudiantes/${inscritos[0].id_estudiante}/kardex`
        ) as {
          materias: {
            id_materia: string;
            parciales: {
              id_parcial:     string;
              nombre_parcial: string | null;
              tipo:           string;
              valoracion:     number | null;
              nota_detalle:   { nota: number | null } | null;
            }[];
          }[];
        };

        const materiaKardex = kardex.materias.find(m => m.id_materia === materia.id_materia);
        if (!materiaKardex) { setLoading(false); return; }

        // Extraer prácticas
        const cols: ParcialCol[] = materiaKardex.parciales
          .filter(p => p.tipo === "practica")
          .map(p => ({
            id_parcial: p.id_parcial,
            nombre:     p.nombre_parcial ?? "practica",
            valoracion: p.valoracion,
            tipo:       "practica",
          }));

        setPracticas(cols);

        // Construir mapa de notas de prácticas para todos los inscritos
        // El notas-resumen del padre ya tiene TODOS los parciales (docente lo cargó con todos)
        // Como notas-resumen no distingue tipo, ya tenemos las notas — solo falta mapearlas
        // notasResumen: { id_estudiante: { id_parcial: nota } } — incluye prácticas también
        setNotasPracticas(notasResumen);

      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar prácticas");
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [materia.id_materia, inscritos, notasResumen]);

  // ── Columnas: parciales primero, luego prácticas ──────────────────────────
  const colsParciales: ParcialCol[] = parcialesDocente.map(p => ({
    id_parcial: p.id_parcial,
    nombre:     p.nombre_parcial ?? "Parcial",
    valoracion: p.valoracion,
    tipo:       "parcial",
  }));

  const todasLasCols: ParcialCol[] = [...colsParciales, ...practicas];

  // ── Filas de estudiantes ─────────────────────────────────────────────────
  const filas: FilaEstudiante[] = inscritos.map(e => ({
    id_estudiante: e.id_estudiante,
    ci:            e.ci_estudiante,
    nombre_completo: e.nombre_completo,
    notas:         notasResumen[e.id_estudiante] ?? {},
  }));

  // Suma total de prácticas por estudiante
  function sumaPracticas(notas: Record<string, number | null>): number | null {
    if (practicas.length === 0) return null;
    const vals = practicas.map(p => notas[p.id_parcial] ?? null).filter(v => v !== null) as number[];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : null;
  }

  // ── Print ─────────────────────────────────────────────────────────────────
  function generarPDF() {
    window.print();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="dd-tab rn-root" style={{ maxWidth: 1100 }}>

      {/* Cabecera */}
      <header className="dd-tab-header" style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <button className="dd-btn-volver" onClick={onVolver}>← Resumen</button>
            <span className="dd-sigla-badge">{materia.sigla}</span>
            {materia.horario && (
              <span style={{ fontSize: 12, color: "var(--clr-ink-3)" }}>{materia.horario}</span>
            )}
          </div>
          <h1 className="dd-tab-title">Notas — {materia.sigla}</h1>
          <p className="dd-tab-sub">
            {filas.length} estudiante{filas.length !== 1 ? "s" : ""} inscrito{filas.length !== 1 ? "s" : ""}
            {materia.anio ? ` · Año ${materia.anio}` : ""}
          </p>
        </div>

        {/* Botón PDF — oculto al imprimir */}
        <button className="dd-btn-primary rn-no-print" onClick={generarPDF} style={{ flexShrink: 0, marginTop: 4 }}>
          📄 Generar reporte PDF
        </button>
      </header>

      {error   && <div className="dd-error rn-no-print">⚠ {error}</div>}
      {loading && <div className="dd-loading rn-no-print">Cargando prácticas…</div>}

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      <div className="dr-reporte-wrap">
        <table className="dr-reporte-table">
          <thead>
            {/* Fila de grupos */}
            <tr>
              <th className="dr-th dr-th-ci"    rowSpan={2}>CI</th>
              <th className="dr-th dr-th-nombre" rowSpan={2}>Nombre completo</th>

              {colsParciales.length > 0 && (
                <th
                  className="dr-th dr-th-grupo"
                  colSpan={colsParciales.length}
                >
                  Parciales
                </th>
              )}

              {practicas.length > 0 && (
                <th
                  className="dr-th dr-th-grupo rn-grupo-practica"
                  colSpan={1}
                >
                  Prácticas
                </th>
              )}

              <th className="dr-th dr-th-nota" rowSpan={2}>Nota final</th>
            </tr>

            {/* Fila de nombres de parcial */}
            <tr>
              {colsParciales.map(c => (
                <th key={c.id_parcial} className="dr-th dr-th-nota">
                  {c.nombre}
                  {c.valoracion != null && (
                    <span className="dr-th-val">/ {c.valoracion}</span>
                  )}
                </th>
              ))}

              {practicas.length > 0 && (
                <th className="dr-th dr-th-nota rn-col-practica">
                  Total prácticas
                  {practicas.reduce((a, p) => a + (p.valoracion ?? 0), 0) > 0 && (
                    <span className="dr-th-val">
                      / {practicas.reduce((a, p) => a + (p.valoracion ?? 0), 0)}
                    </span>
                  )}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={2 + todasLasCols.length + 1} style={{ textAlign: "center", padding: 24, color: "var(--clr-ink-3)", fontStyle: "italic" }}>
                  Sin estudiantes inscritos.
                </td>
              </tr>
            ) : filas.map(f => {
              const sumPrac   = sumaPracticas(f.notas);
              const notasFin  = [
                ...colsParciales.map(c => f.notas[c.id_parcial] ?? null),
                sumPrac,
              ].filter(v => v !== null) as number[];
              const notaFinal = notasFin.length > 0
                ? notasFin.reduce((a, b) => a + b, 0)
                : null;

              return (
                <tr key={f.id_estudiante} className="dr-reporte-row">
                  <td className="dr-td dr-td-ci">{f.ci}</td>
                  <td className="dr-td dr-td-nombre">{f.nombre_completo}</td>

                  {colsParciales.map(c => (
                    <td key={c.id_parcial} className="dr-td dr-td-nota">
                      <NotaCell nota={f.notas[c.id_parcial] ?? null} valoracion={c.valoracion} />
                    </td>
                  ))}

                  {practicas.length > 0 && (
                    <td className="dr-td dr-td-nota rn-col-practica">
                      <NotaCell
                        nota={sumPrac}
                        valoracion={practicas.reduce((a, p) => a + (p.valoracion ?? 0), 0) || null}
                      />
                    </td>
                  )}

                  <td className="dr-td dr-td-nota rn-nota-final">
                    {notaFinal != null ? (
                      <strong>{notaFinal.toFixed(2)}</strong>
                    ) : (
                      <span style={{ color: "var(--clr-ink-3)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Celda de nota con color aprobado/reprobado ────────────────────────────────

function NotaCell({ nota, valoracion }: { nota: number | null; valoracion: number | null }) {
  if (nota === null) return <span className="rn-sin-nota">—</span>;

  const aprobado = valoracion !== null ? nota >= valoracion / 2 : null;
  return (
    <span className={`rn-nota-pill ${aprobado === true ? "ap" : aprobado === false ? "re" : ""}`}>
      {nota % 1 === 0 ? nota : nota.toFixed(2)}
    </span>
  );
}