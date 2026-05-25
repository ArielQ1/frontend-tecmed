// ── Types compartidos de DocenteParciales ─────────────────────────────────────

import type { DatosNotas } from "../DocenteLayout";

export interface Materia {
  id_materia: string;
  sigla:      string;
  nombre_materia: string;
  horario:    string | null;
  anio:       number | null;

}

export interface Estudiante {
  id_estudiante: string;
  nombre_completo: string;
  ci_estudiante: number;
}

/** Parcial normal o hijo de un grupal */
export interface Parcial {
  id_parcial:     string;
  nombre_parcial: string | null;
  fecha:          string | null;
  valoracion:     number | null;
  id_materia:     string;
  tipo:           "parcial" | "grupal" | string;
  parcial_grupal: string;  // UUID del padre si es hijo
}

/** Parcial grupal padre con sus hijos embebidos (respuesta del GET) */
export interface ParcialGrupal extends Parcial {
  tipo:  "grupal";
  hijos: Parcial[];
}

export type ItemLista = Parcial | ParcialGrupal;

export function esGrupal(p: ItemLista): p is ParcialGrupal {
  return p.tipo === "grupal";
}

export type ModalState =
  | { type: "none" }
  | { type: "create";       materia: Materia }
  | { type: "create-hijo";  materia: Materia; padre: ParcialGrupal }
  | { type: "edit";         materia: Materia; parcial: Parcial }
  | { type: "delete";       materia: Materia; parcial: Parcial; esGrupalPadre?: boolean };

export interface DocenteParcialesProps {
  onVerNotas: (datos: DatosNotas) => void;
}

// ── Helpers de DocenteParciales ───────────────────────────────────────────────

/** Devuelve true si han pasado más de 10 días desde la fecha del parcial. */
export function esBloqueado(fecha: string | null): boolean {
  if (!fecha) return false;
  return (Date.now() - new Date(fecha + "T00:00:00").getTime()) / 86400000 > 10;
}

/** Formatea una fecha ISO a "DD MMM YYYY" en español-BO. */
export function fmtFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}