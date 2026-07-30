import type { DueStatus, OdometerUnit } from '$lib/types';
import { daysBetween, addDays } from '$lib/utils';

export interface DueStatusInput {
  intervalOdometer: number | null;
  intervalDays: number | null;
  lastCompletedDate: string | null;
  lastCompletedOdometer: number | null;
  currentOdometer: number;
  odometerUnit: OdometerUnit;
}

export function computeDueStatus(input: DueStatusInput): DueStatus {
  const { intervalOdometer, intervalDays, lastCompletedDate, lastCompletedOdometer, currentOdometer } = input;

  if (!intervalOdometer && !intervalDays) {
    return 'never';
  }

  let isOverdue = false;
  let isDueSoon = false;

  if (intervalDays && lastCompletedDate) {
    const nextDate = addDays(lastCompletedDate, intervalDays);
    const daysUntilDue = daysBetween(nextDate, new Date().toISOString().split('T')[0]);
    if (daysUntilDue <= 0) {
      isOverdue = true;
    } else if (daysUntilDue <= 30) {
      isDueSoon = true;
    }
  } else if (intervalDays && !lastCompletedDate) {
    const createdDaysAgo = daysBetween(new Date().toISOString().split('T')[0], lastCompletedDate ?? new Date().toISOString());
    if (createdDaysAgo >= intervalDays) {
      isOverdue = true;
    } else if (intervalDays - createdDaysAgo <= 30) {
      isDueSoon = true;
    }
  }

  if (intervalOdometer && lastCompletedOdometer !== null) {
    const odoSinceLast = currentOdometer - lastCompletedOdometer;
    if (odoSinceLast >= intervalOdometer) {
      isOverdue = true;
    } else if (odoSinceLast >= intervalOdometer * 0.9) {
      isDueSoon = true;
    }
  } else if (intervalOdometer && lastCompletedOdometer === null && currentOdometer > 0) {
    if (currentOdometer >= intervalOdometer) {
      isOverdue = true;
    } else if (currentOdometer >= intervalOdometer * 0.9) {
      isDueSoon = true;
    }
  }

  if (isOverdue) return 'overdue';
  if (isDueSoon) return 'due-soon';
  return 'ok';
}

export function dueStatusColor(status: DueStatus): string {
  switch (status) {
    case 'overdue':
      return 'var(--color-danger)';
    case 'due-soon':
      return 'var(--color-warning)';
    case 'ok':
      return 'var(--color-success)';
    default:
      return 'var(--color-muted)';
  }
}

export function dueStatusLabel(status: DueStatus): string {
  switch (status) {
    case 'overdue':
      return 'Overdue';
    case 'due-soon':
      return 'Due Soon';
    case 'ok':
      return 'OK';
    case 'never':
      return 'No Schedule';
  }
}
