import { prepareErrorDistribution } from '../../src/utils/logUtils';
import { LogEntry } from '../../src/store/gameStore';

describe('prepareErrorDistribution', () => {
  describe('snapshot tests', () => {
    it('matches data snapshot for multiple categories', () => {
      const logs: LogEntry[] = [
        createMockLog('database'),
        createMockLog('database'),
        createMockLog('network'),
        createMockLog('validation'),
        createMockLog('validation'),
        createMockLog('validation'),
      ];
      const result = prepareErrorDistribution(logs);
      expect(result).toMatchSnapshot();
    });

    it('matches data snapshot for empty logs', () => {
      const result = prepareErrorDistribution([]);
      expect(result).toMatchSnapshot();
    });
  });

  // Helper to create mock logs
  const createMockLog = (category: string, type: 'error' = 'error'): LogEntry => ({
    id: Math.random().toString(),
    timestamp: Date.now(),
    type,
    severity: 'high',
    message: 'Test error',
    category
  });

  it('correctly counts errors by category', () => {
    const logs: LogEntry[] = [
      createMockLog('database'),
      createMockLog('database'),
      createMockLog('network'),
      createMockLog('validation'),
      createMockLog('validation'),
      createMockLog('validation'),
      // Add a non-error log that should be ignored
      createMockLog('network', 'info')
    ];

    const result = prepareErrorDistribution(logs);

    // Verify counts
    const databaseErrors = result.find(item => item.category === 'database');
    const networkErrors = result.find(item => item.category === 'network');
    const validationErrors = result.find(item => item.category === 'validation');

    expect(databaseErrors?.count).toBe(2);
    expect(networkErrors?.count).toBe(1);
    expect(validationErrors?.count).toBe(3);

    // Verify no NaN values
    result.forEach(item => {
      expect(Number.isNaN(item.count)).toBe(false);
      expect(typeof item.count).toBe('number');
      expect(item.count).toBeGreaterThan(0);
    });

    // Log results for debugging
    console.log('Error distribution:', result);
  });

  it('handles empty logs array', () => {
    const result = prepareErrorDistribution([]);
    
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('only counts error type logs', () => {
    const logs: LogEntry[] = [
      createMockLog('database'),
      createMockLog('database', 'info'),
      createMockLog('database', 'warning'),
      createMockLog('network'),
      createMockLog('network', 'info')
    ];

    const result = prepareErrorDistribution(logs);

    // Should only count error types
    const databaseErrors = result.find(item => item.category === 'database');
    const networkErrors = result.find(item => item.category === 'network');

    expect(databaseErrors?.count).toBe(1);
    expect(networkErrors?.count).toBe(1);

    // Verify no NaN values
    result.forEach(item => {
      expect(Number.isNaN(item.count)).toBe(false);
      expect(typeof item.count).toBe('number');
    });
  });

  it('returns top 10 categories when there are more than 10', () => {
    const logs: LogEntry[] = Array.from({ length: 15 }, (_, i) => 
      createMockLog(`category${i + 1}`)
    );

    const result = prepareErrorDistribution(logs);

    // Should only return top 10 categories
    expect(result.length).toBeLessThanOrEqual(10);

    // Verify no NaN values
    result.forEach(item => {
      expect(Number.isNaN(item.count)).toBe(false);
      expect(typeof item.count).toBe('number');
      expect(item.count).toBe(1); // Each category should have 1 error
    });
  });

  it('sorts categories by count in descending order', () => {
    const logs: LogEntry[] = [
      createMockLog('category1'),
      createMockLog('category1'),
      createMockLog('category1'),
      createMockLog('category2'),
      createMockLog('category2'),
      createMockLog('category3'),
    ];

    const result = prepareErrorDistribution(logs);

    // Verify order
    expect(result[0].category).toBe('category1');
    expect(result[0].count).toBe(3);
    expect(result[1].category).toBe('category2');
    expect(result[1].count).toBe(2);
    expect(result[2].category).toBe('category3');
    expect(result[2].count).toBe(1);

    // Verify counts are in descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i].count).toBeLessThanOrEqual(result[i-1].count);
    }

    // Verify no NaN values
    result.forEach(item => {
      expect(Number.isNaN(item.count)).toBe(false);
      expect(typeof item.count).toBe('number');
    });
  });
});
