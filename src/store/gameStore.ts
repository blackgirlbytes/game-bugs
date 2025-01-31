import { create } from 'zustand';

export type LogSeverity = 'low' | 'medium' | 'high';

export type LogEntry = {
  id: string;
  timestamp: Date;
  type: 'error' | 'info' | 'warning';
  message: string;
  severity: LogSeverity;
  category: string;
  details?: any;
  stack?: string;
  userAgent?: string;
  gameState?: {
    score: number;
    snakeLength: number;
    position: { x: number; y: number };
  };
};

type GameStore = {
  score: number;
  highScore: number;
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => Promise<void>;
  updateScore: (newScore: number) => void;
  clearLogs: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  getLogStats: () => {
    total: number;
    byType: Record<LogEntry['type'], number>;
    bySeverity: Record<LogSeverity, number>;
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  score: 0,
  highScore: 0,
  logs: [],
  loading: false,
  error: null,
  
  addLog: async (entry) => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ...entry,
    };

    try {
      // First, try to persist to SQLite
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLog),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save log');
      }

      // If successful, update Zustand state
      set((state) => ({
        logs: [newLog, ...state.logs],
        error: null
      }));
    } catch (error) {
      console.error('Failed to persist log:', error);
      set({ error: 'Failed to save log to database' });
      throw error; // Re-throw to let the component handle the error
    }
  },

  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      console.log('Fetching logs from API...');
      const response = await fetch('/api/logs');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch logs');
      }
      
      const logs = await response.json();
      console.log('Received logs:', logs);
      
      // Ensure timestamps are Date objects
      const parsedLogs = logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
        gameState: typeof log.game_state === 'string' ? JSON.parse(log.game_state) : log.gameState,
      }));
      
      console.log('Parsed logs:', parsedLogs);
      set({ logs: parsedLogs, loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
        loading: false,
        logs: [] // Clear logs on error to avoid stale data
      });
    }
  },

  updateScore: (newScore) =>
    set((state) => ({
      score: newScore,
      highScore: Math.max(state.highScore, newScore),
    })),

  clearLogs: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/logs', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear logs');
      }
      
      set({ logs: [], loading: false, error: null });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to clear logs',
        loading: false 
      });
      throw error;
    }
  },

  getLogStats: () => {
    const logs = get().logs;
    return {
      total: logs.length,
      byType: logs.reduce((acc, log) => {
        acc[log.type] = (acc[log.type] || 0) + 1;
        return acc;
      }, {} as Record<LogEntry['type'], number>),
      bySeverity: logs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1;
        return acc;
      }, {} as Record<LogSeverity, number>),
    };
  },
}));