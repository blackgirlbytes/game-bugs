import Database from 'better-sqlite3';
import path from 'path';

// Singleton pattern for database connection
let db: Database.Database | null = null;

function getDB() {
  if (!db) {
    try {
      // Create database in the project root directory
      const dbPath = path.join(process.cwd(), 'game-logs.db');
      console.log('Initializing database at:', dbPath);
      
      db = new Database(dbPath);
      
      // Create tables if they don't exist
      db.exec(`
        CREATE TABLE IF NOT EXISTS game_logs (
          id TEXT PRIMARY KEY,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          type TEXT CHECK(type IN ('error', 'info', 'warning')),
          message TEXT,
          severity TEXT CHECK(severity IN ('low', 'medium', 'high')),
          category TEXT,
          details TEXT,
          stack TEXT,
          user_agent TEXT,
          game_state TEXT
        )
      `);
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
  return db;
}

// Helper functions for common database operations
export function insertLog(
  id: string,
  timestamp: string,
  type: string,
  message: string,
  severity: string,
  category: string,
  details: string | null,
  stack: string | null,
  userAgent: string | null,
  gameState: string | null
) {
  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO game_logs (
      id, timestamp, type, message, severity, category, 
      details, stack, user_agent, game_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    id,
    timestamp,
    type,
    message,
    severity,
    category,
    details,
    stack,
    userAgent,
    gameState
  );
}

export function getAllLogs() {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM game_logs ORDER BY timestamp DESC');
  return stmt.all();
}

export function getLogsByType(type: string) {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM game_logs WHERE type = ? ORDER BY timestamp DESC');
  return stmt.all(type);
}

export function getLogsBySeverity(severity: string) {
  const db = getDB();
  const stmt = db.prepare('SELECT * FROM game_logs WHERE severity = ? ORDER BY timestamp DESC');
  return stmt.all(severity);
}

export function clearAllLogs() {
  const db = getDB();
  const stmt = db.prepare('DELETE FROM game_logs');
  return stmt.run();
}

export function getLogStats() {
  const db = getDB();
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warning_count,
      SUM(CASE WHEN type = 'info' THEN 1 ELSE 0 END) as info_count,
      SUM(CASE WHEN severity = 'low' THEN 1 ELSE 0 END) as low_severity_count,
      SUM(CASE WHEN severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_severity_count
    FROM game_logs
  `);
  return stmt.get();
}

// Cleanup function for tests and development
export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}