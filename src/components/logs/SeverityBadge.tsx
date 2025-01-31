import React from 'react';
import { LogSeverity } from '../../store/gameStore';

const colors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
} as const;

export const SeverityBadge: React.FC<{ severity: LogSeverity }> = ({ severity }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[severity]}`}>
      {severity}
    </span>
  );
}; 