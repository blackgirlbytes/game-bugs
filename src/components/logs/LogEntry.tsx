import React from 'react';
import { Clock, Tag } from 'lucide-react';
import { LogEntry as LogEntryType } from '../../store/gameStore';
import { LogIcon } from './LogIcon';
import { SeverityBadge } from './SeverityBadge';

export const LogEntryComponent: React.FC<{ log: LogEntryType; use24Hour?: boolean }> = ({ log, use24Hour = false }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(use24Hour ? 'en-GB' : 'en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24Hour,
      timeZone: 'UTC'
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
      <div className="flex items-start gap-4">
        <LogIcon type={log.type} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium">{log.message}</h3>
            <SeverityBadge severity={log.severity} />
            <span className="text-sm text-gray-500">
              <Tag className="w-4 h-4 inline mr-1" />
              {log.category}
            </span>
          </div>
          <div className="flex items-center text-gray-500 text-sm mb-2">
            <Clock className="w-4 h-4 mr-1" />
            {formatTimestamp(log.timestamp)}
          </div>
          {log.gameState && (
            <div className="mb-2 text-sm text-gray-600">
              Game State: Score: {log.gameState.score}, Length: {log.gameState.snakeLength}
            </div>
          )}
          {log.details && (
            <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
          {log.stack && (
            <div className="mt-2 p-2 bg-red-50 rounded text-sm overflow-x-auto font-mono">
              {log.stack}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
