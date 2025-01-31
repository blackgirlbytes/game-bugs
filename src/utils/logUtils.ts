import { LogEntry } from '../store/gameStore';

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

export const prepareTimeSeriesData = (logs: LogEntry[]): TimeSeriesData[] => {
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
  
  return Array.from(timeMap.entries())
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
};

export const prepareErrorDistribution = (logs: LogEntry[]): ErrorDistributionData[] => {
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