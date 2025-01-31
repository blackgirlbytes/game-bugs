import React, { useState, useMemo, useEffect } from 'react';
import { useGameStore, LogEntry, LogSeverity } from '../store/gameStore';
import { Trash2, RefreshCw } from 'lucide-react';
import { LogFilters } from './logs/LogFilters';
import { LogEntryComponent } from './logs/LogEntry';
import { TimeSeriesChart } from './logs/TimeSeriesChart';
import { ErrorDistributionChart } from './logs/ErrorDistributionChart';



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
          <TimeSeriesChart logs={logs} />
          <ErrorDistributionChart logs={logs} />
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