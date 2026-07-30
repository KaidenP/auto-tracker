<script lang="ts">
  import { todayISO } from '$lib/utils';
  import type { OdometerFormData } from '$lib/types';

  let { saving, onSave, onCancel }: {
    saving: boolean;
    onSave: (data: OdometerFormData) => Promise<void>;
    onCancel: () => void;
  } = $props();

  let form: OdometerFormData = $state({
    value: '' as number | '',
    date: todayISO(),
    notes: '',
  });
  let error = $state('');

  async function save() {
    if (!form.value) {
      error = 'Odometer value is required';
      return;
    }
    if (!form.date) {
      error = 'Date is required';
      return;
    }
    error = '';
    await onSave({ ...form });
    form = { value: '' as number | '', date: todayISO(), notes: '' };
  }
</script>

<div class="odo-form">
  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="form-row">
    <div class="form-group">
      <label for="odo-value">Odometer Reading</label>
      <input id="odo-value" type="number" bind:value={form.value} placeholder="e.g. 45000" />
    </div>
    <div class="form-group">
      <label for="odo-date">Date</label>
      <input id="odo-date" type="date" bind:value={form.date} />
    </div>
  </div>

  <div class="form-group">
    <label for="odo-notes">Notes</label>
    <input id="odo-notes" type="text" bind:value={form.notes} placeholder="Optional" />
  </div>

  <div class="form-actions">
    <button class="btn btn-sm" onclick={onCancel}>Cancel</button>
    <button class="btn btn-sm btn-primary" onclick={save} disabled={saving}>
      {saving ? 'Saving...' : 'Add Reading'}
    </button>
  </div>
</div>

<style>
  .odo-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
  }

  .error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }
</style>
