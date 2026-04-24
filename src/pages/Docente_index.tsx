import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router';

export function PortalDocente() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMateria, setSelectedMateria] = useState('');

  // Función para cerrar sesión
  const handleLogout = () => {
    // Aquí iría tu lógica de logout (limpiar tokens, etc.)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Items del menú
  const menuItems = [
    { id: 'cargar-notas', label: 'Cargar Notas', icon: '📝', path: '/docente/cargar-notas' },
    { id: 'mis-cursos', label: 'Mis Cursos', icon: '📚', path: '/docente/mis-cursos' },
    { id: 'reportes', label: 'Reportes', icon: '📊', path: '/docente/reportes' },
    { id: 'estudiantes', label: 'Estudiantes', icon: '👥', path: '/docente/estudiantes' },
    { id: 'perfil', label: 'Mi Perfil', icon: '👤', path: '/docente/perfil' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex">
      
      {/* ========== MENÚ LATERAL IZQUIERDO ========== */}
      <aside className="w-72 bg-white shadow-xl border-r border-slate-200 flex flex-col fixed h-full z-10">
        
        {/* Logo y título */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo-tecomed.png" alt="TEC MEDIC" className="w-10 h-10 object-contain" />
            <h1 className="text-xl font-bold text-slate-700">
              TECMED <span className="text-red-800">Notas</span>
            </h1>
          </div>
          
          {/* Información del docente */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-800 font-bold text-lg">
                D
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Dra. María González</p>
                <p className="text-xs text-slate-500">ID: DOC-2024-001</p>
                <p className="text-xs text-slate-500">Tecnología Médica</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-3">
            Navegación Principal
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-red-50 text-red-800 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-red-700'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                  {location.pathname === item.path && (
                    <span className="ml-auto w-1.5 h-1.5 bg-red-800 rounded-full"></span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección de ayuda */}
        <div className="p-4 border-t border-slate-200">
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-sm">💡</span>
              <div>
                <p className="text-xs font-bold text-blue-900">¿Necesitas ayuda?</p>
                <p className="text-[10px] text-blue-700 mt-1">
                  Consulta la guía de usuario o contacta al soporte técnico.
                </p>
                <button className="mt-2 text-[10px] font-bold text-blue-800 underline">
                  Soporte →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Logout */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-700 hover:bg-red-50 transition-all duration-200 group"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm font-medium">Cerrar Sesión</span>
            <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              ↵
            </span>
          </button>
          
          {/* Información de versión */}
          <p className="text-[9px] text-slate-400 text-center mt-4">
            Versión 2.0.0 © 2026 UMSA
          </p>
        </div>
      </aside>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <main className="flex-1 ml-72">
        <div className="p-4 lg:p-8">
          
          {/* Header superior (opcional, simplificado) */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {menuItems.find(item => item.path === location.pathname)?.label || 'Panel Docente'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Bienvenida/o al sistema de gestión académica
                </p>
              </div>
              
              {/* Indicador de período académico */}
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-sm">
                <p className="text-xs text-slate-500">Período Académico</p>
                <p className="text-sm font-bold text-slate-700">Gestión I/2026</p>
              </div>
            </div>
          </div>

          {/* Contenido dinámico según la ruta */}
          <div className="max-w-7xl mx-auto">
            {location.pathname === '/docente/cargar-notas' && (
              // Aquí va el contenido de carga de notas que ya tenías
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                {/* Tu componente existente de carga de notas */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="p-2 bg-red-50 text-red-800 rounded-lg text-xl">📄</span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Carga de Notas</h2>
                    <p className="text-sm text-slate-500">Cargue el archivo con las calificaciones de sus estudiantes.</p>
                  </div>
                </div>

                <div className="flex flex-col flex-1">
                  <button className="flex items-center gap-2 text-sm font-bold text-red-800 hover:text-red-900 transition-colors mb-6 group w-fit">
                    <span className="group-hover:underline">Descargar Plantilla Excel (Lista de Estudiantes)</span>
                  </button>

                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center group hover:border-red-800/40 hover:bg-red-50/20 transition-all cursor-pointer">
                    <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <span className="text-4xl text-red-800">📁</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Arrastre y suelte su archivo aquí</h3>
                    <p className="text-sm text-slate-400 mb-8 max-w-xs">
                      Formatos aceptados: .CSV, .XLSX, .XLS <br />
                      Tamaño máximo: 10MB
                    </p>

                    <button className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2">
                      <span>📁</span> Seleccionar Excel
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
                  <p className="uppercase font-medium tracking-widest">© 2026 UMSA • Tecnología Médica</p>
                  <div className="flex gap-4">
                    <a href="#" className="hover:text-red-800 underline">Guía de usuario</a>
                    <a href="#" className="hover:text-red-800 underline">Reportar problema</a>
                  </div>
                </div>
              </div>
            )}

            {location.pathname === '/docente/mis-cursos' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Mis Cursos</h2>
                <div className="space-y-4">
                  {/* Aquí iría la lista de cursos del docente */}
                  <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-700">Anatomía I - Paralelo A</h3>
                    <p className="text-sm text-slate-500">Lunes y Miércoles • 08:00 - 10:00</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-slate-700">Fisiología Humana - Paralelo B</h3>
                    <p className="text-sm text-slate-500">Martes y Jueves • 10:00 - 12:00</p>
                  </div>
                </div>
              </div>
            )}

            {location.pathname === '/docente/reportes' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Reportes Académicos</h2>
                <p className="text-slate-500">Aquí se mostrarán los reportes de rendimiento académico.</p>
              </div>
            )}

            {location.pathname === '/docente/estudiantes' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Lista de Estudiantes</h2>
                <p className="text-slate-500">Gestión de estudiantes por materia.</p>
              </div>
            )}

            {location.pathname === '/docente/perfil' && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Mi Perfil</h2>
                <p className="text-slate-500">Configuración y datos personales.</p>
              </div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}