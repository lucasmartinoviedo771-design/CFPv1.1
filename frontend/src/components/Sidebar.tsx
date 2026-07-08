import React, { useState, useEffect, useContext } from 'react';
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
  Calendar,
  Layers,
  UserCog,
  ChevronDown,
  ChevronRight,
  Database,
  FileCheck,
  ExternalLink,
  Gamepad2
} from 'lucide-react';
import { cn } from './UI';
import { UserContext, ActivePanelContext } from '../App';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
}

const dataItems: MenuItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
  { label: 'Histórico por Cursos', icon: <BarChart2 size={20} />, href: '/historico-cursos' },
  { label: 'Histórico por Estudiante', icon: <Users size={20} />, href: '/historico-estudiante' },
  { label: 'Egresados', icon: <GraduationCap size={20} />, href: '/egresados' },
];

const calificacionesItems: MenuItem[] = [
  { label: 'Notas / Equivalencias', icon: <ClipboardList size={20} />, href: '/notas' },
];

const adminCursosItems: MenuItem[] = [
  { label: 'Estructura Académica', icon: <GitBranch size={20} />, href: '/estructura' },
  { label: 'Calendario Académico', icon: <Calendar size={20} />, href: '/calendario' },
  { label: 'Cohortes', icon: <Layers size={20} />, href: '/cohortes' },
  { label: 'Horarios de Cursada', icon: <Calendar size={20} />, href: '/horarios-cursada' },
  { label: 'Gráfico de Cursos', icon: <BarChart2 size={20} />, href: '/grafico-cursos' },
];

const secretariaItems: MenuItem[] = [
  { label: 'Usuarios', icon: <UserCog size={20} />, href: '/usuarios' },
];

interface MenuSectionProps {
  title: string;
  icon: React.ReactNode;
  items: MenuItem[];
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
}

