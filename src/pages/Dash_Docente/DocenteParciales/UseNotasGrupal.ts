// ── useNotasGrupal ────────────────────────────────────────────────────────────
//
// Dado un parcial hijo (con parcial_grupal = id del padre), después de que el
// docente guarda una nota en el hijo, este hook la replica automáticamente
// al parcial grupal padre.
//
// Uso:
//   const { sincronizar, sincronizando } = useNotasGrupal(id_materia);
//   // Llama tras guardar una nota en un hijo:
//   await sincronizar(id_parcial_padre, id_estudiante, nota);

import { useState, useCallback } from "react";
import { apiFetch } from "../../../api/client";

interface SincronizarArgs {
  id_parcial_padre: string;
  id_estudiante:    string;
  nota:             number | null;
  observacion?:     string | null;
}

export function useNotasGrupal() {
  const [sincronizando, setSincronizando] = useState(false);
  const [errorSync,     setErrorSync]     = useState<string | null>(null);

  /**
   * Copia la nota de un sub-parcial al parcial grupal padre.
   * Si el padre ya tiene una nota para ese estudiante, la sobreescribe.
   * Si no tiene registro, lo crea.
   *
   * El endpoint esperado es el mismo PATCH de notas:
   *   PATCH /notas/usuarios/{id_usuario}/parciales/{id_parcial}/notas/{id_estudiante}
   * pero usando el id del parcial padre en lugar del hijo.
   *
   * Ajusta la URL si tu backend usa una ruta distinta.
   */
  const sincronizar = useCallback(async ({
    id_parcial_padre,
    id_estudiante,
    nota,
    observacion,
  }: SincronizarArgs): Promise<boolean> => {
    setSincronizando(true);
    setErrorSync(null);
    try {
      // La ruta de editar nota en el padre es la misma que en cualquier parcial
      await apiFetch.patch(
        `/parciales/notas/${id_parcial_padre}/${id_estudiante}`,
        { nota, observacion: observacion ?? null },
      );
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al sincronizar nota con el grupal";
      setErrorSync(msg);
      return false;
    } finally {
      setSincronizando(false);
    }
  }, []);

  return { sincronizar, sincronizando, errorSync };
}