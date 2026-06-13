import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, X } from 'lucide-react';
import { ProgramBreakdownItem, ExtendedDashboardStats } from './types';

interface ActiveGraduatedModalContentProps {
  modalOpen: 'activos' | 'egresados';
  stats: ExtendedDashboardStats;
  selectedProgramData: ProgramBreakdownItem | null;
  setSelectedProgramData: (item: ProgramBreakdownItem | null) => void;
}

export default function ActiveGraduatedModalContent({
  modalOpen,
  stats,
  selectedProgramData,
  setSelectedProgramData
}: ActiveGraduatedModalContentProps) {
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };

  const breakdownData = (modalOpen === 'activos' ? stats.active_breakdown : stats.graduated_breakdown) || [];

  return (
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
                data={breakdownData} 
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
                  tick={(props: { x: string | number; y: string | number; payload: { value: string } }) => {
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
                            const item = breakdownData.find(d => d.name === payload.value);
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
                  onClick={(data: unknown) => {
                    if (data && typeof data === 'object' && 'name' in data) {
                      setSelectedProgramData(data as ProgramBreakdownItem);
                    }
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
  );
}
