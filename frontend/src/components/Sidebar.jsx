import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart2,
  Users,
  GraduationCap,
  FileText,
  CheckSquare,
  ClipboardList,
  GitBranch,
  BookOpen,
  Calendar,
  Layers,
  UserCog,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from './UI'; // Asumimos que podemos usar cn de UI o directamente

const dataItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { label: 'Histórico por Cursos', icon: <BarChart2 size={20} />, href: '/historico-cursos' },
  { label: 'Histórico por Estudiante', icon: <Users size={20} />, href: '/historico-estudiante' },
  { label: 'Egresados', icon: <GraduationCap size={20} />, href: '/egresados' },
];

const cargaDatosItems = [
  { label: 'Estudiantes', icon: <Users size={20} />, href: '/estudiantes' },
  { label: 'Inscripciones', icon: <FileText size={20} />, href: '/inscripciones' },
  { label: 'Asistencia', icon: <CheckSquare size={20} />, href: '/asistencia' },
];

const calificacionesItems = [
  { label: 'Notas / Equivalencias', icon: <ClipboardList size={20} />, href: '/notas' },
];

const adminCursosItems = [
  { label: 'Estructura Académica', icon: <GitBranch size={20} />, href: '/estructura' },
  { label: 'Programas', icon: <BookOpen size={20} />, href: '/programas' },
  { label: 'Calendario Académico', icon: <Calendar size={20} />, href: '/calendario' },
  { label: 'Cohortes', icon: <Layers size={20} />, href: '/cohortes' },
  { label: 'Gráfico de Cursos', icon: <BarChart2 size={20} />, href: '/grafico-cursos' },
];

const secretariaItems = [
  { label: 'Usuarios', icon: <UserCog size={20} />, href: '/usuarios' },
];

// Componente para items de menú
const MenuSection = ({ title, icon, items, isOpen, onToggle, currentPath }) => {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors rounded-lg group",
          isOpen
            ? "bg-indigo-900/40 text-white"
            : "text-indigo-200 hover:text-white hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 space-y-1 border-l-2 border-indigo-500/20 pl-2">
          {items.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors",
                  isActive
                    ? "bg-brand-accent text-white shadow-[0_0_10px_rgba(255,102,0,0.3)]"
                    : "text-indigo-300 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const location = useLocation();
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    const currentPath = location.pathname;
    if (dataItems.some(item => item.href === currentPath)) setOpenSection('datos');
    else if (cargaDatosItems.some(item => item.href === currentPath)) setOpenSection('carga');
    else if (calificacionesItems.some(item => item.href === currentPath)) setOpenSection('calificaciones');
    else if (adminCursosItems.some(item => item.href === currentPath)) setOpenSection('admin');
    else if (secretariaItems.some(item => item.href === currentPath)) setOpenSection('secretaria');
  }, [location.pathname]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <aside className="w-64 flex flex-col h-screen bg-indigo-950/20 backdrop-blur-md border-r border-indigo-500/20">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-xl font-bold text-white">C3</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CFP Admin</h1>
            <p className="text-xs text-indigo-300">Gestión Académica</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin scrollbar-thumb-indigo-900">
        <MenuSection
          title="Datos"
          icon={<Database size={20} />}
          items={dataItems}
          isOpen={openSection === 'datos'}
          onToggle={() => toggleSection('datos')}
          currentPath={location.pathname}
        />
        <MenuSection
          title="Carga de Datos"
          icon={<FileText size={20} />}
          items={cargaDatosItems}
          isOpen={openSection === 'carga'}
          onToggle={() => toggleSection('carga')}
          currentPath={location.pathname}
        />
        <MenuSection
          title="Calificaciones"
          icon={<ClipboardList size={20} />}
          items={calificacionesItems}
          isOpen={openSection === 'calificaciones'}
          onToggle={() => toggleSection('calificaciones')}
          currentPath={location.pathname}
        />
        <MenuSection
          title="Administración"
          icon={<UserCog size={20} />}
          items={adminCursosItems}
          isOpen={openSection === 'admin'}
          onToggle={() => toggleSection('admin')}
          currentPath={location.pathname}
        />
        <MenuSection
          title="Secretaría"
          icon={<Users size={20} />}
          items={secretariaItems}
          isOpen={openSection === 'secretaria'}
          onToggle={() => toggleSection('secretaria')}
          currentPath={location.pathname}
        />
      </nav>

      <div className="p-4 border-t border-indigo-500/20">
        <p className="text-xs text-center text-indigo-400 opacity-60">
          &copy; 2025 Code 3 System
        </p>
      </div>
    </aside>
  );
}
