export function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-slate-800">

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12">
        
{/* Izquierda*/}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
          <p className="text-sm font-bold text-slate-600 tracking-tighter">
            FACULTAD DE MEDICINA
          </p>
          <p className="text-[10px] text-red-600 font-medium -mt-1">
            TECNOLOGÍA MÉDICA - UMSA
          </p>
          
          <div className="w-40 h-40 lg:w-56 lg:h-56 my-8 bg-white rounded-full shadow-md flex items-center justify-center border border-slate-100 p-4">
            <img 
              src="#" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-700 leading-tight">Sistema de <br />
            <span className="text-red-800">Gestión Académica</span>
          </h1>
          <div className="w-16 h-1 bg-red-800 mt-4 rounded-full"></div>
          
          <p className="mt-6 text-slate-500 max-w-md hidden lg:block text-lg">
            Bienvenido al portal oficial de notas y gestión de la carrera de Tecnología Médica. 
            Acceda a su información académica de manera rápida y segura.
          </p>
        </div>

{/* Derecha */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 lg:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
            <p className="text-slate-500 mt-2">Seleccione su perfil para continuar</p>
          </div>

          <div className="space-y-5">
      {/* Docente Boton */}
            <button className="w-full flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-slate-800 hover:bg-slate-50 transition-all group shadow-sm">
              <div className="bg-slate-800 p-4 rounded-xl text-white">
                <div className="w-6 h-6 flex items-center justify-center font-bold">D</div>
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="font-bold text-lg text-slate-800 leading-none">Soy Docente</p>
                <p className="text-sm text-slate-500 mt-1">Gestionar notas y asistencias</p>
              </div>
              <span className="text-slate-300 group-hover:text-slate-800 group-hover:translate-x-1 transition-all">❯</span>
            </button>

      {/*Estudiante Boton */}
            <button className="w-full flex items-center p-5 border-2 border-slate-100 rounded-2xl hover:border-red-900 hover:bg-red-50 transition-all group shadow-sm">
              <div className="bg-red-900 p-4 rounded-xl text-white">
                <div className="w-6 h-6 flex items-center justify-center font-bold">Est</div>
              </div>
              <div className="ml-5 text-left flex-1">
                <p className="font-bold text-lg text-red-900 leading-none">Soy Estudiante</p>
                <p className="text-sm text-slate-500 mt-1">Consultar historial y calificaciones</p>
              </div>
              <span className="text-red-200 group-hover:text-red-900 group-hover:translate-x-1 transition-all">❯</span>
            </button>
          </div>

{/* Abajito */}
          <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col gap-3">
            <div className="flex gap-4 justify-center text-[11px] text-slate-400 font-medium">
              <a href="#" className="hover:text-slate-600 transition-colors">TÉRMINOS</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-600 transition-colors">SOPORTE</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-600 transition-colors">CONTACTO</a>
            </div>
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
              © 2026 Tecnología Médica UMSA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}