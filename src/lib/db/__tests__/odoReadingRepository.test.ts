import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTrackerDB } from '../database';
import { vehicleRepository } from '../vehicleRepository';
import { odoReadingRepository } from '../odoReadingRepository';

describe('odoReadingRepository', () => {
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

  it('creates and retrieves odometer readings', async () => {
    await odoReadingRepository.create(vehicleId, { value: 1000, date: '2024-01-01', notes: 'First' });
    await odoReadingRepository.create(vehicleId, { value: 2000, date: '2024-06-01', notes: 'Second' });

    const readings = await odoReadingRepository.getByVehicle(vehicleId);
    expect(readings).toHaveLength(2);
  });

  it('returns latest reading', async () => {
    await odoReadingRepository.create(vehicleId, { value: 1000, date: '2024-01-01', notes: '' });
    await odoReadingRepository.create(vehicleId, { value: 2000, date: '2024-06-01', notes: '' });

    const latest = await odoReadingRepository.getLatest(vehicleId);
    expect(latest).toBeDefined();
    expect(latest!.value).toBe(2000);
  });
});
