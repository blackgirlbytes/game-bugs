import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { LogEntry } from '../../store/gameStore';
import { prepareTimeSeriesData } from '../../utils/logUtils';

interface TimeSeriesChartProps {
  logs: LogEntry[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ logs }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Log Activity (Last 24 Hours)</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={prepareTimeSeriesData(logs)} margin={{ bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={2}  // Show every other label to prevent crowding
            />
            <YAxis />
            <Tooltip 
              contentStyle={{ background: 'white', border: '1px solid #ccc', padding: '8px' }}
              formatter={(value, name) => [`${value} logs`, name]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              dataKey="info" 
              stackId="stack"
              fill="#3B82F6" 
              name="Info"
            />
            <Bar 
              dataKey="warning" 
              stackId="stack"
              fill="#F59E0B" 
              name="Warnings"
            />
            <Bar 
              dataKey="error" 
              stackId="stack"
              fill="#EF4444" 
              name="Errors"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}; 