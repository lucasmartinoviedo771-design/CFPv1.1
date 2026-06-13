import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ExtendedDashboardStats } from './types';

interface PassRateModalContentProps {
  stats: ExtendedDashboardStats;
}

export default function PassRateModalContent({ stats }: PassRateModalContentProps) {
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };

  return (
    <div className="space-y-10">
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <h4 className="text-lg font-bold text-white mb-4 flex items-center">
          Aprobación por Programa
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.pass_breakdown?.by_program || []}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Tasa de Aprobación']} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40}>
                {(stats.pass_breakdown?.by_program || []).map((entry, index) => (
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
            <BarChart data={stats.pass_breakdown?.by_block || []}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Tasa de Aprobación']} />
              <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
