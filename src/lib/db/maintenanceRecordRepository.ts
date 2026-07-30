import { db } from './database';
import type { MaintenanceRecord, LogCompletionFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const maintenanceRecordRepository = {
  async getByVehicle(vehicleId: string): Promise<MaintenanceRecord[]> {
    return db.maintenanceRecords
      .where('vehicleId')
      .equals(vehicleId)
      .reverse()
      .sortBy('completedDate');
  },

  async getByItem(maintenanceItemId: string): Promise<MaintenanceRecord[]> {
    return db.maintenanceRecords
      .where('maintenanceItemId')
      .equals(maintenanceItemId)
      .reverse()
      .sortBy('completedDate');
  },

  async create(
    vehicleId: string,
    maintenanceItemId: string,
    data: LogCompletionFormData,
  ): Promise<MaintenanceRecord> {
    const record: MaintenanceRecord = {
      id: generateId(),
      vehicleId,
      maintenanceItemId,
      completedDate: data.completedDate,
      completedOdometer: data.completedOdometer as number,
      cost: data.cost || null,
      serviceProvider: data.serviceProvider || null,
      notes: data.notes || null,
      createdAt: nowISO(),
    };
    await db.maintenanceRecords.add(record);
    return record;
  },

  async remove(id: string): Promise<void> {
    await db.maintenanceRecords.delete(id);
  },
};
