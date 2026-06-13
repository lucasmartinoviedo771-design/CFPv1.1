import React, { useEffect, useState } from 'react';
import { Select, Button } from '../components/UI';
import { Users, BookOpen, UserCheck, GraduationCap } from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import { listProgramas } from '../services/programasService';
import api from '../api/client';
import type { Programa, Bloque, Cohorte } from '../api/types';
import { ExtendedDashboardStats, ProgramBreakdownItem, YearlyTrendItem } from '../components/Dashboard/types';
import KPICard from '../components/Dashboard/KPICard';
import DashboardModal from '../components/Dashboard/DashboardModal';
import ProgramEnrollmentChart from '../components/Dashboard/ProgramEnrollmentChart';
import EnrollmentTrendChart from '../components/Dashboard/EnrollmentTrendChart';
import ActiveGraduatedModalContent from '../components/Dashboard/ActiveGraduatedModalContent';
import PassRateModalContent from '../components/Dashboard/PassRateModalContent';

type ModalType = 'activos' | 'egresados' | 'aprobacion' | null;

export default function Dashboard() {
  const [stats, setStats] = useState<ExtendedDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trendData, setTrendData] = useState<YearlyTrendItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [programaId, setProgramaId] = useState<string>('');
  const [bloqueId, setBloqueId] = useState<string>('');
  const [cohorteId, setCohorteId] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [selectedProgramData, setSelectedProgramData] = useState<ProgramBreakdownItem | null>(null);
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [localFechaDesde, setLocalFechaDesde] = useState<string>('');
  const [localFechaHasta, setLocalFechaHasta] = useState<string>('');

  const isDateComplete = (val: string | null | undefined): boolean => !!(val && val.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(val));

  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (err: unknown) {
        console.error('Error cargando programas para dashboard', err);
      }
    })();
  }, []);

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
        console.error('Error cargando bloques/cohortes para dashboard', err);
      }
    })();
  }, [programaId]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          programa_id: programaId || undefined,
          bloque_id: bloqueId || undefined,
          cohorte_id: cohorteId || undefined,
          fecha_desde: fechaDesde || undefined,
          fecha_hasta: fechaHasta || undefined,
        };
        const statsResponse = await getDashboardStats(params) as ExtendedDashboardStats;

        if (!mounted) return;
        setStats(statsResponse);

        // Tendencia anual desde el backend
        const parsedTrend: YearlyTrendItem[] = (statsResponse.yearly_trend || []).map((item) => ({
          year: item.year,
          count: item.count
        }));
        setTrendData(parsedTrend);
      } catch (err: unknown) {
        console.error('Error cargando metricas del dashboard', err);
        if (mounted) setError('No pudimos cargar las metricas del dashboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [programaId, bloqueId, cohorteId, fechaDesde, fechaHasta]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent shadow-[0_0_15px_#FF6600]"></div>
      </div>
    );
  }

  if (error) return <div className="text-white">{error}</div>;
  if (!stats) return <div className="text-white">No hay datos para mostrar.</div>;


  const programasOptions = [{ value: '', label: 'Todos' }, ...programas.map((p) => ({ value: p.id, label: p.nombre }))];
  const bloquesOptions = [{ value: '', label: 'Todos' }, ...bloques.map((b) => ({ value: b.id, label: b.nombre }))];
  const cohortesOptions = [{ value: '', label: 'Todos' }, ...cohortes.map((c) => ({ value: c.id, label: c.nombre }))];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard General</h1>
        <p className="text-indigo-300 mt-1">Resumen de actividad academica y metricas clave.</p>
      </div>

      {/* BARRA DE FILTROS GLOBAL */}
      <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 space-y-4">
        {/* Fila 1: Programa / Bloque / Cohorte / Exportar */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <Select
            label="Programa"
            options={programasOptions}
            value={programaId}
            onChange={(e) => { setProgramaId(e.target.value); setBloqueId(''); setCohorteId(''); }}
            className="bg-indigo-900/50 border-indigo-500/50 text-white"
          />
          <Select
            label="Bloque"
            options={bloquesOptions}
            value={bloqueId}
            onChange={(e) => setBloqueId(e.target.value)}
            className="bg-indigo-900/50 border-indigo-500/50 text-white"
          />
          <Select
            label="Cohorte"
            options={cohortesOptions}
            value={cohorteId}
            onChange={(e) => setCohorteId(e.target.value)}
            className="bg-indigo-900/50 border-indigo-500/50 text-white"
          />
          <Button className="h-11 bg-brand-accent hover:bg-orange-600 border-none shadow-[0_0_15px_rgba(255,102,0,0.4)]">
            Exportar Reporte
          </Button>
        </div>

        {/* Fila 2: Rango de fechas global */}
        <div className="border-t border-indigo-500/20 pt-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Fecha Desde */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Desde</label>
              <input
                id="dashboard-fecha-desde"
                type="date"
                value={localFechaDesde}
                onChange={(e) => setLocalFechaDesde(e.target.value)}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (!v || isDateComplete(v)) setFechaDesde(v);
                }}
                className="h-11 rounded-lg bg-indigo-900/50 border border-indigo-500/50 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:dark]"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Hasta</label>
              <input
                id="dashboard-fecha-hasta"
                type="date"
                value={localFechaHasta}
                onChange={(e) => setLocalFechaHasta(e.target.value)}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (!v || isDateComplete(v)) setFechaHasta(v);
                }}
                className="h-11 rounded-lg bg-indigo-900/50 border border-indigo-500/50 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:dark]"
              />
            </div>


            {/* Indicador de rango activo */}
            {(fechaDesde || fechaHasta) && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-indigo-300 bg-indigo-900/50 border border-indigo-500/30 rounded-full px-3 py-1.5">
                  📅 {fechaDesde || '∞'} → {fechaHasta || 'Hoy'}
                </span>
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); setLocalFechaDesde(''); setLocalFechaHasta(''); }}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors font-semibold"
                >
                  ✕ Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Estudiantes Activos" 
          value={stats.active_students_count ?? 0} 
          icon={Users} 
          color="text-brand-cyan" 
          onClick={() => setModalOpen('activos')}
        />
        <KPICard 
          title="Egresados" 
          value={stats.graduated_students_count ?? 0} 
          icon={GraduationCap} 
          color="text-brand-accent" 
          onClick={() => setModalOpen('egresados')}
        />
        <KPICard 
          title="Tasa de Asistencia" 
          value={`${stats.attendance_rate ?? 0}%`} 
          icon={UserCheck} 
          color="text-brand-purple" 
        />
        <KPICard 
          title="Tasa de Aprobacion" 
          value={`${stats.pass_rate ?? 0}%`} 
          icon={BookOpen} 
          color="text-emerald-400" 
          onClick={() => setModalOpen('aprobacion')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center">
            <span className="w-2 h-8 bg-brand-cyan rounded-full mr-3"></span>
            Inscriptos por Programa
          </h3>
          <p className="text-indigo-400 text-xs mb-6 ml-5">
            Snapshot de estudiantes únicos con inscripción activa o curso finalizado en cada programa (basado en filtros).
          </p>
          <ProgramEnrollmentChart programsChart={stats.programs_chart} />
        </div>

        <div className="bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <span className="w-2 h-8 bg-brand-accent rounded-full mr-3"></span>
            Tendencia de Inscripciones por Año
          </h3>
          <EnrollmentTrendChart trendData={trendData} />
        </div>
      </div>

      {/* MODALES DE DESGLOSE */}
      <DashboardModal 
        isOpen={modalOpen === 'activos' || modalOpen === 'egresados'} 
        onClose={() => { setModalOpen(null); setSelectedProgramData(null); }}
        title={modalOpen === 'activos' ? "Desglose: Estudiantes Activos" : "Desglose: Egresados"}
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
    </div>
  );
}
