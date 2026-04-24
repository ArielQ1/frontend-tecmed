export function DashboardDocente() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
      
      {/* SIDEBAR: Selector de Materias */}
      <div className="w-full lg:w-72 bg-slate-900 text-slate-300 p-6 flex flex-col shadow-xl">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-800 rounded-lg flex items-center justify-center text-white font-bold">UM</div>
          <h1 className="text-white font-bold tracking-tight">TECMED Portal</h1>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Mis Materias</p>
        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 p-3 bg-red-800/10 text-white border-l-4 border-red-800 rounded-r-xl transition-all">
            <span>🔬</span> <span className="text-sm font-medium">Bioquímica I</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all">
            <span>🧬</span> <span className="text-sm font-medium">Genética Humana</span>
          </button>
          <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-xl transition-all">
            <span>🧪</span> <span className="text-sm font-medium">Laboratorio Clínico</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xs">LG</div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Lic. Gómez</p>
              <p className="text-[10px] text-slate-500 mt-1">Docente Titular</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
        
        {/* Header de la Materia */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Bioquímica I</h2>
            <p className="text-slate-500 font-medium italic">Paralelo "A" • Gestión 2026</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
              📥 Exportar Lista
            </button>
            <button className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-700 transition-all">
              ➕ Registrar Nota
            </button>
          </div>
        </div>

        {/* SECCIÓN DE ESTADÍSTICAS (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase">Promedio Grupal</p>
              <span className="text-green-500 bg-green-50 text-[10px] px-2 py-1 rounded-lg font-bold">+5% vs 2025</span>
            </div>
            <p className="text-4xl font-black text-slate-800">76.4</p>
            <div className="w-full bg-slate-100 h-2 mt-4 rounded-full overflow-hidden">
               <div className="bg-green-500 h-full w-[76%]"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <p className="text-xs font-bold text-slate-400 uppercase mb-4">Distribución de Notas</p>
             <div className="flex items-end gap-2 h-16">
                <div className="flex-1 bg-red-100 rounded-t-lg h-[20%] group relative"><span className="hidden group-hover:block absolute -top-6 text-[10px] w-full text-center">20%</span></div>
                <div className="flex-1 bg-amber-200 rounded-t-lg h-[40%] group relative"></div>
                <div className="flex-1 bg-blue-300 rounded-t-lg h-[80%] group relative"></div>
                <div className="flex-1 bg-green-400 rounded-t-lg h-[65%] group relative"></div>
             </div>
             <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-2 uppercase">
                <span>Insuf.</span><span>Reg.</span><span>Bueno</span><span>Excel.</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Asistencia Total</p>
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeDasharray="100, 100" strokeWidth="3" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-red-800" strokeDasharray="92, 100" strokeWidth="3" strokeLinecap="round" fill="none" stroke="currentColor" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">92%</span>
               </div>
               <div>
                  <p className="text-xl font-bold text-slate-800">Muy Alta</p>
                  <p className="text-[10px] text-slate-500 leading-tight">La mayoría de los estudiantes asisten regularmente.</p>
               </div>
            </div>
          </div>
        </div>

        {/* LISTA DE ESTUDIANTES */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Nómina de Estudiantes</h3>
            <div className="relative">
               <input 
                type="text" 
                placeholder="Buscar por nombre o CI..." 
                className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-800 outline-none w-64"
               />
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs">🔍</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">Estudiante</th>
                  <th className="px-6 py-4">Nro. Matrícula</th>
                  <th className="px-6 py-4">P1</th>
                  <th className="px-6 py-4">P2</th>
                  <th className="px-6 py-4">P3</th>
                  <th className="px-6 py-4 text-red-800">Final</th>
                  <th className="px-6 py-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400">01</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">Alvarado, Maria Fernanda</p>
                    <p className="text-[10px] text-slate-500">mar.alvarado@est.umsa.bo</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">1829302</td>
                  <td className="px-6 py-4 font-medium">85</td>
                  <td className="px-6 py-4 font-medium">78</td>
                  <td className="px-6 py-4 font-medium">92</td>
                  <td className="px-6 py-4 font-bold text-red-900 bg-red-50/30">80</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">VIGENTE</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400">02</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">Calle, Juan Carlos</p>
                    <p className="text-[10px] text-slate-500">jc.calle@est.umsa.bo</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">1928374</td>
                  <td className="px-6 py-4 font-medium">60</td>
                  <td className="px-6 py-4 font-medium">55</td>
                  <td className="px-6 py-4 font-medium">68</td>
                  <td className="px-6 py-4 font-bold text-red-900 bg-red-50/30">58</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold">EN RIESGO</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}