import ExcelJS from "exceljs";
// CREA EXCEL PARA QUE EL DOCENTE SUBA LAS NOTAS
// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExcelInscritosParams {
  nombreMateria: string;  // va en B4
  nombreDocente: string;  // va en B5
  estudiantes: {
    matricula:     number;  // RU
    ci_estudiante: number;  // CI
    nombre:        string;
    apellido:      string;
  }[];
}

// ── Colores (igual a la plantilla pa-105) ─────────────────────────────────────

const AZUL_OSCURO = "1A237E";
const GRIS_CLARO  = "F5F5F5";
const GRIS_TEXTO  = "424242";

// ── Función principal ─────────────────────────────────────────────────────────

export async function descargarListaEstudiantes({
  nombreMateria,
  nombreDocente,
  estudiantes,
}: ExcelInscritosParams): Promise<void> {

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Calificaciones");

  // ── Anchos de columna (plantilla original) ────────────────────────────────
  ws.columns = [
    { key: "A", width: 7.9  },   // NRO
    { key: "B", width: 15   },   // RU
    { key: "C", width: 13   },   // CI
    { key: "D", width: 40   },   // NOMBRE_COMPLETO
    { key: "E", width: 12   },   // NOTA
    { key: "F", width: 35   },   // OBSERVACION
  ];

  // ── Fila 1: Universidad ───────────────────────────────────────────────────
  const r1 = ws.addRow(["UNIVERSIDAD MAYOR DE SAN ANDRÉS"]);
  r1.height = 24;
  r1.getCell(1).font      = { bold: true, size: 14, color: { argb: "FF" + AZUL_OSCURO } };

  // ── Fila 2: Facultad ──────────────────────────────────────────────────────
  const r2 = ws.addRow(["FACULTAD DE MEDICINA - CARRERA DE TECNOLOGÍA MÉDICA"]);
  r2.height = 18;
  r2.getCell(1).font      = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };

  // ── Fila 3: vacía ─────────────────────────────────────────────────────────
  const r3 = ws.addRow([]);
  r3.height = 8;

  // ── Fila 4: Materia (B4 = nombreMateria) ──────────────────────────────────
  const r4 = ws.addRow(["MATERIA:", nombreMateria]);
  r4.height = 18;
  r4.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
  r4.getCell(2).font = { size: 11 };

  // ── Fila 5: Docente (B5 = nombreDocente) ──────────────────────────────────
  const r5 = ws.addRow(["DOCENTE:", nombreDocente]);
  r5.height = 18;
  r5.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
  r5.getCell(2).font = { size: 11 };

  // ── Fila 6: vacía ─────────────────────────────────────────────────────────
  const r6 = ws.addRow([]);
  r6.height = 8;

  // ── Fila 7: Encabezados de tabla ──────────────────────────────────────────
  const r7 = ws.addRow(["NRO", "RU", "CI", "NOMBRE_COMPLETO", "NOTA", "OBSERVACION"]);
  r7.height = 20;
  r7.eachCell(cell => {
    cell.font      = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + AZUL_OSCURO } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // ── Filas de datos ────────────────────────────────────────────────────────
  estudiantes.forEach((e, idx) => {
    const row = ws.addRow([
      idx + 1,
      String(e.matricula),
      String(e.ci_estudiante),
      `${e.nombre} ${e.apellido}`,
      null,   // NOTA  — vacía para que el docente la llene
      null,   // OBSERVACION
    ]);
    row.height = 18;

    const bgArgb = idx % 2 === 1 ? "FF" + GRIS_CLARO : "FFFFFFFF";
    row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.font      = { size: 11 };
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      cell.alignment = { horizontal: colIdx === 1 ? "center" : "left", vertical: "middle" };
    });
  });

  // ── Generar y descargar ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const hoy         = new Date().toISOString().slice(0, 10);
  const siglaLimpia = nombreMateria.split(" ")[0].replace(/[^a-zA-Z0-9-]/g, "");
  const fileName    = `lista_${siglaLimpia}_${hoy}.xlsx`;

  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Types para excel con notas ────────────────────────────────────────────────
 
export interface ExcelConNotasParams {
  nombreMateria: string;
  nombreDocente: string;
  nombreParcial: string;    // se muestra en B6
  valoracion:    number | null;
  estudiantes: {
    matricula:     number;
    ci_estudiante: number;
    nombre:        string;
    apellido:      string;
    nota:          number | null;
    observacion:   string | null;
  }[];
}
 
// ── Colores adicionales ───────────────────────────────────────────────────────
 
const VERDE_APROBADO  = "E8F5E9";  // fondo fila aprobado
const ROJO_REPROBADO  = "FFEBEE";  // fondo fila reprobado
const VERDE_NOTA      = "2E7D32";  // texto nota aprobado
const ROJO_NOTA       = "C62828";  // texto nota reprobado
 
// ── Función: descarga Excel con notas y observaciones ya rellenadas ───────────
 
