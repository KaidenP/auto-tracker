import { describe, it, expect } from 'vitest';
import { computeDueStatus } from '$lib/dueStatus';

describe('computeDueStatus', () => {
  it('returns "never" when no intervals set', () => {
    expect(computeDueStatus({
      intervalOdometer: null,
      intervalDays: null,
      lastCompletedDate: null,
      lastCompletedOdometer: null,
      currentOdometer: 0,
      odometerUnit: 'mi',
    })).toBe('never');
  });

  it('returns "ok" when within intervals', () => {
    expect(computeDueStatus({
      intervalOdometer: 5000,
      intervalDays: 180,
      lastCompletedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastCompletedOdometer: 10000,
      currentOdometer: 11000,
      odometerUnit: 'mi',
    })).toBe('ok');
  });

  it('returns "overdue" when past odometer interval', () => {
    expect(computeDueStatus({
      intervalOdometer: 5000,
      intervalDays: null,
      lastCompletedDate: null,
      lastCompletedOdometer: 10000,
      currentOdometer: 20000,
      odometerUnit: 'mi',
    })).toBe('overdue');
  });

  it('returns "due-soon" when within 10% of odometer interval', () => {
    expect(computeDueStatus({
      intervalOdometer: 5000,
      intervalDays: null,
      lastCompletedDate: null,
      lastCompletedOdometer: 10000,
      currentOdometer: 14500,
      odometerUnit: 'mi',
    })).toBe('due-soon');
  });

  it('returns "overdue" when past day interval', () => {
    expect(computeDueStatus({
      intervalOdometer: null,
      intervalDays: 30,
      lastCompletedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastCompletedOdometer: null,
      currentOdometer: 0,
      odometerUnit: 'mi',
    })).toBe('overdue');
  });
});
