import { db } from './database';
import type { AppSettings, OdometerUnit, ThemeMode } from '$lib/types';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  odometerUnit: 'mi',
  theme: 'system',
};

export const settingsRepository = {
  async get(): Promise<AppSettings> {
    const settings = await db.settings.get('global');
    return settings ?? DEFAULT_SETTINGS;
  },

  async update(partial: Partial<Omit<AppSettings, 'id'>>): Promise<void> {
    const current = await this.get();
    const updated: AppSettings = { ...current, ...partial };
    await db.settings.put(updated);
  },

  async setOdometerUnit(unit: OdometerUnit): Promise<void> {
    await this.update({ odometerUnit: unit });
  },

  async setTheme(theme: ThemeMode): Promise<void> {
    await this.update({ theme });
  },

  async reset(): Promise<void> {
    await db.settings.put(DEFAULT_SETTINGS);
  },
};
