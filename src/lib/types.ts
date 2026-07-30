export type OdometerUnit = 'mi' | 'km';
export type ThemeMode = 'system' | 'light' | 'dark';
export type IssueStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IssueUpdateType = 'note' | 'status-change' | 'repair';
export type DueStatus = 'ok' | 'due-soon' | 'overdue' | 'never';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OdometerReading {
  id: string;
  vehicleId: string;
  value: number;
  unit: OdometerUnit;
  date: string;
  notes: string;
  createdAt: string;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  name: string;
  description: string;
  intervalOdometer: number | null;
  intervalDays: number | null;
  lastCompletedDate: string | null;
  lastCompletedOdometer: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  maintenanceItemId: string;
  completedDate: string;
  completedOdometer: number;
  cost: number | null;
  serviceProvider: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Issue {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  status: IssueStatus;
  severity: Severity;
  cost: number | null;
  serviceProvider: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueUpdate {
  id: string;
  issueId: string;
  type: IssueUpdateType;
  description: string;
  previousStatus: string | null;
  newStatus: string | null;
  createdAt: string;
}

export interface AppSettings {
  id: 'global';
  odometerUnit: OdometerUnit;
  theme: ThemeMode;
}

export interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  year: number | '';
  vin: string;
  licensePlate: string;
  notes: string;
}

export interface OdometerFormData {
  value: number | '';
  date: string;
  notes: string;
}

export interface MaintenanceItemFormData {
  name: string;
  description: string;
  intervalOdometer: number | '';
  intervalDays: number | '';
}

export interface LogCompletionFormData {
  completedDate: string;
  completedOdometer: number | '';
  cost: number | '';
  serviceProvider: string;
  notes: string;
}

export interface IssueFormData {
  title: string;
  description: string;
  severity: Severity;
}

export interface IssueUpdateFormData {
  type: IssueUpdateType;
  description: string;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  vehicles: Vehicle[];
  odometerReadings: OdometerReading[];
  maintenanceItems: MaintenanceItem[];
  maintenanceRecords: MaintenanceRecord[];
  issues: Issue[];
  issueUpdates: IssueUpdate[];
  settings: AppSettings | null;
}
