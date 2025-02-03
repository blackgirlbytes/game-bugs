import { prepareTimeSeriesData } from '../../src/utils/logUtils';
import { LogEntry } from '../../src/store/gameStore';

describe('prepareTimeSeriesData time window calculations', () => {
  // Helper to create mock logs with specific timestamps
  const createMockLog = (timestamp: number): LogEntry => ({
    id: Math.random().toString(),
    timestamp,
    type: 'error',
    severity: 'high',
    message: 'Test error',
    category: 'test'
  });

  it('should prevent incorrect time window calculations', () => {
    // Create a fixed time at noon UTC
    const now = new Date('2024-01-01T12:00:00Z').getTime();
    const logs: LogEntry[] = [
      createMockLog(now), // current time
      createMockLog(now - (25 * 60 * 60 * 1000)), // 25 hours ago (should be excluded)
      createMockLog(now - (23 * 60 * 60 * 1000)), // 23 hours ago (should be included)
      createMockLog(now - (12 * 60 * 60 * 1000)), // 12 hours ago (should be included)
    ];

    const result = prepareTimeSeriesData(logs);

    // Verify we have the expected number of 10-minute increments in 24 hours
    // 24 hours * 6 ten-minute increments per hour = 144 increments
    // Plus 1 for the inclusive end point
    expect(result.length).toBe(145);

    // Take a snapshot of the data structure
    expect({
      dataPointCount: result.length,
      // Sample points from throughout the day to verify coverage
      samplePoints: {
        start: result.slice(0, 3).map(r => r.timestamp),
        middle: result.slice(71, 74).map(r => r.timestamp),
        end: result.slice(-3).map(r => r.timestamp)
      },
      // Count the unique hours to verify 24-hour coverage
      uniqueHours: new Set(
        result.map(r => r.timestamp.match(/\d+:/)?.map(h => parseInt(h))[0])
      ).size
    }).toMatchSnapshot('24-hour-window-coverage');

    // Verify we have entries spanning close to 24 hours by checking hour markers
    const timeFormat = /(\d+):(\d+)\s(AM|PM)/;
    
    // Check first entry
    const firstEntry = result[0].timestamp.match(timeFormat);
    expect(firstEntry).toBeTruthy();
    
    // Check last entry
    const lastEntry = result[result.length - 1].timestamp.match(timeFormat);
    expect(lastEntry).toBeTruthy();

    if (firstEntry && lastEntry) {
      const getHour24 = (hour: string, meridiem: string) => {
        const h = parseInt(hour);
        if (meridiem === 'PM' && h !== 12) return h + 12;
        if (meridiem === 'AM' && h === 12) return 0;
        return h;
      };

      const firstHour = getHour24(firstEntry[1], firstEntry[3]);
      const lastHour = getHour24(lastEntry[1], lastEntry[3]);

      // If we're spanning 24 hours, the hours should be the same
      // (allowing for some timezone/DST variance)
      expect(firstHour).toBe(lastHour);
    }

    // Verify we have entries for all 24 hours
    const hours = new Set(
      result.map(r => {
        const match = r.timestamp.match(timeFormat);
        if (match) {
          return getHour24(match[1], match[3]);
        }
        return -1;
      })
    );
    
    // We should have entries for all 24 hours
    expect(hours.size).toBe(24);
  });
});

// Helper function to convert 12-hour format to 24-hour
function getHour24(hour: string, meridiem: string): number {
  const h = parseInt(hour);
  if (meridiem === 'PM' && h !== 12) return h + 12;
  if (meridiem === 'AM' && h === 12) return 0;
  return h;
}