import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore, LogEntry, LogSeverity } from '../store/gameStore';
import { AlertTriangle, Info, XCircle, Clock, Trash2, Filter, BarChart2, Tag, RefreshCw } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { LogFilters } from './logs/LogFilters';
import { LogEntryComponent } from './logs/LogEntry';

interface TimeSeriesData {
  timestamp: string;
  error: number;
  warning: number;
  info: number;
}

interface ErrorDistributionData {
  category: string;
  count: number;
}

const prepareTimeSeriesData = (logs: LogEntry[]): TimeSeriesData[] => {
  const timeMap = new Map<string, { error: number; warning: number; info: number }>();
  
  if (logs.length === 0) {
    return [];
  }

  // Find the time range from the logs
  const timestamps = logs.map(log => new Date(log.timestamp).getTime());
  const latestTime = Math.max(...timestamps);
  const earliestTime = Math.max(latestTime - (24 * 60 * 60 * 1000), Math.min(...timestamps));
  
  // Initialize time slots based on the log data's time range - 10 minute increments
  for (let time = earliestTime; time <= latestTime; time += 600000) { // 10 minutes = 600000ms
    const date = new Date(time);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(date.getMinutes() / 10) * 10).padStart(2, '0');
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${hours}:${minutes}`;
    timeMap.set(hourKey, { error: 0, warning: 0, info: 0 });
  }
  
  // Count logs in each time slot
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(Math.floor(date.getMinutes() / 10) * 10).padStart(2, '0');
    const hourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${hours}:${minutes}`;
    
    if (timeMap.has(hourKey)) {
      const current = timeMap.get(hourKey)!;
      current[log.type]++;
    }
  });
  
  const result = Array.from(timeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, counts]) => {
      const date = new Date(timestamp);
      return {
        timestamp: date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        ...counts
      };
    });

  return result;
};

const prepareErrorDistribution = (logs: LogEntry[]): ErrorDistributionData[] => {
  const errorMap = new Map<string, number>();
  
  logs.filter(log => log.type === 'error').forEach(log => {
    const count = errorMap.get(log.category) || 0;
    errorMap.set(log.category, count + 1);
  });
  
  return Array.from(errorMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 error categories
};

const LogIcon: React.FC<{ type: LogEntry['type'] }> = ({ type }) => {
  switch (type) {
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const SeverityBadge: React.FC<{ severity: LogSeverity }> = ({ severity }) => {
  const colors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity]}`}>
      {severity}
    </span>
  );
};

export const LogDashboard: React.FC = () => {
  const { logs, clearLogs, getLogStats, fetchLogs, loading, error } = useGameStore();
  const [filter, setFilter] = useState<LogEntry['type'] | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<LogSeverity | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Fetching logs...');
    fetchLogs();
  }, [fetchLogs]);

  const stats = getLogStats();

  const filteredLogs = useMemo(() => {
    return logs.filter((log: LogEntry) => {
      const typeMatch = filter === 'all' || log.type === filter;
      const severityMatch = severityFilter === 'all' || log.severity === severityFilter;
      const searchMatch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && severityMatch && searchMatch;
    });
  }, [logs, filter, severityFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading logs...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Game Logs Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={clearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 mb-1">Total Logs</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 mb-1">Errors</div>
            <div className="text-2xl font-bold text-red-500">{stats.byType.error || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 mb-1">Warnings</div>
            <div className="text-2xl font-bold text-yellow-500">{stats.byType.warning || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-500 mb-1">Info</div>
            <div className="text-2xl font-bold text-blue-500">{stats.byType.info || 0}</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    {
                      prepareErrorDistribution(logs).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
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
                          ][index % 10]} 
                        />
                      ))
                    }
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
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      <LogFilters
        filter={filter}
        setFilter={setFilter}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="space-y-4">
        {filteredLogs.map((log: LogEntry) => (
          <LogEntryComponent key={log.id} log={log} />
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No logs to display
          </div>
        )}
      </div>
    </div>
  );
};