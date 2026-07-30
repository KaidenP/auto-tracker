import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTrackerDB } from '../database';
import { vehicleRepository } from '../vehicleRepository';
import { maintenanceItemRepository } from '../maintenanceItemRepository';

describe('maintenanceItemRepository', () => {
  let vehicleId: string;

  beforeEach(async () => {
    const db = new AutoTrackerDB();
    await db.delete();
    db.open();

    const v = await vehicleRepository.create({
      name: 'Test Car', make: 'Test', model: 'Test',
      year: 2020, vin: '', licensePlate: '', notes: '',
    });
    vehicleId = v.id;
  });

  it('creates and retrieves maintenance items', async () => {
    const item = await maintenanceItemRepository.create(vehicleId, {
      name: 'Oil Change',
      description: 'Every 5000 miles',
      intervalOdometer: 5000,
      intervalDays: 180,
    });

    expect(item.name).toBe('Oil Change');
    expect(item.intervalOdometer).toBe(5000);

    const items = await maintenanceItemRepository.getByVehicle(vehicleId);
    expect(items).toHaveLength(1);
  });

  it('updates completion info', async () => {
    const item = await maintenanceItemRepository.create(vehicleId, {
      name: 'Oil Change', description: '', intervalOdometer: 5000, intervalDays: null,
    });

    await maintenanceItemRepository.updateCompletion(item.id, '2024-06-01', 25000);
    const updated = await maintenanceItemRepository.getById(item.id);
    expect(updated!.lastCompletedDate).toBe('2024-06-01');
    expect(updated!.lastCompletedOdometer).toBe(25000);
  });
});
