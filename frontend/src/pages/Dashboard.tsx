import React, { useEffect, useState, useMemo } from 'react';
import { Select } from '../components/UI';
import {
  Users,
  GraduationCap,
  Award,
  Clock,
  BookOpen,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Search,
  School,
} from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import { listProgramas } from '../services/programasService';
import api from '../api/client';
import type { Programa, Bloque, Cohorte } from '../api/types';
import type {
  ExtendedDashboardStats,
  ProgramBreakdownItem,
} from '../components/Dashboard/types';
import KPICard from '../components/Dashboard/KPICard';
import DashboardModal from '../components/Dashboard/DashboardModal';
import ActiveGraduatedModalContent from '../components/Dashboard/ActiveGraduatedModalContent';
import PassRateModalContent from '../components/Dashboard/PassRateModalContent';
import HorizontalBarList from '../components/Dashboard/HorizontalBarList';
import TerritorialMap from '../components/Dashboard/TerritorialMap';
import FirstEntryTable from '../components/Dashboard/FirstEntryTable';
import CrossMatrixTable from '../components/Dashboard/CrossMatrixTable';
import AuditableRecordsTable from '../components/Dashboard/AuditableRecordsTable';
import SexDistributionWidget from '../components/Dashboard/SexDistributionWidget';

type ModalType = 'activos' | 'egresados' | 'aprobacion' | null;

