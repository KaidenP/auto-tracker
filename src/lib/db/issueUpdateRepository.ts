import { db } from './database';
import type { IssueUpdate, IssueUpdateFormData } from '$lib/types';
import { generateId, nowISO } from '$lib/utils';

export const issueUpdateRepository = {
  async getByIssue(issueId: string): Promise<IssueUpdate[]> {
    return db.issueUpdates
      .where('issueId')
      .equals(issueId)
      .sortBy('createdAt');
  },

  async create(
    issueId: string,
    data: IssueUpdateFormData & { previousStatus?: string | null; newStatus?: string | null },
  ): Promise<IssueUpdate> {
    const update: IssueUpdate = {
      id: generateId(),
      issueId,
      type: data.type,
      description: data.description,
      previousStatus: data.previousStatus ?? null,
      newStatus: data.newStatus ?? null,
      createdAt: nowISO(),
    };
    await db.issueUpdates.add(update);
    return update;
  },

  async remove(id: string): Promise<void> {
    await db.issueUpdates.delete(id);
  },
};
