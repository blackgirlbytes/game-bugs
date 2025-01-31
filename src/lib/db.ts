import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

try {
  // Create database in the project root directory
  const dbPath = path.join(process.cwd(), 'game-logs.db');
  console.log('Initializing database at:', dbPath);
  
  // Ensure the database directory exists and is writable
  const fs = require('fs');
  const dbDir = path.dirname(dbPath);
  
  try {
    // Test write access to directory
    fs.accessSync(dbDir, fs.constants.W_OK);
  } catch (e) {
    throw new Error(`No write access to database directory ${dbDir}: ${e.message}`);
  }

  // Initialize database with verbose error handling
  try {
    db = new Database(dbPath, { verbose: console.log });
  } catch (e) {
    throw new Error(`Failed to create/open database at ${dbPath}: ${e.message}`);
  }

  // Create tables if they don't exist
  try {
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
  } catch (e) {
    throw new Error(`Failed to create game_logs table: ${e.message}`);
  }

  // Verify database is working
  try {
    const test = db.prepare('SELECT 1').get();
    console.log('Database connection test successful');
  } catch (e) {
    throw new Error(`Database connection test failed: ${e.message}`);
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

// Helper functions for common database operations
export const insertLog = db.prepare(`
  INSERT INTO game_logs (id, timestamp, type, message, severity, category, details, stack, user_agent, game_state)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export const getAllLogs = db.prepare(`
  SELECT * FROM game_logs ORDER BY timestamp DESC
`);

export const getLogsByType = db.prepare(`
  SELECT * FROM game_logs WHERE type = ? ORDER BY timestamp DESC
`);

export const getLogsBySeverity = db.prepare(`
  SELECT * FROM game_logs WHERE severity = ? ORDER BY timestamp DESC
`);

export const clearAllLogs = db.prepare(`
  DELETE FROM game_logs
`);

export const getLogStats = db.prepare(`
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

export default db;