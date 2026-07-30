<script lang="ts">
  import { issueRepository } from '$lib/db/issueRepository';
  import { issueUpdateRepository } from '$lib/db/issueUpdateRepository';
  import { currentTab, editIssueId, settings } from '$lib/stores/app';
  import { formatDate, formatCurrency } from '$lib/utils';
  import type { Issue, IssueUpdate, IssueStatus } from '$lib/types';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let { issueId }: { issueId: string } = $props();

  let issue = $state<Issue | null>(null);
  let updates = $state<IssueUpdate[]>([]);
  let loading = $state(true);
  let noteText = $state('');
  let savingNote = $state(false);

  // Resolution form
  let showResolutionForm = $state(false);
  let resolutionCost = $state<number | ''>('');
  let resolutionProvider = $state('');

  // Status transitions
  let confirmStatus: IssueStatus | null = $state(null);

  const nextStatuses: Record<IssueStatus, IssueStatus | null> = {
    'open': 'in-progress',
    'in-progress': 'resolved',
    'resolved': 'closed',
    'closed': null,
  };

  async function load() {
    loading = true;
    issue = (await issueRepository.getById(issueId)) ?? null;
    if (issue) {
      updates = await issueUpdateRepository.getByIssue(issueId);
    }
    loading = false;
  }

  function statusActionLabel(status: IssueStatus): string {
    const map: Record<IssueStatus, string> = {
      'open': 'Start Progress',
      'in-progress': 'Mark Resolved',
      'resolved': 'Close Issue',
      'closed': '',
    };
    return map[status];
  }

  async function doStatusTransition(newStatus: IssueStatus) {
    if (!issue) return;
    const resolvedAt = newStatus === 'resolved' ? new Date().toISOString() : undefined;
    await issueRepository.updateStatus(issue.id, newStatus, resolvedAt);

    await issueUpdateRepository.create(issue.id, {
      type: 'status-change',
      description: `Status changed from "${issue.status}" to "${newStatus}"`,
      previousStatus: issue.status,
      newStatus,
    });

    confirmStatus = null;
    await load();
  }

  async function addNote() {
    if (!issue || !noteText.trim()) return;
    savingNote = true;
    await issueUpdateRepository.create(issue.id, {
      type: 'note',
      description: noteText,
    });
    noteText = '';
    updates = await issueUpdateRepository.getByIssue(issue.id);
    savingNote = false;
  }

  async function saveResolution() {
    if (!issue) return;
    await issueRepository.updateResolution(issue.id, resolutionCost || null, resolutionProvider || null);

    await issueUpdateRepository.create(issue.id, {
      type: 'repair',
      description: `Repair recorded${resolutionCost ? ` (cost: $${resolutionCost})` : ''}${resolutionProvider ? ` by ${resolutionProvider}` : ''}`,
    });

    showResolutionForm = false;
    await load();
  }

  function back() {
    currentTab.set(`vehicle-${issue?.vehicleId}`);
  }

  $effect(() => {
    load();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if issue}
  <div class="issue-detail">
    <div class="page-header">
      <div>
        <button class="btn btn-sm back-btn" onclick={back}>← Back to Vehicle</button>
        <h1>{issue.title}</h1>
      </div>
      <div class="issue-badges">
        <StatusBadge type="issue-status" value={issue.status} />
        <StatusBadge type="severity" value={issue.severity} />
      </div>
    </div>

    <div class="content">
      <div class="card">
        <h3>Description</h3>
        <p>{issue.description || 'No description provided.'}</p>

        {#if issue.cost}
          <p><strong>Cost:</strong> {formatCurrency(issue.cost)}</p>
        {/if}
        {#if issue.serviceProvider}
          <p><strong>Service Provider:</strong> {issue.serviceProvider}</p>
        {/if}
        {#if issue.resolvedAt}
          <p><strong>Resolved:</strong> {formatDate(issue.resolvedAt)}</p>
        {/if}
      </div>

      <div class="card">
        <h3>Actions</h3>
        <div class="actions">
          {#if nextStatuses[issue.status]}
            <button class="btn btn-primary" onclick={() => confirmStatus = nextStatuses[issue.status]}>
              {statusActionLabel(issue.status)}
            </button>
          {/if}
          {#if issue.status === 'in-progress' || issue.status === 'open'}
            <button class="btn" onclick={() => showResolutionForm = !showResolutionForm}>
              {showResolutionForm ? 'Cancel' : 'Record Repair Details'}
            </button>
          {/if}
          {#if issue.status === 'resolved'}
            <button class="btn btn-danger" onclick={() => confirmStatus = 'open'}>
              Reopen Issue
            </button>
          {/if}
        </div>

        {#if showResolutionForm}
          <div class="resolution-form">
            <div class="form-row">
              <div class="form-group">
                <label>Cost ($)</label>
                <input type="number" bind:value={resolutionCost} placeholder="0.00" />
              </div>
              <div class="form-group">
                <label>Service Provider</label>
                <input type="text" bind:value={resolutionProvider} placeholder="Who fixed it?" />
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick={saveResolution}>Save Details</button>
          </div>
        {/if}
      </div>

      <div class="card">
        <h3>Timeline</h3>

        <div class="add-note">
          <textarea bind:value={noteText} placeholder="Add a note or update..."></textarea>
          <button class="btn btn-primary btn-sm" onclick={addNote} disabled={savingNote || !noteText.trim()}>
            {savingNote ? 'Adding...' : 'Add Note'}
          </button>
        </div>

        {#if updates.length === 0}
          <p class="muted">No updates yet.</p>
        {:else}
          <div class="timeline">
            {#each [...updates].reverse() as update}
              <div class="timeline-item" class:status-change={update.type === 'status-change'} class:repair={update.type === 'repair'}>
                <div class="timeline-header">
                  <span class="timeline-type">{update.type}</span>
                  <span class="timeline-date">{formatDate(update.createdAt)}</span>
                </div>
                <p>{update.description}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if confirmStatus}
  <ConfirmDialog
    title="Change Status"
      message={`Move this issue from "${issue?.status}" to "${confirmStatus}"?`}
    confirmLabel="Confirm"
    onConfirm={() => doStatusTransition(confirmStatus!)}
    onCancel={() => confirmStatus = null}
  />
{/if}

<style>
  .issue-detail {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-lg);
  }

  .back-btn {
    margin-bottom: var(--spacing-sm);
  }

  .issue-badges {
    display: flex;
    gap: var(--spacing-sm);
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .actions {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  }

  .resolution-form {
    margin-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .add-note {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .add-note textarea {
    flex: 1;
    min-height: 60px;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .timeline-item {
    padding: var(--spacing-sm) var(--spacing-md);
    border-left: 3px solid var(--color-border);
    margin-left: var(--spacing-sm);
  }

  .timeline-item.status-change {
    border-left-color: var(--color-primary);
  }

  .timeline-item.repair {
    border-left-color: var(--color-success);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--spacing-xs);
  }

  .timeline-type {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-secondary);
  }

  .timeline-date {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }

  .timeline-item p {
    font-size: 0.875rem;
  }

  .muted {
    color: var(--color-text-secondary);
  }
</style>
