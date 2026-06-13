import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProgramChart } from './types';

interface ProgramEnrollmentChartProps {
  programsChart: ProgramChart | null | undefined;
}

export default function ProgramEnrollmentChart({ programsChart }: ProgramEnrollmentChartProps) {
  const chartData = (programsChart?.labels || []).map((label, index) => ({
    name: label,
    estudiantes: programsChart?.counts?.[index] || 0,
  }));

  const chartAxisStroke = "#818cf8";
  const chartGridStroke = "#312e81";
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };

  return (
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
  );
}
