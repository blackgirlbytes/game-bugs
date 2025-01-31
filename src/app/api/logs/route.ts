import { NextResponse } from 'next/server';
import { insertLog, getAllLogs, getLogsByType, getLogsBySeverity, clearAllLogs, getLogStats } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const log = await request.json();
    console.log('Received log data:', log); // Debug log

    // Validate required fields
    if (!log.id || !log.type || !log.message || !log.severity || !log.category) {
      console.error('Missing required fields:', { log });
      return NextResponse.json(
        { error: 'Missing required fields in log data' },
        { status: 400 }
      );
    }

    // Safely prepare game state
    let gameStateStr = null;
    if (log.gameState) {
      try {
        gameStateStr = JSON.stringify(log.gameState);
      } catch (e) {
        console.error('Error stringifying game state:', e);
        return NextResponse.json(
          { error: 'Invalid game state data' },
          { status: 400 }
        );
      }
    }

    const result = insertLog.run(
      log.id,
      new Date(log.timestamp).toISOString(),
      log.type,
      log.message,
      log.severity,
      log.category,
      JSON.stringify(log.details || null),
      log.stack || null,
      log.userAgent || null,
      gameStateStr
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error creating log', details: errorMessage }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all logs
    const logs = getAllLogs.all();

    // Parse JSON strings back to objects
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      gameState: log.game_state ? JSON.parse(log.game_state) : null,
      // Ensure timestamp is properly formatted
      timestamp: new Date(log.timestamp),
    }));

    return NextResponse.json(parsedLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Error fetching logs', details: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearAllLogs.run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Error clearing logs' }, 
      { status: 500 }
    );
  }
}