import { db } from './database';
import type { MaintenanceItem, MaintenanceItemFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const maintenanceItemRepository = {
  async getByVehicle(vehicleId: string): Promise<MaintenanceItem[]> {
    return db.maintenanceItems
      .where('vehicleId')
      .equals(vehicleId)
      .toArray();
  },

  async getAll(): Promise<MaintenanceItem[]> {
    return db.maintenanceItems.toArray();
  },

  async getById(id: string): Promise<MaintenanceItem | undefined> {
    return db.maintenanceItems.get(id);
  },

  async create(vehicleId: string, data: MaintenanceItemFormData): Promise<MaintenanceItem> {
    const now = nowISO();
    const item: MaintenanceItem = {
      id: generateId(),
      vehicleId,
      name: data.name,
      description: data.description,
      intervalOdometer: data.intervalOdometer || null,
      intervalDays: data.intervalDays || null,
      lastCompletedDate: null,
      lastCompletedOdometer: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.maintenanceItems.add(item);
    return item;
  },

  async update(id: string, data: Partial<MaintenanceItemFormData>): Promise<void> {
    const updates: Partial<MaintenanceItem> = { updatedAt: nowISO() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.intervalOdometer !== undefined) updates.intervalOdometer = data.intervalOdometer || null;
    if (data.intervalDays !== undefined) updates.intervalDays = data.intervalDays || null;
    await db.maintenanceItems.update(id, updates);
  },

  async updateCompletion(
    id: string,
    lastCompletedDate: string,
    lastCompletedOdometer: number,
  ): Promise<void> {
    await db.maintenanceItems.update(id, {
      lastCompletedDate,
      lastCompletedOdometer,
      updatedAt: nowISO(),
    });
  },

  async remove(id: string): Promise<void> {
    await db.maintenanceItems.delete(id);
  },
};
