import { writable } from 'svelte/store';
import type { Vehicle, AppSettings } from '$lib/types';
import { settingsRepository } from '$lib/db/settingsRepository';

export const currentVehicle = writable<Vehicle | null>(null);
export const currentTab = writable<string>('dashboard');
export const editVehicleId = writable<string | null>(null);
export const editMaintenanceItemId = writable<string | null>(null);
export const editIssueId = writable<string | null>(null);

export const settings = writable<AppSettings>({
  id: 'global',
  odometerUnit: 'mi',
  theme: 'system',
});

export async function loadSettings() {
  settings.set(await settingsRepository.get());
}

export function formatOdometerValue(value: number, unit: 'mi' | 'km'): string {
  return `${value.toLocaleString()} ${unit}`;
}
