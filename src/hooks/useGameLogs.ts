import { useState, useCallback } from 'react';

interface GameLog {
  id: number;
  created_at: string;
  game_id: string | null;
  action: string;
  details: any;
  user_id: string | null;
}

interface CreateLogData {
  gameId?: string;
  action: string;
  details?: any;
  userId?: string;
}

export function useGameLogs() {
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (gameId?: string) => {
    try {
      setLoading(true);
      const url = gameId ? `/api/logs?gameId=${gameId}` : '/api/logs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const createLog = useCallback(async (data: CreateLogData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to create log');
      
      // Refresh logs after creating new one
      await fetchLogs(data.gameId);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    fetchLogs,
    createLog,
  };
}