import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { apiFetch } from "../../api/client";
import { ResumenNotas } from "./NotasResumen";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Materia {
  id_materia: string;
  sigla:      string;
  horario:    string | null;
  anio:       number | null;
}

interface Parcial {
  id_parcial:     string;
  nombre_parcial: string | null;
  fecha:          string | null;
  valoracion:     number | null;
  id_materia:     string;
}

interface Inscrito {
  id_estudiante: string;
  ci_estudiante: number;
  nombre:        string;
  apellido:      string;
}

interface EstadisticaMateria {
  materia:        Materia;
  parciales:      Parcial[];
  totalInscritos: number;
  inscritos:      Inscrito[];
  notasResumen:   Record<string, Record<string, number | null>>;
  stats: {
    id_parcial:  string;
    nombre:      string;
    valoracion:  number | null;
    aprobados:   number;
    reprobados:  number;
    sin_nota:    number;
  }[];
}

// ── Helper: id_usuario del token ──────────────────────────────────────────────

function getUsuarioId(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ?? null;
  } catch { return null; }
}

// ── Componente principal ──────────────────────────────────────────────────────

export function DocenteResumen() {
  const [data,    setData]    = useState<EstadisticaMateria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  // Calendario: mes actual
  const hoy    = new Date();
  const [calMes, setCalMes] = useState(hoy.getMonth());
  const [calAnio, setCalAnio] = useState(hoy.getFullYear());
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);

  useEffect(() => {
    const uid = getUsuarioId();
    if (!uid) { setError("No se pudo leer el token."); setLoading(false); return; }

    async function cargar() {
      try {
        // 1. Materias del docente
        const materias: Materia[] = await apiFetch.get("/parciales/mis-materias");
        if (materias.length === 0) { setData([]); return; }

        // 2. Para cada materia: parciales + inscritos + notas-resumen en paralelo
        const resultados = await Promise.all(
          materias.map(async m => {
            const [parciales, inscritos, notasResumen] = await Promise.all([
              apiFetch.get(`/parciales/${m.id_materia}`) as Promise<Parcial[]>,
              apiFetch.get(`/parciales/${m.id_materia}/estudiantes`) as Promise<any[]>,
              apiFetch.get(`/parciales/${m.id_materia}/notas-resumen`) as Promise<
                Record<string, Record<string, number | null>>
              >,
            ]);

            const totalInscritos = inscritos.length;

            // Por cada parcial calcular aprobados / reprobados / sin nota
            const stats = parciales.map(p => {
              let aprobados = 0, reprobados = 0, sin_nota = 0;
              inscritos.forEach(e => {
                const nota = notasResumen[e.id_estudiante]?.[p.id_parcial] ?? null;
                if (nota === null) {
                  sin_nota++;
                } else if (p.valoracion !== null && nota >= p.valoracion / 2) {
                  aprobados++;
                } else {
                  reprobados++;
                }
              });
              return {
                id_parcial:  p.id_parcial,
                nombre:      p.nombre_parcial ?? "Parcial",
                valoracion:  p.valoracion,
                aprobados,
                reprobados,
                sin_nota,
              };
            });

            return { materia: m, parciales, totalInscritos, stats, inscritos, notasResumen };
          })
        );

        setData(resultados);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, []);

  // ── Parciales futuros para el calendario ─────────────────────────────────
  const todosLosParciales: (Parcial & { sigla: string })[] = data.flatMap(d =>
    d.parciales
      .filter(p => p.fecha)
      .map(p => ({ ...p, sigla: d.materia.sigla }))
  );

  const parcialesMes = todosLosParciales.filter(p => {
    const f = new Date(p.fecha! + "T00:00:00");
    return f.getFullYear() === calAnio && f.getMonth() === calMes;
  });

  const parcialesPorDia: Record<number, typeof parcialesMes> = {};
  parcialesMes.forEach(p => {
    const dia = new Date(p.fecha! + "T00:00:00").getDate();
    if (!parcialesPorDia[dia]) parcialesPorDia[dia] = [];
    parcialesPorDia[dia].push(p);
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="dd-tab">
      <div className="dd-loading" style={{ marginTop: 48 }}>Cargando resumen…</div>
    </div>
  );

  if (error) return (
    <div className="dd-tab">
      <div className="dd-error">⚠ {error}</div>
    </div>
  );

  if (data.length === 0) return (
    <div className="dd-placeholder">
      <div className="dd-placeholder-icon">◈</div>
      <h2 className="dd-placeholder-title">Sin materias asignadas</h2>
      <p className="dd-placeholder-sub">Cuando tengas materias asignadas, aparecerán aquí.</p>
    </div>
  );

  // Si hay materia seleccionada, mostrar ResumenNotas
  if (materiaSeleccionada) {
    const sel = data.find(d => d.materia.id_materia === materiaSeleccionada);
    if (sel) {
      return (
        <ResumenNotas
          materia={sel.materia}
          parcialesDocente={sel.parciales}
          notasResumen={sel.notasResumen}
          inscritos={sel.inscritos}
          onVolver={() => setMateriaSeleccionada(null)}
        />
      );
    }
  }

  return (
    <div className="dd-tab" style={{ maxWidth: 1000 }}>
      <header className="dd-tab-header">
        <h1 className="dd-tab-title">Resumen</h1>
        <p className="dd-tab-sub">Vista general de tus materias, estudiantes y próximos parciales</p>
      </header>

      {/* ── Sección 1: Info de materias ─────────────────────────────────── */}
      <Section title="Mis materias" icon="📚">
        <div className="dr-materias-grid">
          {data.map(({ materia, parciales, totalInscritos }) => (
            <div
              key={materia.id_materia}
              className="dr-materia-card"
              onClick={() => setMateriaSeleccionada(materia.id_materia)}
              title="Ver notas de esta materia"
            >
              <div className="dr-materia-sigla">{materia.sigla}</div>
              <div className="dr-materia-meta">
                <span className="dr-meta-item">
                  <span className="dr-meta-icon">🕐</span>
                  {materia.horario ?? "—"}
                </span>
                <span className="dr-meta-item">
                  <span className="dr-meta-icon">📅</span>
                  {parciales.length} parcial{parciales.length !== 1 ? "es" : ""}
                </span>
                <span className="dr-meta-item">
                  <span className="dr-meta-icon">👥</span>
                  {totalInscritos} estudiante{totalInscritos !== 1 ? "s" : ""}
                </span>
                {materia.anio && (
                  <span className="dr-meta-item">
                    <span className="dr-meta-icon">🎓</span>
                    Año {materia.anio}
                  </span>
                )}
              </div>
              <div className="dr-materia-clic">Ver notas →</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Sección 2: Estadísticas con gráfica ────────────────────────── */}
      <Section title="Aprobados y reprobados" icon="📊">
        {data.map(({ materia, stats, totalInscritos }) =>
          stats.length === 0 ? null : (
            <div key={materia.id_materia} className="dr-stats-block">
              <div className="dr-stats-header">
                <span className="dd-sigla-badge">{materia.sigla}</span>
                <span className="dr-stats-sub">{totalInscritos} inscritos</span>
              </div>
              <div className="dr-stats-parciales">
                {stats.map(s => {
                  const total  = s.aprobados + s.reprobados + s.sin_nota;
                  const pctAp  = total > 0 ? Math.round((s.aprobados  / total) * 100) : 0;
                  const pctRe  = total > 0 ? Math.round((s.reprobados / total) * 100) : 0;
                  const pctSn  = total > 0 ? Math.round((s.sin_nota   / total) * 100) : 0;

                  const pieData = [
                    { name: "Aprobados",  value: s.aprobados,  pct: pctAp, color: "#34d399" },
                    { name: "Reprobados", value: s.reprobados, pct: pctRe, color: "#f87171" },
                    ...(s.sin_nota > 0
                      ? [{ name: "Sin nota", value: s.sin_nota, pct: pctSn, color: "#c5bdb2" }]
                      : []),
                  ].filter(d => d.value > 0);

                  const CustomTooltip = ({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="dr-tooltip">
                        <span className="dr-tooltip-label">{d.name}</span>
                        <span className="dr-tooltip-val">{d.value} ({d.pct}%)</span>
                      </div>
                    );
                  };

                  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
                    if (pct < 8) return null;
                    const RADIAN = Math.PI / 180;
                    const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
                    const x  = cx + r * Math.cos(-midAngle * RADIAN);
                    const y  = cy + r * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                        style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                        {pct}%
                      </text>
                    );
                  };

                  return (
                    <div key={s.id_parcial} className="dr-parcial-stat">
                      <div className="dr-parcial-nombre">
                        {s.nombre}
                        {s.valoracion != null && (
                          <span className="dd-val-badge" style={{ marginLeft: 8 }}>
                            {s.valoracion} pts
                          </span>
                        )}
                      </div>

                      {total === 0 ? (
                        <p className="dd-empty-text" style={{ padding: "8px 0" }}>Sin notas registradas.</p>
                      ) : (
                        <div className="dr-chart-row">
                          {/* Gráfica de pastel */}
                          <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={80}
                                paddingAngle={pieData.length > 1 ? 3 : 0}
                                dataKey="value"
                                labelLine={false}
                                label={CustomLabel}
                              >
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>

                          {/* Leyenda + contadores */}
                          <div className="dr-chart-legend">
                            {pieData.map(d => (
                              <div key={d.name} className="dr-legend-item">
                                <span className="dr-legend-dot" style={{ background: d.color }} />
                                <span className="dr-legend-name">{d.name}</span>
                                <span className="dr-legend-count">{d.value}</span>
                                <span className="dr-legend-pct">{d.pct}%</span>
                              </div>
                            ))}
                            <div className="dr-legend-total">
                              Total: {total} estudiante{total !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </Section>

      {/* ── Sección 3: Calendario de parciales ──────────────────────────── */}
      <Section title="Calendario de parciales" icon="🗓">
        <Calendario
          mes={calMes}
          anio={calAnio}
          parcialesPorDia={parcialesPorDia}
          onPrev={() => {
            if (calMes === 0) { setCalMes(11); setCalAnio(a => a - 1); }
            else setCalMes(m => m - 1);
          }}
          onNext={() => {
            if (calMes === 11) { setCalMes(0); setCalAnio(a => a + 1); }
            else setCalMes(m => m + 1);
          }}
        />

        {/* Lista de próximos parciales (futuros) */}
        <div className="dr-proximos">
          <div className="dr-proximos-title">Próximos parciales</div>
          {(() => {
            const futuros = todosLosParciales
              .filter(p => new Date(p.fecha! + "T00:00:00") >= new Date(hoy.toDateString()))
              .sort((a, b) => a.fecha!.localeCompare(b.fecha!))
              .slice(0, 6);

            if (futuros.length === 0) return (
              <p className="dd-empty-text">No hay parciales próximos.</p>
            );

            return futuros.map(p => {
              const f   = new Date(p.fecha! + "T00:00:00");
              const hoyDate = new Date(hoy.toDateString());
              const diff = Math.round((f.getTime() - hoyDate.getTime()) / 86400000);
              return (
                <div key={p.id_parcial} className="dr-proximo-item">
                  <div className="dr-proximo-fecha">
                    <span className="dr-proximo-dia">
                      {f.toLocaleDateString("es-BO", { day: "2-digit" })}
                    </span>
                    <span className="dr-proximo-mes">
                      {f.toLocaleDateString("es-BO", { month: "short" })}
                    </span>
                  </div>
                  <div className="dr-proximo-info">
                    <div className="dr-proximo-nombre">{p.nombre_parcial ?? "Parcial"}</div>
                    <div className="dr-proximo-meta">
                      <span className="dd-sigla-badge" style={{ fontSize: 10, padding: "1px 7px" }}>
                        {p.sigla}
                      </span>
                      {p.valoracion != null && (
                        <span style={{ fontSize: 12, color: "var(--clr-ink-3)" }}>
                          {p.valoracion} pts
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`dr-dias-chip ${diff === 0 ? "hoy" : diff <= 3 ? "urgente" : ""}`}>
                    {diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : `en ${diff}d`}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </Section>

    </div>
  );
}

// ── Sección wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string; icon: string; children: React.ReactNode;
}) {
  return (
    <div className="dr-section">
      <div className="dr-section-title">
        <span className="dr-section-icon">{icon}</span>
        {title}
      </div>
      <div className="dr-section-body">{children}</div>
    </div>
  );
}

// ── Calendario ────────────────────────────────────────────────────────────────

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];

function Calendario({
  mes, anio, parcialesPorDia, onPrev, onNext,
}: {
  mes:             number;
  anio:            number;
  parcialesPorDia: Record<number, any[]>;
  onPrev:          () => void;
  onNext:          () => void;
}) {
  const hoy         = new Date();
  const primerDia   = new Date(anio, mes, 1);
  // Lunes = 0 … Domingo = 6
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const diasEnMes   = new Date(anio, mes + 1, 0).getDate();

  const celdas: (number | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];
  // Completar a múltiplo de 7
  while (celdas.length % 7 !== 0) celdas.push(null);

  return (
    <div className="dr-cal">
      <div className="dr-cal-header">
        <button className="dr-cal-nav" onClick={onPrev}>‹</button>
        <span className="dr-cal-title">{MESES[mes]} {anio}</span>
        <button className="dr-cal-nav" onClick={onNext}>›</button>
      </div>

      <div className="dr-cal-grid">
        {DIAS.map(d => (
          <div key={d} className="dr-cal-dow">{d}</div>
        ))}
        {celdas.map((dia, i) => {
          const tieneParc = dia !== null && !!parcialesPorDia[dia];
          const esHoy     = dia !== null
            && dia === hoy.getDate()
            && mes === hoy.getMonth()
            && anio === hoy.getFullYear();

          return (
            <div
              key={i}
              className={`dr-cal-cell ${dia === null ? "empty" : ""} ${esHoy ? "hoy" : ""} ${tieneParc ? "con-parcial" : ""}`}
              title={tieneParc
                ? parcialesPorDia[dia!].map(p => `${p.sigla}: ${p.nombre_parcial ?? "Parcial"}`).join("\n")
                : undefined
              }
            >
              {dia !== null && <span className="dr-cal-num">{dia}</span>}
              {tieneParc && (
                <div className="dr-cal-dots">
                  {parcialesPorDia[dia!].slice(0, 3).map((p, j) => (
                    <span key={j} className="dr-cal-dot" title={p.sigla} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}