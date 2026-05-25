// Barrel — importa todo desde un solo lugar:
// import { DocenteParciales } from "./DocenteParciales";

export { DocenteParciales } from "./DocenteParciales";
export { FilaParcial, FilaHijo } from "./FilaParcial";
export { ParcialModal } from "./ParcialModal";
export { ParcialHijoModal } from "./ParcialHijoModal";
export { DeleteModal } from "./DeleteModal"
export { useNotasGrupal }     from "./UseNotasGrupal";
export type { Materia, Parcial, ParcialGrupal, ItemLista, ModalState } from "./Types";
export { esGrupal, esBloqueado, fmtFecha } from "./Types";