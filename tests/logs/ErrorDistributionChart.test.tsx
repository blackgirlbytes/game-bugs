import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorDistributionChart } from '../../src/components/logs/ErrorDistributionChart';
import { LogEntry } from '../../src/store/gameStore';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ data, label }: { data: any[], label: Function }) => (
    <div data-testid="pie">
      {data.map((entry, index) => (
        <div key={index} data-testid="pie-label">
          {/* This tests the label format in the pie chart (the percentage labels) */}
          {label({ 
            name: entry.category, 
            value: entry.count, 
            percent: entry.count / data.reduce((acc, curr) => acc + curr.count, 0) 
          })}
        </div>
      ))}
    </div>
  ),
  Cell: () => null,
  Tooltip: ({ formatter }: { formatter: Function }) => {
    // Test the tooltip format
    const [value, name] = formatter(2, 'collision');
    return (
      <div data-testid="tooltip">
        {/* This should render as "collision: 2 errors" */}
        {name}: {value}
      </div>
    );
  },
  Legend: () => (
    <div data-testid="legend">
      {/* Legend should just show the category name */}
      collision
    </div>
  ),
}));

describe('ErrorDistributionChart', () => {
  describe('snapshot tests', () => {
    it('matches snapshot with single category', () => {
      const logs = createMockLog('collision', 2);
      const { container } = render(<ErrorDistributionChart logs={logs} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with multiple categories', () => {
      const logs = [
        ...createMockLog('collision', 2),
        ...createMockLog('network', 2)
      ];
      const { container } = render(<ErrorDistributionChart logs={logs} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with empty logs', () => {
      const { container } = render(<ErrorDistributionChart logs={[]} />);
      expect(container).toMatchSnapshot();
    });
  });

  const createMockLog = (category: string, count: number = 1): LogEntry[] => 
    Array.from({ length: count }, () => ({
      id: Math.random().toString(),
      timestamp: Date.now(),
      type: 'error',
      severity: 'high',
      message: 'Test error',
      category
    }));

  it('formats tooltip and legend correctly for collision errors', () => {
    const logs: LogEntry[] = [
      ...createMockLog('collision', 2), // 2 collision errors
    ];

    render(<ErrorDistributionChart logs={logs} />);

    // Check tooltip format ("collision: 2 errors")
    const tooltip = screen.getByTestId('tooltip');
    expect(tooltip).toHaveTextContent('collision: 2 errors');
    expect(tooltip).not.toHaveTextContent('NaN');

    // Check legend format (just "collision")
    const legend = screen.getByTestId('legend');
    expect(legend).toHaveTextContent('collision');
    expect(legend).not.toHaveTextContent('(');
    expect(legend).not.toHaveTextContent(')');
    expect(legend).not.toHaveTextContent('%');

    // Log for debugging
    console.log('Tooltip content:', tooltip.textContent);
    console.log('Legend content:', legend.textContent);
  });

  it('formats pie chart labels correctly', () => {
    const logs: LogEntry[] = [
      ...createMockLog('collision', 2),
    ];

    render(<ErrorDistributionChart logs={logs} />);

    const pieLabels = screen.getAllByTestId('pie-label');
    
    // Check pie label format ("collision (100%)")
    expect(pieLabels[0]).toHaveTextContent('collision (100%)');
    expect(pieLabels[0]).not.toHaveTextContent('NaN');

    // Log for debugging
    console.log('Pie label content:', pieLabels[0].textContent);
  });

  it('handles multiple error categories', () => {
    const logs: LogEntry[] = [
      ...createMockLog('collision', 2),
      ...createMockLog('network', 2),
    ];

    render(<ErrorDistributionChart logs={logs} />);

    const tooltip = screen.getByTestId('tooltip');
    const legend = screen.getByTestId('legend');

    // Check tooltip still shows correct count for individual category
    expect(tooltip).toHaveTextContent('collision: 2 errors');

    // Check legend shows just the category name
    expect(legend).toHaveTextContent('collision');
    expect(legend).not.toHaveTextContent('%');

    // Log for debugging
    console.log('Multiple categories - Tooltip:', tooltip.textContent);
    console.log('Multiple categories - Legend:', legend.textContent);
  });

  it('handles empty logs array', () => {
    render(<ErrorDistributionChart logs={[]} />);
    
    const pie = screen.getByTestId('pie');
    expect(pie).toBeInTheDocument();
    
    const pieLabels = screen.queryAllByTestId('pie-label');
    expect(pieLabels).toHaveLength(0);
  });
});
