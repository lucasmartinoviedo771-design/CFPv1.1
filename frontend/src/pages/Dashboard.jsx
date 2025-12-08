import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Card, Select, Button } from '../components/UI';
import { Users, BookOpen, UserCheck, TrendingUp } from 'lucide-react';

// KPI Card Component ajustado al Dark Mode
const KPICard = ({ title, value, icon: Icon, color }) => (
  <div className="relative overflow-hidden rounded-xl bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-indigo-300 truncate">{title}</p>
        <p className="mt-2 text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-white/5 border border-white/10 ${color.replace('text-', 'text-glow-')}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    {/* Decorative glow */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl ${color.replace('text-', 'bg-')}`}></div>
  </div>
);

// Helper icon
function GraduationCap(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking the call for demo, simulating API response
    // En el futuro: api.get('/dashboard/stats')...
    setTimeout(() => {
      setStats({
        active_students_count: 145,
        graduated_students_count: 32,
        programs_chart: {
          labels: ['Full Stack', 'Data Science', 'UX/UI'],
          counts: [80, 45, 20]
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent shadow-[0_0_15px_#FF6600]"></div>
    </div>
  );

  if (!stats) return <div className="text-white">Error loading stats</div>;

  // Transform data for recharts
  const chartData = stats.programs_chart.labels.map((label, index) => ({
    name: label,
    estudiantes: stats.programs_chart.counts[index]
  }));

  // Mock enrollment trend data
  const trendData = [
    { month: 'Ene', inscritos: 10 },
    { month: 'Feb', inscritos: 25 },
    { month: 'Mar', inscritos: 45 },
    { month: 'Abr', inscritos: 30 },
    { month: 'May', inscritos: 50 },
    { month: 'Jun', inscritos: 65 },
  ];

  // Estilos personalizados para los gráficos (para que se vean bien en fondo oscuro)
  const chartAxisStroke = "#818cf8"; // Indigo 400
  const chartGridStroke = "#312e81"; // Indigo 900
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard General</h1>
          <p className="text-indigo-300 mt-1">Resumen de actividad académica y métricas clave.</p>
        </div>
        <div className="flex space-x-3">
          <Select
            options={[{ value: '2025', label: 'Ciclo 2025' }, { value: '2024', label: 'Ciclo 2024' }]}
            className="w-40 bg-indigo-900/50 border-indigo-500/50 text-white"
          />
          <Button className="bg-brand-accent hover:bg-orange-600 border-none shadow-[0_0_15px_rgba(255,102,0,0.4)]">
            Exportar Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Estudiantes Activos" value={stats.active_students_count} icon={Users} color="text-brand-cyan" />
        <KPICard title="Egresados" value={stats.graduated_students_count} icon={GraduationCap} color="text-brand-accent" />
        <KPICard title="Tasa de Asistencia" value="87%" icon={UserCheck} color="text-brand-purple" />
        <KPICard title="Promedio General" value="8.4" icon={BookOpen} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card customizada para dark mode */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-2 h-8 bg-brand-cyan rounded-full mr-3"></span>
            Inscripciones por Programa
          </h3>
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

        <div className="bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-2 h-8 bg-brand-accent rounded-full mr-3"></span>
            Tendencia Mensual
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="inscritos" stroke="#FF6600" strokeWidth={3} dot={{ r: 4, fill: '#FF6600', strokeWidth: 0 }} activeDot={{ r: 7, fill: '#fff', stroke: '#FF6600' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
