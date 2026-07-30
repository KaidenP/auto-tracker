import Dexie, { type Table } from 'dexie';
import type {
  Vehicle,
  OdometerReading,
  MaintenanceItem,
  MaintenanceRecord,
  Issue,
  IssueUpdate,
  AppSettings,
} from '$lib/types';

export class AutoTrackerDB extends Dexie {
  vehicles!: Table<Vehicle, string>;
  odometerReadings!: Table<OdometerReading, string>;
  maintenanceItems!: Table<MaintenanceItem, string>;
  maintenanceRecords!: Table<MaintenanceRecord, string>;
  issues!: Table<Issue, string>;
  issueUpdates!: Table<IssueUpdate, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('AutoTracker');

    this.version(1).stores({
      vehicles: 'id, name, make, model, year',
      odometerReadings: 'id, vehicleId, date, value, [vehicleId+date], [vehicleId+value]',
      maintenanceItems: 'id, vehicleId, name, [vehicleId+name]',
      maintenanceRecords: 'id, vehicleId, maintenanceItemId, completedDate, [vehicleId+date], [maintenanceItemId+date]',
      issues: 'id, vehicleId, status, createdAt, [vehicleId+status], [vehicleId+createdAt]',
      issueUpdates: 'id, issueId, createdAt, [issueId+createdAt]',
      settings: 'id',
    });
  }
}

export const db = new AutoTrackerDB();
