import { db } from '$lib/db/database';
import { settingsRepository } from '$lib/db/settingsRepository';
import type { ExportData } from '$lib/types';

export async function exportAllData(): Promise<string> {
  const vehicles = await db.vehicles.toArray();
  const odometerReadings = await db.odometerReadings.toArray();
  const maintenanceItems = await db.maintenanceItems.toArray();
  const maintenanceRecords = await db.maintenanceRecords.toArray();
  const issues = await db.issues.toArray();
  const issueUpdates = await db.issueUpdates.toArray();
  const settings = await settingsRepository.get();

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    vehicles,
    odometerReadings,
    maintenanceItems,
    maintenanceRecords,
    issues,
    issueUpdates,
    settings: settings.id === 'global' ? settings : null,
  };

  return JSON.stringify(data, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  let data: ExportData;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!data.version || data.version !== 1) {
    throw new Error('Unsupported export format version');
  }

  if (!Array.isArray(data.vehicles)) {
    throw new Error('Invalid export data: missing vehicles');
  }

  await db.transaction(
    'rw',
    [
      db.vehicles,
      db.odometerReadings,
      db.maintenanceItems,
      db.maintenanceRecords,
      db.issues,
      db.issueUpdates,
      db.settings,
    ],
    async () => {
      await db.vehicles.clear();
      await db.odometerReadings.clear();
      await db.maintenanceItems.clear();
      await db.maintenanceRecords.clear();
      await db.issues.clear();
      await db.issueUpdates.clear();
      await db.settings.clear();

      if (data.vehicles.length > 0) await db.vehicles.bulkAdd(data.vehicles);
      if (data.odometerReadings.length > 0) await db.odometerReadings.bulkAdd(data.odometerReadings);
      if (data.maintenanceItems.length > 0) await db.maintenanceItems.bulkAdd(data.maintenanceItems);
      if (data.maintenanceRecords.length > 0) await db.maintenanceRecords.bulkAdd(data.maintenanceRecords);
      if (data.issues.length > 0) await db.issues.bulkAdd(data.issues);
      if (data.issueUpdates.length > 0) await db.issueUpdates.bulkAdd(data.issueUpdates);
      if (data.settings) await db.settings.put(data.settings);
    },
  );
}