export default function Dashboard() {
  const [stats, setStats] = useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Opciones maestras
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);

  // Filtros interactivos
  const [programaId, setProgramaId] = useState<string>('');
  const [bloqueId, setBloqueId] = useState<string>('');
  const [cohorteId, setCohorteId] = useState<string>('');
  const [localidad, setLocalidad] = useState<string>('');
  const [nivelEducativo, setNivelEducativo] = useState<string>('');
  const [estado, setEstado] = useState<string>('');
  const [sexo, setSexo] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Modales
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [selectedProgramData, setSelectedProgramData] = useState<ProgramBreakdownItem | null>(null);

  // Cargar lista de programas inicial
  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (err: unknown) {
        console.error('Error cargando programas para dashboard:', err);
      }
    })();
  }, []);

  // Cargar bloques y cohortes dependientes del programa
  useEffect(() => {
    (async () => {
      try {
        const [bloquesRes, cohortesRes] = await Promise.all([
          api.get<Bloque[]>('/bloques', { params: { programa_id: programaId || undefined } }),
          api.get<Cohorte[]>('/inscripciones/cohortes', { params: { programa_id: programaId || undefined } }),
        ]);
        setBloques(Array.isArray(bloquesRes.data) ? bloquesRes.data : []);
        setCohortes(Array.isArray(cohortesRes.data) ? cohortesRes.data : []);
      } catch (err: unknown) {
        console.error('Error cargando bloques/cohortes para dashboard:', err);
      }
    })();
  }, [programaId]);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!stats) setLoading(true);
      else setTableLoading(true);
      setError(null);

      try {
        const params: Record<string, unknown> = {
          programa_id: programaId ? Number(programaId) : undefined,
          bloque_id: bloqueId ? Number(bloqueId) : undefined,
          cohorte_id: cohorteId ? Number(cohorteId) : undefined,
          year: selectedYear || undefined,
          month: selectedMonth || undefined,
          localidad: localidad || undefined,
          nivel_educativo: nivelEducativo || undefined,
          estado: estado || undefined,
          sexo: sexo || undefined,
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
          search: searchQuery.trim() || undefined,
          page: page,
          page_size: 50,
        };

        const response = await getDashboardStats(params);
        if (!mounted) return;
        setStats(response);
      } catch (err: unknown) {
        console.error('Error cargando métricas del dashboard:', err);
        if (mounted) setError('No pudimos cargar las métricas del dashboard.');
      } finally {
        if (mounted) {
          setLoading(false);
          setTableLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [
    programaId,
    bloqueId,
    cohorteId,
    selectedYear,
    selectedMonth,
    localidad,
    nivelEducativo,
    estado,
    sexo,
    fechaDesde,
    fechaHasta,
    searchQuery,
    page,
  ]);

  // Reset de página al cambiar cualquier filtro
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setPage(1);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setProgramaId('');
    setBloqueId('');
    setCohorteId('');
    setLocalidad('');
    setNivelEducativo('');
    setEstado('');
    setSexo('');
    setSelectedYear('');
    setSelectedMonth('');
    setSearchQuery('');
    setFechaDesde('');
    setFechaHasta('');
    setPage(1);
  };

  // Toggle interactivo de barra
  const toggleBarFilter = (current: string, setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    if (current === value) {
      setter('');
    } else {
      setter(value);
    }
    setPage(1);
  };

  // Click en celda de matriz cruzada
  const handleCrossMatrixClick = (year: string, progName: string) => {
    const progMatch = programas.find((p) => p.nombre === progName);
    if (progMatch) {
      setProgramaId(String(progMatch.id));
    }
    setSelectedYear(year === selectedYear ? '' : year);
    setPage(1);
  };

  // Exportar Selección completa a CSV
  const handleExportSelectionCsv = () => {
    if (!stats || !stats.records || !stats.records.items) return;
    const items = stats.records.items;
    if (items.length === 0) {
      alert('No hay registros para exportar en la selección actual.');
      return;
    }

    const headers = [
      'Apellido y Nombres',
      'DNI',
      'Sexo',
      'Localidad',
      'Regularidad',
      'Programa / Carrera',
      'Bloque',
      'Módulo',
      'Cohorte',
      'Año',
      'Mes',
      'Estado Original',
      'Estado Calculado',
      'Motivo',
      'Nivel de Estudio',
      '1° Inscripción',
      'Nota',
      'Fecha Calificación',
    ];

    const rows = items.map((r) => [
      r.name,
      r.dni,
      r.sexo || '',
      r.city,
      r.regular,
      r.program,
      r.block,
      r.module,
      r.cohort,
      r.year,
      r.month,
      r.state,
      r.status,
      r.reason,
      r.education,
      r.enroll,
      r.grade,
      r.qualified,
    ]);

    const csvContent =
      '\ufeff' +
      [headers, ...rows]
        .map((row) =>
          row
            .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
            .join(';')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `observatorio_alumnos_seleccion_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportar Primeras Inscripciones a CSV
  const handleExportFirstEntriesCsv = () => {
    if (!stats || !stats.first_entries || stats.first_entries.length === 0) return;

    const headers = ['Año del primer ingreso histórico', 'Personas únicas'];
    const rows = stats.first_entries.map((item) => [item.year, item.count]);

    const csvContent =
      '\ufeff' +
      [headers, ...rows]
        .map((row) =>
          row
            .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
            .join(';')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `primeras_inscripciones_historico_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtrado de años en barras si se seleccionó un año específico en la UI
  const displayYearItems = useMemo(() => {
    if (!stats?.by_year) return [];
    return stats.by_year;
  }, [stats?.by_year]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col justify-center items-center h-80 space-y-4">
        <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-brand-accent shadow-[0_0_20px_#FF6600]"></div>
        <p className="text-sm font-semibold text-indigo-300 animate-pulse tracking-wide">
          Cargando Observatorio Académico...
        </p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="rounded-xl bg-red-900/30 border border-red-500/40 p-6 text-white text-center">
        <p className="font-semibold text-red-300">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold uppercase tracking-wider"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const activeFiltersCount = [
    programaId,
    bloqueId,
    cohorteId,
    localidad,
    nivelEducativo,
    estado,
    sexo,
    selectedYear,
    selectedMonth,
    searchQuery,
    fechaDesde,
    fechaHasta,
  ].filter(Boolean).length;

  const currentProgramName = programas.find((p) => String(p.id) === programaId)?.nombre;
  const currentBloqueName = bloques.find((b) => String(b.id) === bloqueId)?.nombre;
  const currentCohorteName = cohortes.find((c) => String(c.id) === cohorteId)?.nombre;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12 text-slate-100">
      {/* HEADER INSTITUCIONAL CFP */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-[#0a0033] via-[#1a0b5c] to-[#0a0033] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-8 rounded-full bg-brand-accent shadow-[0_0_10px_#FF6600]"></span>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Observatorio Académico
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40">
              CFP & Terciario
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-300 mt-1 ml-6">
            Centro Politécnico Superior Malvinas Argentinas · Análisis multidimensional e integral
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              getDashboardStats({
                programa_id: programaId ? Number(programaId) : undefined,
                bloque_id: bloqueId ? Number(bloqueId) : undefined,
                cohorte_id: cohorteId ? Number(cohorteId) : undefined,
                year: selectedYear || undefined,
                month: selectedMonth || undefined,
                localidad: localidad || undefined,
                nivel_educativo: nivelEducativo || undefined,
                estado: estado || undefined,
                sexo: sexo || undefined,
                fecha_desde: fechaDesde || undefined,
                fecha_hasta: fechaHasta || undefined,
                search: searchQuery.trim() || undefined,
                page,
                page_size: 50,
              })
                .then((res) => setStats(res))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
            }}
            title="Actualizar datos desde la base de datos"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-100 hover:text-white border border-indigo-500/40 text-xs font-semibold shadow-md transition-all"
          >
            <RotateCcw className={`w-4 h-4 text-brand-cyan ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={handleExportSelectionCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-100 hover:text-white border border-indigo-500/40 text-xs font-semibold shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-cyan" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-100 hover:text-white border border-indigo-500/40 text-xs font-semibold shadow-md transition-all"
          >
            <Printer className="w-4 h-4 text-brand-purple" />
            Imprimir / PDF
          </button>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* BARRA DE FILTROS SUPERIOR Y BÚSQUEDA INSTANTÁNEA */}
      <section className="bg-[#0a0033]/90 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 items-end">
          {/* Programa */}
          <Select
            label="Programa / Carrera"
            options={[
              { value: '', label: 'Todos los programas' },
              ...programas.map((p) => ({ value: String(p.id), label: p.nombre })),
            ]}
            value={programaId}
            onChange={(e) => {
              handleFilterChange(setProgramaId, e.target.value);
              setBloqueId('');
              setCohorteId('');
            }}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Bloque */}
          <Select
            label="Bloque Académico"
            options={[
              { value: '', label: 'Todos los bloques' },
              ...bloques.map((b) => ({ value: String(b.id), label: b.nombre })),
            ]}
            value={bloqueId}
            onChange={(e) => handleFilterChange(setBloqueId, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Cohorte */}
          <Select
            label="Cohorte"
            options={[
              { value: '', label: 'Todas las cohortes' },
              ...cohortes.map((c) => ({ value: String(c.id), label: c.nombre })),
            ]}
            value={cohorteId}
            onChange={(e) => handleFilterChange(setCohorteId, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Localidad */}
          <Select
            label="Localidad"
            options={[
              { value: '', label: 'Todas las localidades' },
              ...(stats?.by_city || []).map((c) => ({ value: c.name, label: `${c.name} (${c.count})` })),
            ]}
            value={localidad}
            onChange={(e) => handleFilterChange(setLocalidad, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Nivel de Estudio */}
          <Select
            label="Nivel de Estudio"
            options={[
              { value: '', label: 'Todos los niveles' },
              ...(stats?.by_education || []).map((ed) => ({ value: ed.name, label: ed.name })),
            ]}
            value={nivelEducativo}
            onChange={(e) => handleFilterChange(setNivelEducativo, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Estado Calculado */}
          <Select
            label="Trayectoria Calculada"
            options={[
              { value: '', label: 'Todos los estados' },
              ...(stats?.by_status || []).map((st) => ({ value: st.name, label: st.name })),
            ]}
            value={estado}
            onChange={(e) => handleFilterChange(setEstado, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />

          {/* Sexo */}
          <Select
            label="Sexo"
            options={[
              { value: '', label: 'Todos los sexos' },
              { value: 'Mujeres', label: `Mujeres (${stats?.sex_distribution?.mujeres ?? 0})` },
              { value: 'Varones', label: `Varones (${stats?.sex_distribution?.varones ?? 0})` },
              ...(stats?.sex_distribution?.otro
                ? [{ value: 'Otro', label: `Otro (${stats.sex_distribution.otro})` }]
                : []),
              ...(stats?.sex_distribution?.sin_especificar
                ? [{ value: 'Sin especificar', label: `Sin esp. (${stats.sex_distribution.sin_especificar})` }]
                : []),
            ]}
            value={sexo}
            onChange={(e) => handleFilterChange(setSexo, e.target.value)}
            className="bg-indigo-950/70 border-indigo-500/40 text-white text-xs h-10"
          />
        </div>

        {/* Fila 2: Búsqueda instantánea + Rango de Fechas */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-indigo-500/20">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Buscar por nombre, DNI, año, mes, cohorte o módulo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-white placeholder-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-indigo-300 font-semibold uppercase text-[10px] tracking-wider">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => handleFilterChange(setFechaDesde, e.target.value)}
              className="h-10 px-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan [color-scheme:dark]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-indigo-300 font-semibold uppercase text-[10px] tracking-wider">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => handleFilterChange(setFechaHasta, e.target.value)}
              className="h-10 px-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Barra de chips activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-500/20">
            <span className="text-[11px] text-indigo-300 font-medium">Filtros activos:</span>
            {currentProgramName && (
              <button
                onClick={() => setProgramaId('')}
                className="px-2.5 py-1 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-xs flex items-center gap-1 hover:bg-brand-accent/30"
              >
                Programa: {currentProgramName} <span className="font-bold">×</span>
              </button>
            )}
            {currentBloqueName && (
              <button
                onClick={() => setBloqueId('')}
                className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs flex items-center gap-1 hover:bg-indigo-500/30"
              >
                Bloque: {currentBloqueName} <span className="font-bold">×</span>
              </button>
            )}
            {currentCohorteName && (
              <button
                onClick={() => setCohorteId('')}
                className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs flex items-center gap-1 hover:bg-indigo-500/30"
              >
                Cohorte: {currentCohorteName} <span className="font-bold">×</span>
              </button>
            )}
            {localidad && (
              <button
                onClick={() => setLocalidad('')}
                className="px-2.5 py-1 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-xs flex items-center gap-1 hover:bg-brand-cyan/30"
              >
                Localidad: {localidad} <span className="font-bold">×</span>
              </button>
            )}
            {estado && (
              <button
                onClick={() => setEstado('')}
                className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-1 hover:bg-purple-500/30"
              >
                Estado: {estado} <span className="font-bold">×</span>
              </button>
            )}
            {sexo && (
              <button
                onClick={() => setSexo('')}
                className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs flex items-center gap-1 hover:bg-pink-500/30"
              >
                Sexo: {sexo} <span className="font-bold">×</span>
              </button>
            )}
            {selectedYear && (
              <button
                onClick={() => setSelectedYear('')}
                className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1 hover:bg-amber-500/30"
              >
                Año: {selectedYear} <span className="font-bold">×</span>
              </button>
            )}
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs flex items-center gap-1 hover:bg-orange-500/30"
              >
                Mes: {selectedMonth} <span className="font-bold">×</span>
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-500/40 text-slate-200 text-xs flex items-center gap-1 hover:bg-slate-500/30"
              >
                Búsqueda: {searchQuery} <span className="font-bold">×</span>
              </button>
            )}
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-1 hover:bg-indigo-500/30"
              >
                Fechas: {fechaDesde || '∞'} → {fechaHasta || 'Hoy'} <span className="font-bold">×</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* TARJETAS DE KPIS INSTITUCIONALES CFP */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Alumnos únicos */}
        <KPICard
          title="Alumnos únicos"
          value={stats?.unique_students_count ?? 0}
          description="Identificados por documento"
          icon={Users}
          color="text-brand-cyan"
          borderClass="border-brand-cyan/60 shadow-[0_0_15px_rgba(0,204,255,0.2)]"
        />

        {/* 2. Personas egresadas */}
        <KPICard
          title="Personas egresadas"
          value={stats?.graduated_students_count ?? 0}
          description="Al menos un programa completado"
          icon={GraduationCap}
          color="text-brand-accent"
          borderClass="border-brand-accent/60 shadow-[0_0_15px_rgba(255,102,0,0.2)]"
          onClick={() => setModalOpen('egresados')}
        />

        {/* 3. Egresos por programa */}
        <KPICard
          title="Egresos x programa"
          value={stats?.program_graduations_count ?? 0}
          description="Pares persona + programa"
          icon={Award}
          color="text-brand-purple"
          borderClass="border-brand-purple/60 shadow-[0_0_15px_rgba(170,0,255,0.2)]"
        />

        {/* 4. En curso con aprobadas */}
        <KPICard
          title="En curso c/ aprobadas"
          value={stats?.in_course_students_count ?? 0}
          description="Regla de nota en módulo 1"
          icon={Clock}
          color="text-indigo-400"
          borderClass="border-indigo-500/60 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
          onClick={() => setModalOpen('activos')}
        />

        {/* 5. Tasa de Aprobación */}
        <KPICard
          title="Tasa Aprobación"
          value={`${stats?.pass_rate ?? 0}%`}
          description="Evaluaciones y finales"
          icon={BookOpen}
          color="text-emerald-400"
          borderClass="border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          onClick={() => setModalOpen('aprobacion')}
        />

        {/* 6. Registros seleccionados */}
        <KPICard
          title="Registros totales"
          value={stats?.total_records ?? 0}
          description="Módulos y reinscripciones"
          icon={School}
          color="text-indigo-200"
          borderClass="border-indigo-500/40"
        />
      </section>

      {/* DISTRIBUCIÓN POR SEXO INTERACTIVA */}
      <SexDistributionWidget
        data={stats?.sex_distribution}
        selectedSex={sexo}
        onSelectSex={(val) => handleFilterChange(setSexo, val)}
      />

      {/* NOTA DE INTERACTIVIDAD */}
      <p className="text-xs text-indigo-300/70 italic flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-brand-cyan inline-block"></span>
        Pulsá cualquiera de las barras o localidades para cruzar los filtros instantáneamente. Los indicadores cuentan personas únicas dentro de cada selección.
      </p>

      {/* GRILLAS DE BARRAS INTERACTIVAS (TANDA 1: AÑO, PROGRAMA, ESTADO) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Alumnos por año */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-cyan"></span>
              Alumnos por Año
            </h3>
            {selectedYear && (
              <button
                type="button"
                onClick={() => setSelectedYear('')}
                className="text-xs text-brand-cyan hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <HorizontalBarList
            items={displayYearItems}
            selectedValue={selectedYear}
            onSelect={(val) => toggleBarFilter(selectedYear, setSelectedYear, val)}
            colorScheme="cyan"
          />
        </div>

        {/* Alumnos por programa */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-accent"></span>
              Alumnos por Programa
            </h3>
            {programaId && (
              <button
                type="button"
                onClick={() => setProgramaId('')}
                className="text-xs text-brand-accent hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <HorizontalBarList
            items={stats?.by_program || []}
            selectedValue={currentProgramName}
            onSelect={(val) => {
              const pMatch = programas.find((p) => p.nombre === val);
              toggleBarFilter(programaId, setProgramaId, pMatch ? String(pMatch.id) : '');
            }}
            colorScheme="orange"
            scrollable
            maxHeight="max-h-72"
          />
        </div>

        {/* Trayectoria calculada */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-purple"></span>
              Trayectoria Calculada
            </h3>
            {estado && (
              <button
                type="button"
                onClick={() => setEstado('')}
                className="text-xs text-brand-purple hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <HorizontalBarList
            items={stats?.by_status || []}
            selectedValue={estado}
            onSelect={(val) => toggleBarFilter(estado, setEstado, val)}
            colorScheme="purple"
          />
        </div>
      </section>

      {/* GRILLAS DE BARRAS INTERACTIVAS (TANDA 2: BLOQUE, COHORTE, MES) */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Distribución por Bloque */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-indigo-500"></span>
              Distribución por Bloque
            </h3>
            {bloqueId && (
              <button
                type="button"
                onClick={() => setBloqueId('')}
                className="text-xs text-indigo-300 hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <HorizontalBarList
            items={stats?.by_block || []}
            selectedValue={currentBloqueName}
            onSelect={(val) => {
              const bMatch = bloques.find((b) => b.nombre === val);
              toggleBarFilter(bloqueId, setBloqueId, bMatch ? String(bMatch.id) : '');
            }}
            colorScheme="indigo"
            scrollable
            maxHeight="max-h-72"
          />
        </div>

        {/* Cohortes */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-cyan"></span>
              Cohortes
            </h3>
            {cohorteId && (
              <button
                type="button"
                onClick={() => setCohorteId('')}
                className="text-xs text-brand-cyan hover:underline"
              >
                Ver todas
              </button>
            )}
          </div>
          <HorizontalBarList
            items={stats?.by_cohort || []}
            selectedValue={currentCohorteName}
            onSelect={(val) => {
              const cMatch = cohortes.find((c) => c.nombre === val);
              toggleBarFilter(cohorteId, setCohorteId, cMatch ? String(cMatch.id) : '');
            }}
            colorScheme="cyan"
            scrollable
            maxHeight="max-h-72"
          />
        </div>

        {/* Alumnos por mes registrado */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-accent"></span>
              Alumnos por Mes Registrado
            </h3>
            {selectedMonth && (
              <button
                type="button"
                onClick={() => setSelectedMonth('')}
                className="text-xs text-brand-accent hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>
          <HorizontalBarList
            items={stats?.by_month || []}
            selectedValue={selectedMonth}
            onSelect={(val) => toggleBarFilter(selectedMonth, setSelectedMonth, val)}
            colorScheme="orange"
            scrollable
            maxHeight="max-h-72"
          />
        </div>
      </section>

      {/* SECCIÓN TERRITORIAL CON MAPA INTERACTIVO SVG */}
      <section className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-brand-cyan shadow-[0_0_8px_#00ccff]"></span>
            Distribución Territorial
          </h2>
          <span className="text-xs text-indigo-300">
            Tierra del Fuego y Proyección Nacional
          </span>
        </div>

        <TerritorialMap
          cities={stats?.by_city || []}
          selectedCity={localidad}
          onSelectCity={(city) => toggleBarFilter(localidad, setLocalidad, city)}
        />
      </section>

      {/* MATRICES HISTÓRICAS: PRIMER INGRESO & CRUCE AÑO X PROGRAMA */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Primer ingreso histórico */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-3">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-brand-cyan"></span>
            Primer Ingreso Histórico por Persona
          </h3>
          <p className="text-xs text-indigo-300/70">
            Fecha mínima de inscripción entre todos sus programas. Cada persona aparece exactamente una vez.
          </p>
          <FirstEntryTable
            data={stats?.first_entries || []}
            selectedYear={selectedYear}
            onSelectYear={(yr) => toggleBarFilter(selectedYear, setSelectedYear, yr)}
            onExportFirstEntries={handleExportFirstEntriesCsv}
          />
        </div>

        {/* Alumnos únicos por año y programa */}
        <div className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-3">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-brand-accent"></span>
            Alumnos Únicos por Año y Programa
          </h3>
          <p className="text-xs text-indigo-300/70">
            Matriz cruzada con conteo de personas y egresados históricos. Haz clic en una fila para filtrar.
          </p>
          <CrossMatrixTable
            data={stats?.cross_matrix || []}
            selectedYear={selectedYear}
            selectedProgram={currentProgramName}
            onSelectCell={handleCrossMatrixClick}
          />
        </div>
      </section>

      {/* CONCLUSIONES DE LA SELECCIÓN */}
      <section className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-3">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <span className="w-2.5 h-6 rounded-full bg-brand-cyan shadow-[0_0_8px_#00ccff]"></span>
          Conclusiones de la Selección
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-indigo-200/90 list-disc list-inside leading-relaxed">
          <li>
            <strong>{(stats?.unique_students_count ?? 0).toLocaleString('es-AR')} personas únicas</strong> en la selección actual;{' '}
            <strong>{(stats?.graduated_students_count ?? 0).toLocaleString('es-AR')}</strong> tienen al menos un egreso acreditado{' '}
            ({stats?.unique_students_count ? (((stats.graduated_students_count ?? 0) / stats.unique_students_count) * 100).toFixed(1) : 0}%).
          </li>
          {stats?.by_program && stats.by_program.length > 0 && (
            <li>
              <strong>{stats.by_program[0].name}</strong> reúne el mayor volumen con{' '}
              <strong>{stats.by_program[0].count.toLocaleString('es-AR')}</strong> personas registradas.
            </li>
          )}
          <li>
            Las sumas por programa o año pueden superar el total general: una misma persona puede participar en varios programas o cursadas.
          </li>
            {Boolean(stats?.in_course_students_count) && (
              <li>
                <strong>{(stats?.in_course_students_count ?? 0).toLocaleString('es-AR')}</strong> estudiantes se encuentran en curso con materias aprobadas (módulo 1 completado en trayectorias con módulos sucesivos).
              </li>
            )}
            {Boolean(stats?.sex_distribution) && (
              <li>
                Composición por sexo en la selección actual:{' '}
                <strong>{(stats?.sex_distribution?.mujeres ?? 0).toLocaleString('es-AR')} mujeres</strong>{' '}
                ({stats?.sex_distribution?.mujeres_pct ?? 0}%) y{' '}
                <strong>{(stats?.sex_distribution?.varones ?? 0).toLocaleString('es-AR')} varones</strong>{' '}
                ({stats?.sex_distribution?.varones_pct ?? 0}%).
              </li>
            )}
          </ul>
      </section>

      {/* INFORMACIÓN SECUNDARIA · NIVEL DE ESTUDIO (DESPLEGABLE) */}
      <section className="bg-[#0a0033]/80 border border-indigo-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <details className="group cursor-pointer">
          <summary className="flex justify-between items-center text-sm font-bold text-indigo-200 group-hover:text-white select-none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-5 rounded-full bg-brand-purple"></span>
              Información Secundaria · Nivel de Estudio Alcanzado
            </span>
            <span className="text-xs text-brand-purple font-mono group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <div className="mt-4 pt-4 border-t border-indigo-500/20">
            <HorizontalBarList
              items={stats?.by_education || []}
              selectedValue={nivelEducativo}
              onSelect={(val) => toggleBarFilter(nivelEducativo, setNivelEducativo, val)}
              colorScheme="purple"
            />
          </div>
        </details>
      </section>

      {/* DETALLE AUDITABLE / TABLA DE REGISTROS CON PAGINACIÓN */}
      <section className="bg-[#0a0033]/90 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 rounded-full bg-brand-accent shadow-[0_0_8px_#FF6600]"></span>
            Detalle Auditable de Registros
          </h2>
          <span className="text-xs text-indigo-300">
            Registros completos con calificaciones y motivos de trayectoria
          </span>
        </div>

        <AuditableRecordsTable
          records={stats?.records}
          page={page}
          onPageChange={setPage}
          onExportCsv={handleExportSelectionCsv}
          isLoading={tableLoading}
        />
      </section>

      {/* REGLAS Y CALIDAD DE LOS DATOS (DESPLEGABLE INSTITUCIONAL) */}
      <section className="bg-[#0a0033]/80 border border-indigo-500/20 rounded-2xl p-5 text-xs text-indigo-300/80 space-y-2">
        <details>
          <summary className="font-bold text-indigo-200 cursor-pointer select-none hover:text-white">
            Reglas y Criterios Académicos del Observatorio
          </summary>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
            <li>
              <strong>Identidad:</strong> DNI sin puntos ni guiones. Si falta, se utiliza identidad provisional por nombre normalizado.
            </li>
            <li>
              <strong>Egreso Acreditado:</strong> Un estado explícito «Egresado» o «Aprobado» acredita egreso. Para <em>Habilidades Digitales</em>, <em>Sistemas de Representación</em>, <em>Matemática para Técnicos</em>, <em>Diseño y Fabricación Digital</em> y <em>Tecnicatura Superior en Ciencia de Datos e IA</em>, cualquier nota registrada en Módulo 2 o evaluación final acredita egreso.
            </li>
            <li>
              <strong>En curso con materias aprobadas:</strong> En dichos programas, nota registrada únicamente en Módulo 1 implica «En curso con materias aprobadas».
            </li>
            <li>
              <strong>Determinación de Año y Mes:</strong> Se prioriza el año de cohorte → fecha de inicio de cursada → fecha de creación de inscripción. El mes preserva el calendario institucional.
            </li>
            <li>
              <strong>Normalización Territorial:</strong> Se unifican automáticamente variantes geográficas de Río Grande, Ushuaia, Tolhuin, CABA, Córdoba, etc.
            </li>
          </ul>
        </details>
      </section>

      {/* MODALES DE DESGLOSE PREVIOS (RETROCOMPATIBILIDAD) */}
      {stats && (
        <>
          <DashboardModal
            isOpen={modalOpen === 'activos' || modalOpen === 'egresados'}
            onClose={() => {
              setModalOpen(null);
              setSelectedProgramData(null);
            }}
            title={modalOpen === 'activos' ? 'Desglose: Estudiantes Activos' : 'Desglose: Egresados'}
          >
            <ActiveGraduatedModalContent
              modalOpen={modalOpen as 'activos' | 'egresados'}
              stats={stats}
              selectedProgramData={selectedProgramData}
              setSelectedProgramData={setSelectedProgramData}
            />
          </DashboardModal>

          <DashboardModal
            isOpen={modalOpen === 'aprobacion'}
            onClose={() => setModalOpen(null)}
            title="Desglose: Tasa de Aprobación"
          >
            <PassRateModalContent stats={stats} />
          </DashboardModal>
        </>
      )}
    </div>
  );
}
