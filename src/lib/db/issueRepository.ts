import { db } from './database';
import type { Issue, IssueStatus, IssueFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const issueRepository = {
  async getByVehicle(vehicleId: string): Promise<Issue[]> {
    return db.issues
      .where('vehicleId')
      .equals(vehicleId)
      .reverse()
      .sortBy('createdAt');
  },

  async getByVehicleAndStatus(vehicleId: string, status: IssueStatus): Promise<Issue[]> {
    return db.issues
      .where('[vehicleId+status]')
      .equals([vehicleId, status])
      .reverse()
      .sortBy('createdAt');
  },

  async getById(id: string): Promise<Issue | undefined> {
    return db.issues.get(id);
  },

  async getAll(): Promise<Issue[]> {
    return db.issues.toArray();
  },

  async create(vehicleId: string, data: IssueFormData): Promise<Issue> {
    const now = nowISO();
    const issue: Issue = {
      id: generateId(),
      vehicleId,
      title: data.title,
      description: data.description,
      status: 'open',
      severity: data.severity,
      cost: null,
      serviceProvider: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await db.issues.add(issue);
    return issue;
  },

  async updateStatus(id: string, status: IssueStatus, resolvedAt?: string): Promise<void> {
    const updates: Partial<Issue> = { status, updatedAt: nowISO() };
    if (resolvedAt) updates.resolvedAt = resolvedAt;
    await db.issues.update(id, updates);
  },

  async updateResolution(
    id: string,
    cost: number | null,
    serviceProvider: string | null,
  ): Promise<void> {
    await db.issues.update(id, { cost, serviceProvider, updatedAt: nowISO() });
  },

  async remove(id: string): Promise<void> {
    await db.issueUpdates.where('issueId').equals(id).delete();
    await db.issues.delete(id);
  },
};
