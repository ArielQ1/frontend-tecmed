export function PortalEstudiante() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800">
      
      {/* Header Superior */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Consulta de Calificaciones
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gestión Académica 2026</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pr-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-10 h-10 bg-red-900 rounded-xl flex items-center justify-center text-white font-bold">E</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Estudiante</p>
            <p className="text-sm font-bold text-slate-700">Portal Universitario</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
        
        {/* PANEL IZQUIERDO: Buscador y Filtros */}
        <div className="w-full lg:w-80 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span>🔍</span> Buscar Historial
          </h2>
          
          <div className="space-y-5">
            {/* Campo C.I. */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Número de Carnet (CI)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej. 1234567"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-800 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Campo Matrícula */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                Número de Matrícula
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Ej. 182736"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-800 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button className="w-full bg-red-900 hover:bg-red-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 mt-4">
              Consultar Resultados
            </button>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-[10px] text-amber-700 leading-relaxed italic">
              * Si tiene problemas con su acceso, contacte a soporte técnico o diríjase a kárdex de su facultad.
            </p>
          </div>
        </div>

        {/* PANEL DERECHO: Resultados de Materias */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-slate-700">Materias Encontradas (3)</h3>
            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              GESTIÓN 2026
            </span>
          </div>

          {/* Card Materia: Bioquímica */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl border border-slate-100">
                  Σ
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">BIO - 101 Bioquímica</h4>
                  <p className="text-xs text-slate-500">Paralelo "A" • Lic. Gómez</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Estado</p>
                <p className="text-sm font-bold text-green-600">Aprobado</p>
              </div>
            </div>

            {/* Grid de Calificaciones */}
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">1er Parcial</p>
                <p className="text-2xl font-black text-slate-700">85</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">2do Parcial</p>
                <p className="text-2xl font-black text-slate-700">72</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">3er Parcial</p>
                <p className="text-2xl font-black text-slate-700">90</p>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl text-center border border-red-100">
                <p className="text-[10px] font-bold text-red-800/60 uppercase mb-1">Final</p>
                <p className="text-2xl font-black text-red-900">78</p>
              </div>
            </div>

            {/* Observaciones */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-slate-300">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 italic">Observaciones del docente</p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Buen desempeño en las prácticas de laboratorio. Continuar con la misma dedicación."
                </p>
              </div>
            </div>
          </div>

          {/* Otras materias en formato lista compacta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚑</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Primeros Auxilios</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Promedio: 65</p>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-slate-600 transition-colors">❯</button>
             </div>

             <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔬</span>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Histología</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Promedio: 92</p>
                  </div>
                </div>
                <button className="text-slate-300 hover:text-slate-600 transition-colors">❯</button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}