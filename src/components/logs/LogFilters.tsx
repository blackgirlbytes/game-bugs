import React from 'react';
import { LogEntry, LogSeverity } from '../../store/gameStore';

interface LogFiltersProps {
  filter: LogEntry['type'] | 'all';
  setFilter: (filter: LogEntry['type'] | 'all') => void;
  severityFilter: LogSeverity | 'all';
  setSeverityFilter: (severity: LogSeverity | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({
  filter,
  setFilter,
  severityFilter,
  setSeverityFilter,
  searchTerm,
  setSearchTerm,
}) => {
  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="p-4 border-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex space-x-2">
              {['all', 'error', 'warning', 'info'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type as any)}
                  className={`px-3 py-1 rounded ${
                    filter === type
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
            <div className="flex space-x-2">
              {['all', 'low', 'medium', 'high'].map((severity) => (
                <button
                  key={severity}
                  onClick={() => setSeverityFilter(severity as any)}
                  className={`px-3 py-1 rounded ${
                    severityFilter === severity
                      ? 'bg-gray-200 text-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 