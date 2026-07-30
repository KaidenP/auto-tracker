import { db } from './database';
import type { Vehicle, VehicleFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const vehicleRepository = {
  async getAll(): Promise<Vehicle[]> {
    return db.vehicles.orderBy('name').toArray();
  },

  async getById(id: string): Promise<Vehicle | undefined> {
    return db.vehicles.get(id);
  },

  async create(data: VehicleFormData): Promise<Vehicle> {
    const now = nowISO();
    const vehicle: Vehicle = {
      id: generateId(),
      ...data,
      year: data.year || 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.vehicles.add(vehicle);
    return vehicle;
  },

  async update(id: string, data: Partial<VehicleFormData>): Promise<void> {
    const updates: Partial<Vehicle> = { updatedAt: nowISO() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.make !== undefined) updates.make = data.make;
    if (data.model !== undefined) updates.model = data.model;
    if (data.year !== undefined) updates.year = data.year || 0;
    if (data.vin !== undefined) updates.vin = data.vin;
    if (data.licensePlate !== undefined) updates.licensePlate = data.licensePlate;
    if (data.notes !== undefined) updates.notes = data.notes;
    await db.vehicles.update(id, updates);
  },

  async remove(id: string): Promise<void> {
    await db.transaction('rw', [db.vehicles, db.odometerReadings, db.maintenanceItems, db.maintenanceRecords, db.issues, db.issueUpdates], async () => {
      await db.odometerReadings.where('vehicleId').equals(id).delete();
      const items = await db.maintenanceItems.where('vehicleId').equals(id).toArray();
      const itemIds = items.map((i) => i.id);
      await db.maintenanceRecords.where('maintenanceItemId').anyOf(itemIds).delete();
      await db.maintenanceItems.where('vehicleId').equals(id).delete();
      const issues = await db.issues.where('vehicleId').equals(id).toArray();
      const issueIds = issues.map((i) => i.id);
      await db.issueUpdates.where('issueId').anyOf(issueIds).delete();
      await db.issues.where('vehicleId').equals(id).delete();
      await db.vehicles.delete(id);
    });
  },
};
