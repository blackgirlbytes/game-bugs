import React from 'react';
import { render, screen } from '@testing-library/react';
import { LogEntryComponent } from '../../src/components/logs/LogEntry';
import { LogEntry } from '../../src/store/gameStore';

// Mock the Lucide icons
jest.mock('lucide-react', () => ({
  Clock: () => null,
  Tag: () => null
}));

// Mock the sub-components
jest.mock('../../src/components/logs/LogIcon', () => ({
  LogIcon: () => null
}));

jest.mock('../../src/components/logs/SeverityBadge', () => ({
  SeverityBadge: () => null
}));

describe('LogEntryComponent', () => {
  describe('snapshot tests', () => {
    const testDate = new Date('2024-02-20T15:00:00Z');
    const mockLog: LogEntry = {
      id: '1',
      timestamp: testDate.getTime(),
      type: 'info',
      severity: 'low',
      message: 'Test message',
      category: 'test',
    };

    it('matches snapshot with 12-hour format', () => {
      const { container } = render(<LogEntryComponent log={mockLog} use24Hour={false} />);
      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with 24-hour format', () => {
      const { container } = render(<LogEntryComponent log={mockLog} use24Hour={true} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('time format tests', () => {
    const testDate = new Date('2024-02-20T15:00:00Z'); // 3:00 PM UTC

    const mockLog: LogEntry = {
      id: '1',
      timestamp: testDate.getTime(),
      type: 'info',
      severity: 'low',
      message: 'Test message',
      category: 'test',
    };

    it('displays time in 12-hour format and not UTC', () => {
      render(<LogEntryComponent log={mockLog} use24Hour={false} />);

      // Get the UTC time string
      const utcTimeString = testDate.toUTCString();

      // Get the local 12-hour format time as it should appear
      const expectedTime = testDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'America/New_York'
      });

      // Find the time element
      const timeElement = screen.getByText(expectedTime);

      // Verify we found the time element
      expect(timeElement).toBeInTheDocument();

      // Verify it's not showing UTC time
      expect(timeElement.textContent).not.toBe(utcTimeString);

      // Log times for debugging
      console.log('UTC time:', utcTimeString);
      console.log('Expected local 12-hour time:', expectedTime);
      console.log('Displayed time:', timeElement.textContent);

      // Verify AM/PM format
      expect(timeElement.textContent).toMatch(/(AM|PM)/);
    });

    it('displays time in 24-hour format and not UTC', () => {
      render(<LogEntryComponent log={mockLog} use24Hour={true} />);

      // Get the UTC time string
      const utcTimeString = testDate.toUTCString();

      // Get the expected local 24-hour format time
      const expectedTime = testDate.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/New_York'
      });

      // Find the time element
      const timeElement = screen.getByText(expectedTime);

      // Verify we found the time element
      expect(timeElement).toBeInTheDocument();

      // Verify it's not showing UTC time
      expect(timeElement.textContent).not.toBe(utcTimeString);

      // Log times for debugging
      console.log('UTC time:', utcTimeString);
      console.log('Expected local 24-hour time:', expectedTime);
      console.log('Displayed time:', timeElement.textContent);

      // Verify 24-hour format (should not contain AM/PM)
      expect(timeElement.textContent).not.toMatch(/(AM|PM)/);
    });
  });
});
