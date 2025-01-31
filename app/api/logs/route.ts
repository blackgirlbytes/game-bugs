import { NextResponse } from 'next/server';
import * as db from '../../lib/db';

export async function GET() {
  try {
    // Get all logs
    const logs = db.getAllLogs();
    console.log('Fetched logs:', logs); // Debug log

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
    return NextResponse.json(
      { error: 'Error fetching logs', details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const log = await request.json();
    console.log('Received log data:', log); // Debug log

    // Validate required fields
    if (!log.id || !log.type || !log.message || !log.severity || !log.category) {
      console.error('Missing required fields:', { log });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the log
    const result = db.insertLog(
      log.id,
      new Date(log.timestamp).toISOString(),
      log.type,
      log.message,
      log.severity,
      log.category,
      JSON.stringify(log.details || null),
      log.stack || null,
      log.userAgent || null,
      JSON.stringify(log.gameState || null)
    );
    
    console.log('Log inserted successfully:', result); // Debug log
    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    console.error('Error creating log:', error);
    return NextResponse.json(
      { 
        error: 'Error creating log', 
        details: error.message,
        stack: error.stack 
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    db.clearAllLogs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      { error: 'Error clearing logs', details: error.message }, 
      { status: 500 }
    );
  }
}