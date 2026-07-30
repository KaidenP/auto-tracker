import { db } from './database';
import type { OdometerReading, OdometerFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const odoReadingRepository = {
  async getByVehicle(vehicleId: string): Promise<OdometerReading[]> {
    return db.odometerReadings
      .where('vehicleId')
      .equals(vehicleId)
      .reverse()
      .sortBy('date');
  },

  async getLatest(vehicleId: string): Promise<OdometerReading | undefined> {
    return db.odometerReadings
      .where('vehicleId')
      .equals(vehicleId)
      .reverse()
      .first();
  },

  async create(vehicleId: string, data: OdometerFormData): Promise<OdometerReading> {
    const reading: OdometerReading = {
      id: generateId(),
      vehicleId,
      value: data.value as number,
      date: data.date,
      notes: data.notes,
      createdAt: nowISO(),
    };
    await db.odometerReadings.add(reading);
    return reading;
  },

  async remove(id: string): Promise<void> {
    await db.odometerReadings.delete(id);
  },
};

export async function getLatestReadings(
  vehicleIds: string[],
): Promise<Map<string, OdometerReading>> {
  const map = new Map<string, OdometerReading>();
  for (const id of vehicleIds) {
    const reading = await odoReadingRepository.getLatest(id);
    if (reading) map.set(id, reading);
  }
  return map;
}
