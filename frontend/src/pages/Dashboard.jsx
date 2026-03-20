import React, { useEffect, useState } from 'react';
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';
import { Select, Button } from '../components/UI';
import { Users, BookOpen, UserCheck, GraduationCap, X, ChevronRight, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import { listProgramas } from '../services/programasService';
import api from '../api/client';

const KPICard = ({ title, value, icon: Icon, color, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left relative overflow-hidden rounded-xl bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm p-6 transition-all hover:bg-indigo-800/30 hover:scale-[1.02] active:scale-95 group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-indigo-300 truncate group-hover:text-white transition-colors">{title}</p>
        <p className="mt-2 text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${color.replace('text-', 'text-glow-')} group-hover:border-white/20 transition-all`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    {onClick && (
      <div className="mt-4 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-white transition-colors">
        Ver desglose <ChevronRight size={14} className="ml-1" />
      </div>
    )}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${color.replace('text-', 'bg-')}`}></div>
  </button>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-indigo-500/20 flex justify-between items-center bg-indigo-950/40">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-indigo-300 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar bg-gradient-to-b from-indigo-950/20 to-transparent">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};



export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [error, setError] = useState(null);
  const [programas, setProgramas] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [cohortes, setCohortes] = useState([]);
  const [programaId, setProgramaId] = useState('');
  const [bloqueId, setBloqueId] = useState('');
  const [cohorteId, setCohorteId] = useState('');
  const [modalOpen, setModalOpen] = useState(null); // 'activos', 'egresados', 'aprobacion'
  const [selectedProgramData, setSelectedProgramData] = useState(null); // Para navegación en modal
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const progs = await listProgramas();
        setProgramas(Array.isArray(progs) ? progs : []);
      } catch (err) {
        console.error('Error cargando programas para dashboard', err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [bloquesRes, cohortesRes] = await Promise.all([
          api.get('/bloques', { params: { programa_id: programaId || undefined } }),
          api.get('/inscripciones/cohortes', { params: { programa_id: programaId || undefined } }),
        ]);
        setBloques(Array.isArray(bloquesRes.data) ? bloquesRes.data : []);
        setCohortes(Array.isArray(cohortesRes.data) ? cohortesRes.data : []);
      } catch (err) {
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
        const [statsResponse] = await Promise.all([
          getDashboardStats(params),
        ]);

        if (!mounted) return;
        setStats(statsResponse);

        // Tendencia anual desde el backend
        const parsedTrend = (statsResponse.yearly_trend || []).map((item) => ({
          year: item.year,
          inscritos: item.count
        }));
        setTrendData(parsedTrend);
      } catch (err) {
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

  const chartData = (stats.programs_chart?.labels || []).map((label, index) => ({
    name: label,
    estudiantes: stats.programs_chart?.counts?.[index] || 0,
  }));

  const chartAxisStroke = "#818cf8";
  const chartGridStroke = "#312e81";
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };
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
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-11 rounded-lg bg-indigo-900/50 border border-indigo-500/50 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent [color-scheme:dark]"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">Hasta</label>
              <input
                id="dashboard-fecha-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
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
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
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
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="estudiantes" fill="#00ccff" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl text-white">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <span className="w-2 h-8 bg-brand-accent rounded-full mr-3"></span>
            Tendencia de Inscripciones por Año
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line name="Inscritos" type="monotone" dataKey="inscritos" stroke="#FF6600" strokeWidth={3} dot={{ r: 4, fill: '#FF6600', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#fff', stroke: '#FF6600' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MODALES DE DESGLOSE */}
      <Modal 
        isOpen={modalOpen === 'activos' || modalOpen === 'egresados'} 
        onClose={() => { setModalOpen(null); setSelectedProgramData(null); }}
        title={modalOpen === 'activos' ? "Desglose: Estudiantes Activos" : "Desglose: Egresados"}
      >
        <div className="space-y-6">
          {!selectedProgramData ? (
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center">
                <TrendingUp size={18} className="mr-2 text-brand-cyan" />
                Seleccione un Programa para ver detalle por Cohorte
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={modalOpen === 'activos' ? stats.active_breakdown : stats.graduated_breakdown} 
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={160} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text
                              x={-10}
                              y={0}
                              dy={4}
                              textAnchor="end"
                              fill="#94a3b8"
                              fontSize={12}
                              className="cursor-pointer hover:fill-white transition-colors"
                              onClick={() => {
                                const item = (modalOpen === 'activos' ? stats.active_breakdown : stats.graduated_breakdown)
                                  .find(d => d.name === payload.value);
                                if (item) setSelectedProgramData(item);
                              }}
                            >
                              {payload.value}
                            </text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                      contentStyle={tooltipStyle}
                      formatter={(value) => [`${value} estudiantes`, 'Total']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill={modalOpen === 'activos' ? "#00ccff" : "#FF6600"} 
                      radius={[0, 4, 4, 0]} 
                      barSize={30} 
                      className="cursor-pointer"
                      onClick={(data) => {
                        if (data) setSelectedProgramData(data);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-indigo-400 text-xs mt-4 text-center">Tip: Haga clic en una barra para ver el desglose de cohortes de ese programa.</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button 
                onClick={() => setSelectedProgramData(null)}
                className="mb-6 flex items-center text-sm font-semibold text-brand-cyan hover:text-white transition-colors"
              >
                <X size={16} className="mr-1" /> Volver a programas
              </button>
              
              <div className="bg-white/5 p-8 rounded-xl border border-white/20">
                <h4 className="text-xl font-bold text-white mb-2">{selectedProgramData.name}</h4>
                <p className="text-indigo-300 text-sm mb-8">Desglose por Cohortes ({selectedProgramData.count} totales)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProgramData.cohorts.map((coh, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-indigo-950/40 rounded-lg border border-indigo-500/20 hover:border-brand-cyan/50 transition-colors">
                      <span className="text-indigo-100 font-medium">{coh.name}</span>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-white mr-2">{coh.count}</span>
                        <span className="text-xs text-indigo-400">estudiantes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={modalOpen === 'aprobacion'} 
        onClose={() => setModalOpen(null)}
        title="Desglose: Tasa de Aprobación"
      >
        <div className="space-y-10">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
              Aprobación por Programa
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pass_breakdown?.by_program}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Tasa de Aprobación']} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40}>
                    {stats.pass_breakdown?.by_program.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rate > 70 ? '#10b981' : entry.rate > 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
              Top 15 Bloques con Mejor Desempeño
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pass_breakdown?.by_block}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Tasa de Aprobación']} />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