export async function descargarNotasEstudiantes({
  nombreMateria,
  nombreDocente,
  nombreParcial,
  valoracion,
  estudiantes,
}: ExcelConNotasParams): Promise<void> {
 
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Calificaciones");
 
  // ── Anchos de columna ─────────────────────────────────────────────────────
  ws.columns = [
    { key: "A", width: 7.9  },   // NRO
    { key: "B", width: 15   },   // RU
    { key: "C", width: 13   },   // CI
    { key: "D", width: 40   },   // NOMBRE_COMPLETO
    { key: "E", width: 12   },   // NOTA
    { key: "F", width: 35   },   // OBSERVACION
  ];
 
  // ── Fila 1: Universidad ───────────────────────────────────────────────────
  const r1 = ws.addRow(["UNIVERSIDAD MAYOR DE SAN ANDRÉS"]);
  r1.height = 24;
  r1.getCell(1).font = { bold: true, size: 14, color: { argb: "FF" + AZUL_OSCURO } };
 
  // ── Fila 2: Facultad ──────────────────────────────────────────────────────
  const r2 = ws.addRow(["FACULTAD DE MEDICINA - CARRERA DE TECNOLOGÍA MÉDICA"]);
  r2.height = 18;
  r2.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
 
  // ── Fila 3: vacía ─────────────────────────────────────────────────────────
  const r3 = ws.addRow([]);
  r3.height = 8;
 
  // ── Fila 4: Materia ───────────────────────────────────────────────────────
  const r4 = ws.addRow(["MATERIA:", nombreMateria]);
  r4.height = 18;
  r4.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
  r4.getCell(2).font = { size: 11 };
 
  // ── Fila 5: Docente ───────────────────────────────────────────────────────
  const r5 = ws.addRow(["DOCENTE:", nombreDocente]);
  r5.height = 18;
  r5.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
  r5.getCell(2).font = { size: 11 };
 
  // ── Fila 6: Parcial ───────────────────────────────────────────────────────
  const r6 = ws.addRow([
    "PARCIAL:",
    nombreParcial + (valoracion != null ? `  (valoración: ${valoracion} pts)` : ""),
  ]);
  r6.height = 18;
  r6.getCell(1).font = { bold: true, size: 11, color: { argb: "FF" + GRIS_TEXTO } };
  r6.getCell(2).font = { size: 11 };
 
  // ── Fila 7: vacía ─────────────────────────────────────────────────────────
  const r7 = ws.addRow([]);
  r7.height = 8;
 
  // ── Fila 8: Encabezados de tabla ──────────────────────────────────────────
  const r8 = ws.addRow(["NRO", "RU", "CI", "NOMBRE_COMPLETO", "NOTA", "OBSERVACION"]);
  r8.height = 20;
  r8.eachCell(cell => {
    cell.font      = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + AZUL_OSCURO } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
 
  // ── Filas de datos con notas ──────────────────────────────────────────────
  const umbral = valoracion != null ? valoracion / 2 : null;
 
  estudiantes.forEach((e, idx) => {
    const aprobado =
      e.nota !== null && umbral !== null
        ? e.nota >= umbral
        : null;
 
    // Color de fondo: verde si aprobado, rojo si reprobado, gris alterno si sin nota
    const bgArgb =
      aprobado === true  ? "FF" + VERDE_APROBADO :
      aprobado === false ? "FF" + ROJO_REPROBADO :
      idx % 2 === 1      ? "FF" + GRIS_CLARO     :
      "FFFFFFFF";
 
    const row = ws.addRow([
      idx + 1,
      String(e.matricula),
      String(e.ci_estudiante),
      `${e.nombre} ${e.apellido}`,
      e.nota ?? null,
      e.observacion ?? null,
    ]);
    row.height = 18;
 
    row.eachCell({ includeEmpty: true }, (cell, colIdx) => {
      cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
      cell.alignment = { horizontal: colIdx === 1 ? "center" : "left", vertical: "middle" };
      cell.font      = { size: 11 };
 
      // Columna NOTA (col 5): color de texto según aprobado/reprobado
      if (colIdx === 5 && e.nota !== null) {
        cell.font = {
          size:  11,
          bold:  true,
          color: {
            argb: aprobado === true
              ? "FF" + VERDE_NOTA
              : "FF" + ROJO_NOTA,
          },
        };
        // Formato numérico con 2 decimales
        cell.numFmt = "0.00";
      }
    });
  });
 
  // ── Fila de totales al final ──────────────────────────────────────────────
  const conNota    = estudiantes.filter(e => e.nota !== null);
  const aprobados  = umbral !== null ? conNota.filter(e => e.nota! >= umbral).length : null;
  const reprobados = umbral !== null ? conNota.filter(e => e.nota! <  umbral).length : null;
  const promedio   = conNota.length > 0
    ? conNota.reduce((s, e) => s + e.nota!, 0) / conNota.length
    : null;
 
  const rBlank = ws.addRow([]);
  rBlank.height = 6;
 
  const rResumen = ws.addRow([
    null, null, null,
    `Total: ${estudiantes.length} | Con nota: ${conNota.length}` +
      (aprobados  !== null ? ` | Aprobados: ${aprobados}`   : "") +
      (reprobados !== null ? ` | Reprobados: ${reprobados}` : ""),
    promedio !== null ? Number(promedio.toFixed(2)) : null,
    null,
  ]);
  rResumen.height = 18;
  rResumen.getCell(4).font = { bold: true, size: 10, color: { argb: "FF" + GRIS_TEXTO } };
  rResumen.getCell(5).font = { bold: true, size: 11 };
  if (promedio !== null) rResumen.getCell(5).numFmt = "0.00";
 
  // ── Generar y descargar ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
 
  const hoy         = new Date().toISOString().slice(0, 10);
  const siglaLimpia = nombreMateria.split(" ")[0].replace(/[^a-zA-Z0-9-]/g, "");
  const parcialLimpio = nombreParcial.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
  const fileName    = `notas_${siglaLimpia}_${parcialLimpio}_${hoy}.xlsx`;
 
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}