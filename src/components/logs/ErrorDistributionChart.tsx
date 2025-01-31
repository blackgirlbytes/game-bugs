import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { LogEntry } from '../../store/gameStore';
import { prepareErrorDistribution } from '../../utils/logUtils';

interface ErrorDistributionChartProps {
  logs: LogEntry[];
}

const COLORS = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#10B981', // emerald
  '#6366F1', // indigo
  '#84CC16', // lime
  '#A855F7', // purple
  '#06B6D4', // cyan
  '#D946EF', // fuchsia
  '#34D399', // emerald-400
];

export const ErrorDistributionChart: React.FC<ErrorDistributionChartProps> = ({ logs }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Top Error Categories</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={prepareErrorDistribution(logs)}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {prepareErrorDistribution(logs).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value} errors`, name]}
            />
            <Legend 
              layout="vertical" 
              align="right"
              verticalAlign="middle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 