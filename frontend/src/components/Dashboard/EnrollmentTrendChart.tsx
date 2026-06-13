import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { YearlyTrendItem } from './types';

interface EnrollmentTrendChartProps {
  trendData: YearlyTrendItem[];
}

export default function EnrollmentTrendChart({ trendData }: EnrollmentTrendChartProps) {
  const chartAxisStroke = "#818cf8";
  const chartGridStroke = "#312e81";
  const tooltipStyle = { backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', borderRadius: '8px', color: '#fff' };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridStroke} />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: chartAxisStroke }} />
          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
          <Legend wrapperStyle={{ color: '#fff' }} />
          <Line 
            name="Inscritos" 
            type="monotone" 
            dataKey="count" 
            stroke="#FF6600" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#FF6600', strokeWidth: 0 }} 
            activeDot={{ r: 7, fill: '#fff', stroke: '#FF6600' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
