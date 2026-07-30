import { describe, it, expect, beforeEach } from 'vitest';
import { AutoTrackerDB } from '../database';
import { vehicleRepository } from '../vehicleRepository';
import { issueRepository } from '../issueRepository';

describe('issueRepository', () => {
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

  it('creates an issue', async () => {
    const issue = await issueRepository.create(vehicleId, {
      title: 'Check Engine Light',
      description: 'Light came on',
      severity: 'high',
    });

    expect(issue.title).toBe('Check Engine Light');
    expect(issue.status).toBe('open');
    expect(issue.severity).toBe('high');
  });

  it('updates issue status', async () => {
    const issue = await issueRepository.create(vehicleId, {
      title: 'Strange Noise', description: '', severity: 'medium',
    });

    await issueRepository.updateStatus(issue.id, 'in-progress');
    const updated = await issueRepository.getById(issue.id);
    expect(updated!.status).toBe('in-progress');
  });

  it('filters issues by status', async () => {
    const i1 = await issueRepository.create(vehicleId, { title: 'Issue 1', description: '', severity: 'low' });
    await issueRepository.create(vehicleId, { title: 'Issue 2', description: '', severity: 'medium' });
    await issueRepository.updateStatus(i1.id, 'closed');

    const openIssues = await issueRepository.getByVehicleAndStatus(vehicleId, 'open');
    expect(openIssues).toHaveLength(1);
  });
});
