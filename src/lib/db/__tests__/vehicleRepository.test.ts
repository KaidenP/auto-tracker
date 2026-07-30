import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTrackerDB } from '../database';
import { vehicleRepository } from '../vehicleRepository';

describe('vehicleRepository', () => {
  beforeEach(async () => {
    const db = new AutoTrackerDB();
    await db.delete();
    db.open();
  });

  it('creates and retrieves a vehicle', async () => {
    const vehicle = await vehicleRepository.create({
      name: 'My Car',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '1HGCM82633A004352',
      licensePlate: 'ABC123',
      notes: 'Test vehicle',
    });

    expect(vehicle.id).toBeTruthy();
    expect(vehicle.name).toBe('My Car');
    expect(vehicle.make).toBe('Toyota');

    const retrieved = await vehicleRepository.getById(vehicle.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('My Car');
  });

  it('updates a vehicle', async () => {
    const vehicle = await vehicleRepository.create({
      name: 'My Car',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '',
      licensePlate: '',
      notes: '',
    });

    await vehicleRepository.update(vehicle.id, { name: 'My Updated Car' });
    const updated = await vehicleRepository.getById(vehicle.id);
    expect(updated!.name).toBe('My Updated Car');
  });

  it('deletes a vehicle with cascading data', async () => {
    const vehicle = await vehicleRepository.create({
      name: 'To Delete',
      make: 'Test',
      model: 'Test',
      year: 2020,
      vin: '',
      licensePlate: '',
      notes: '',
    });

    await vehicleRepository.remove(vehicle.id);
    const retrieved = await vehicleRepository.getById(vehicle.id);
    expect(retrieved).toBeUndefined();
  });

  it('gets all vehicles ordered by name', async () => {
    await vehicleRepository.create({ name: 'Z Car', make: '', model: '', year: 2020, vin: '', licensePlate: '', notes: '' });
    await vehicleRepository.create({ name: 'A Car', make: '', model: '', year: 2020, vin: '', licensePlate: '', notes: '' });

    const all = await vehicleRepository.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].name).toBe('A Car');
    expect(all[1].name).toBe('Z Car');
  });
});