// Componente para items de menú
const MenuSection = ({ title, icon, items, isOpen, onToggle, currentPath }: MenuSectionProps) => {
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
  const { user } = useContext(UserContext);
  const { activePanel } = useContext(ActivePanelContext);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const userGroups = user?.groups || [];
  const isSuper = user?.is_superuser || user?.is_staff;
  
  const hasVideojuegos = isSuper || userGroups.includes("Videojuegos") || userGroups.some(g => ['Admin', 'Secretaría', 'Regencia', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel', 'Rector'].includes(g));
  
  // Isolation: User exclusively belongs to the "Videojuegos" group
  const isOnlyVideojuegos = !isSuper && userGroups.includes("Videojuegos") && !userGroups.some(g => ['Admin', 'Secretaría', 'Regencia', 'Rector', 'Terciario', 'Coordinación Docente', 'Docente', 'Preceptor', 'Bedel'].includes(g));

  const cargaDatosItems: MenuItem[] = [
    { label: 'Estudiantes', icon: <Users size={20} />, href: '/estudiantes' },
    { label: 'Inscripciones', icon: <FileText size={20} />, href: '/inscripciones' },
    { label: 'Asistencia', icon: <CheckSquare size={20} />, href: '/asistencia' },
  ];

  const preinscripcionesItems: MenuItem[] = [
    { label: 'Preinscripciones CFP', icon: <ClipboardList size={20} />, href: '/gestion-preinscripciones' },
    { label: 'Preinscripciones Terciario', icon: <GraduationCap size={20} />, href: '/preinscripciones-terciario' },
    ...(hasVideojuegos ? [{ label: 'Preinscripciones Video Juegos', icon: <Gamepad2 size={20} />, href: '/admin-videojuegos?tab=preinscripciones' }] : []),
  ];

  const paginasPreinscripcionItems: MenuItem[] = [
    ...(!isOnlyVideojuegos ? [{ label: 'Página de Preinscripción', icon: <FileCheck size={20} />, href: '/preinscripcion' }] : []),
    ...(hasVideojuegos ? [{ label: 'Preinscripción Videojuegos', icon: <Gamepad2 size={20} />, href: '/preinscripcion-videojuegos' }] : []),
    ...(!isOnlyVideojuegos ? [{ label: 'Preinscripción Terciario', icon: <GraduationCap size={20} />, href: '/preinscripcion-terciario' }] : []),
  ];

  const filteredPreinscripciones = preinscripcionesItems.filter(item => {
    if (activePanel === 'terciario') {
      return item.href === '/preinscripciones-terciario';
    }
    return true;
  });

  useEffect(() => {
    const currentPath = location.pathname;
    if (dataItems.some(item => item.href === currentPath)) setOpenSection('datos');
    else if (cargaDatosItems.some(item => item.href === currentPath)) setOpenSection('carga');
    else if (preinscripcionesItems.some(item => item.href === currentPath)) setOpenSection('preinscripciones');
    else if (paginasPreinscripcionItems.some(item => item.href === currentPath)) setOpenSection('paginasPreinscripciones');
    else if (calificacionesItems.some(item => item.href === currentPath)) setOpenSection('calificaciones');
    else if (adminCursosItems.some(item => item.href === currentPath)) setOpenSection('admin');
    else if (secretariaItems.some(item => item.href === currentPath)) setOpenSection('secretaria');
  }, [location.pathname]);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <aside className="w-64 flex flex-col h-screen bg-indigo-950/20 backdrop-blur-md border-r border-indigo-500/20">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-2xl font-bold text-white">CFP</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Malvinas Argentinas</h1>
            <p className="text-sm font-semibold text-indigo-300 leading-tight">Gestión Académica</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin scrollbar-thumb-indigo-900">
        {paginasPreinscripcionItems.length > 0 && (
          <MenuSection
            title="Páginas de Preinscripciones"
            icon={<FileCheck size={20} />}
            items={paginasPreinscripcionItems}
            isOpen={openSection === 'paginasPreinscripciones'}
            onToggle={() => toggleSection('paginasPreinscripciones')}
            currentPath={location.pathname}
          />
        )}

        {!isOnlyVideojuegos && (
          <>
            <MenuSection
              title="Confirmar Estudiantes"
              icon={<ClipboardList size={20} />}
              items={filteredPreinscripciones}
              isOpen={openSection === 'preinscripciones'}
              onToggle={() => toggleSection('preinscripciones')}
              currentPath={location.pathname}
            />

            <Link
              to="/confirmar-bloques"
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors mb-2",
                location.pathname === '/confirmar-bloques'
                  ? "bg-brand-accent text-white shadow-[0_0_10px_rgba(255,102,0,0.3)]"
                  : "text-indigo-200 hover:text-white hover:bg-white/5"
              )}
            >
              <Layers size={20} />
              <span>Confirmar Bloques</span>
            </Link>
            {activePanel === 'cfp' && (
              <>
                <MenuSection
                  title="Dashboard"
                  icon={<Database size={20} />}
                  items={dataItems}
                  isOpen={openSection === 'datos'}
                  onToggle={() => toggleSection('datos')}
                  currentPath={location.pathname}
                />
                <MenuSection
                  title="Estudiantes"
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
                  title="Crear Estructura"
                  icon={<UserCog size={20} />}
                  items={adminCursosItems}
                  isOpen={openSection === 'admin'}
                  onToggle={() => toggleSection('admin')}
                  currentPath={location.pathname}
                />
                <MenuSection
                  title="Crear Usuario"
                  icon={<Users size={20} />}
                  items={secretariaItems}
                  isOpen={openSection === 'secretaria'}
                  onToggle={() => toggleSection('secretaria')}
                  currentPath={location.pathname}
                />
              </>
            )}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-indigo-500/20">
        <p className="text-sm text-center text-white font-medium">
          estudiantes.cfp@malvinastdf.edu.ar
        </p>
      </div>
    </aside>
  );
}
