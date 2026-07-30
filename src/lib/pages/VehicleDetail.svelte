<script lang="ts">
  import { vehicleRepository } from '$lib/db/vehicleRepository';
  import { odoReadingRepository } from '$lib/db/odoReadingRepository';
  import { maintenanceItemRepository } from '$lib/db/maintenanceItemRepository';
  import { maintenanceRecordRepository } from '$lib/db/maintenanceRecordRepository';
  import { issueRepository } from '$lib/db/issueRepository';
  import { currentTab, settings, editVehicleId, editIssueId } from '$lib/stores/app';
  import { computeDueStatus } from '$lib/dueStatus';
  import { formatDate, todayISO, formatCurrency } from '$lib/utils';
  import type {
    Vehicle, OdometerReading, OdometerFormData,
    MaintenanceItem, MaintenanceItemFormData, LogCompletionFormData,
    MaintenanceRecord,
    Issue, IssueFormData,
  } from '$lib/types';
  import OdometerForm from './OdometerForm.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

  let { vehicleId }: { vehicleId: string } = $props();

  let vehicle = $state<Vehicle | null>(null);
  let readings = $state<OdometerReading[]>([]);
  let maintenanceItems = $state<MaintenanceItem[]>([]);
  let maintenanceRecords = $state<MaintenanceRecord[]>([]);
  let issues = $state<Issue[]>([]);
  let loading = $state(true);
  let activeTab = $state<'overview' | 'maintenance' | 'issues'>('overview');
  let showOdoForm = $state(false);
  let odoSaving = $state(false);

  // Maintenance form state
  let showMaintForm = $state(false);
  let editMaintId = $state<string | null>(null);
  let maintSaving = $state(false);
  let maintForm: MaintenanceItemFormData = $state({ name: '', description: '', intervalOdometer: '', intervalDays: '' });
  let maintError = $state('');

  // Log completion form state
  let logMaintItem = $state<MaintenanceItem | null>(null);
  let logForm: LogCompletionFormData = $state({ completedDate: todayISO(), completedOdometer: '', cost: '', serviceProvider: '', notes: '' });

  // Issue form state
  let showIssueForm = $state(false);
  let issueForm: IssueFormData = $state({ title: '', description: '', severity: 'medium' });
  let issueSaving = $state(false);

  // Delete state
  let deleteMaintItem = $state<MaintenanceItem | null>(null);

  async function load() {
    loading = true;
    vehicle = (await vehicleRepository.getById(vehicleId)) ?? null;
    if (vehicle) {
      readings = await odoReadingRepository.getByVehicle(vehicleId);
      maintenanceItems = await maintenanceItemRepository.getByVehicle(vehicleId);
      maintenanceRecords = await maintenanceRecordRepository.getByVehicle(vehicleId);
      issues = await issueRepository.getByVehicle(vehicleId);
    }
    loading = false;
  }

  function editVehicle() {
    editVehicleId.set(vehicleId);
    currentTab.set('vehicle-form');
  }

  async function saveOdoReading(data: OdometerFormData) {
    odoSaving = true;
    await odoReadingRepository.create(vehicleId, data);
    showOdoForm = false;
    readings = await odoReadingRepository.getByVehicle(vehicleId);
    odoSaving = false;
  }

  async function deleteOdoReading(id: string) {
    await odoReadingRepository.remove(id);
    readings = await odoReadingRepository.getByVehicle(vehicleId);
  }

  // Maintenance handlers
  function openMaintForm(item?: MaintenanceItem) {
    if (item) {
      editMaintId = item.id;
      maintForm = {
        name: item.name,
        description: item.description,
        intervalOdometer: item.intervalOdometer ?? '',
        intervalDays: item.intervalDays ?? '',
      };
    } else {
      editMaintId = null;
      maintForm = { name: '', description: '', intervalOdometer: '', intervalDays: '' };
    }
    showMaintForm = true;
    maintError = '';
  }

  async function saveMaintItem() {
    if (!maintForm.name.trim()) {
      maintError = 'Name is required';
      return;
    }
    maintSaving = true;
    maintError = '';
    try {
      if (editMaintId) {
        await maintenanceItemRepository.update(editMaintId, maintForm);
      } else {
        await maintenanceItemRepository.create(vehicleId, maintForm);
      }
      showMaintForm = false;
      maintenanceItems = await maintenanceItemRepository.getByVehicle(vehicleId);
    } catch {
      maintError = 'Failed to save maintenance item';
    } finally {
      maintSaving = false;
    }
  }

  async function confirmDeleteMaint() {
    if (deleteMaintItem) {
      await maintenanceItemRepository.remove(deleteMaintItem.id);
      deleteMaintItem = null;
      maintenanceItems = await maintenanceItemRepository.getByVehicle(vehicleId);
    }
  }

  function openLogForm(item: MaintenanceItem) {
    logMaintItem = item;
    const lastReading = readings[0];
    logForm = {
      completedDate: todayISO(),
      completedOdometer: lastReading?.value ?? '',
      cost: '',
      serviceProvider: '',
      notes: '',
    };
  }

  async function saveLogCompletion() {
    if (!logMaintItem) return;
    if (!logForm.completedOdometer) return;
    await maintenanceRecordRepository.create(vehicleId, logMaintItem.id, logForm);
    await maintenanceItemRepository.updateCompletion(
      logMaintItem.id,
      logForm.completedDate,
      logForm.completedOdometer as number,
    );
    logMaintItem = null;
    maintenanceItems = await maintenanceItemRepository.getByVehicle(vehicleId);
    maintenanceRecords = await maintenanceRecordRepository.getByVehicle(vehicleId);
  }

  // Issue handlers
  function viewIssue(id: string) {
    editIssueId.set(id);
    currentTab.set('issue-detail');
  }

  async function saveIssue() {
    if (!issueForm.title.trim()) return;
    issueSaving = true;
    await issueRepository.create(vehicleId, issueForm);
    showIssueForm = false;
    issueForm = { title: '', description: '', severity: 'medium' };
    issues = await issueRepository.getByVehicle(vehicleId);
    issueSaving = false;
  }

  // Due status helpers
  function getDueStatus(item: MaintenanceItem) {
    const r = readings[0];
    return computeDueStatus({
      intervalOdometer: item.intervalOdometer,
      intervalDays: item.intervalDays,
      lastCompletedDate: item.lastCompletedDate,
      lastCompletedOdometer: item.lastCompletedOdometer,
      currentOdometer: r?.value ?? 0,
      odometerUnit: $settings.odometerUnit,
    });
  }

  $effect(() => {
    load();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if vehicle}
  <div class="vehicle-detail">
    <div class="page-header">
      <div>
        <button class="btn btn-sm back-btn" onclick={() => currentTab.set('vehicles')}>← Back</button>
        <h1>{vehicle.name}</h1>
        <p class="vehicle-subtitle">{vehicle.year} {vehicle.make} {vehicle.model}</p>
      </div>
      <button class="btn btn-sm" onclick={editVehicle}>Edit Vehicle</button>
    </div>

    <div class="tabs">
      <button class="tab" class:active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}>Overview</button>
      <button class="tab" class:active={activeTab === 'maintenance'} onclick={() => activeTab = 'maintenance'}>Maintenance</button>
      <button class="tab" class:active={activeTab === 'issues'} onclick={() => activeTab = 'issues'}>Issues</button>
    </div>

    {#if activeTab === 'overview'}
      <div class="tab-content">
        <div class="info-grid">
          <div class="card">
            <h3>Details</h3>
            <dl>
              <dt>Make</dt>
              <dd>{vehicle.make || '—'}</dd>
              <dt>Model</dt>
              <dd>{vehicle.model || '—'}</dd>
              <dt>Year</dt>
              <dd>{vehicle.year || '—'}</dd>
              <dt>VIN</dt>
              <dd>{vehicle.vin || '—'}</dd>
              <dt>License Plate</dt>
              <dd>{vehicle.licensePlate || '—'}</dd>
            </dl>
            {#if vehicle.notes}
              <h3>Notes</h3>
              <p>{vehicle.notes}</p>
            {/if}
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Odometer Readings</h3>
              <button class="btn btn-sm" onclick={() => showOdoForm = !showOdoForm}>
                {showOdoForm ? 'Cancel' : 'Add Reading'}
              </button>
            </div>

            {#if showOdoForm}
              <OdometerForm
                saving={odoSaving}
                onSave={saveOdoReading}
                onCancel={() => showOdoForm = false}
              />
            {/if}

            {#if readings.length === 0}
              <p class="muted">No readings recorded.</p>
            {:else}
              <div class="current-reading">
                <span class="reading-value">{readings[0].value.toLocaleString()} {$settings.odometerUnit}</span>
                <span class="reading-date">{formatDate(readings[0].date)}</span>
              </div>
              <div class="reading-history">
                {#each readings as r, i (r.id)}
                  <div class="reading-row">
                    <span>{r.value.toLocaleString()} {$settings.odometerUnit}</span>
                    <span class="muted">{formatDate(r.date)}</span>
                    {#if r.notes}
                      <span class="muted">{r.notes}</span>
                    {/if}
                    {#if i > 0}
                      <button class="btn btn-sm btn-danger" onclick={() => deleteOdoReading(r.id)}>×</button>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </div>

    {:else if activeTab === 'maintenance'}
      <div class="tab-content">
        <div class="card-header">
          <h3>Tracked Maintenance</h3>
          <button class="btn btn-sm btn-primary" onclick={() => openMaintForm()}>Add Item</button>
        </div>

        {#if showMaintForm}
          <div class="form card">
            {#if maintError}
              <div class="error">{maintError}</div>
            {/if}
            <div class="form-group">
              <label>Name *</label>
              <input type="text" bind:value={maintForm.name} placeholder="e.g. Oil Change" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea bind:value={maintForm.description} placeholder="Optional description"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Odometer Interval ({$settings.odometerUnit})</label>
                <input type="number" bind:value={maintForm.intervalOdometer} placeholder="e.g. 5000" />
              </div>
              <div class="form-group">
                <label>Day Interval</label>
                <input type="number" bind:value={maintForm.intervalDays} placeholder="e.g. 180" />
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm" onclick={() => { showMaintForm = false; maintError = ''; }}>Cancel</button>
              <button class="btn btn-sm btn-primary" onclick={saveMaintItem} disabled={maintSaving}>
                {maintSaving ? 'Saving...' : editMaintId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        {/if}

        {#if maintenanceItems.length === 0}
          <EmptyState
            title="No maintenance items"
            description="Add scheduled maintenance items to track when service is due."
          />
        {:else}
          <div class="maint-list">
            {#each maintenanceItems as item (item.id)}
              <div class="maint-item card">
                <div class="maint-item-header">
                  <div>
                    <h4>{item.name}</h4>
                    {#if item.description}
                      <p class="muted">{item.description}</p>
                    {/if}
                  </div>
                  <div class="maint-item-actions">
                    <button class="btn btn-sm" onclick={() => openLogForm(item)}>Log</button>
                    <button class="btn btn-sm" onclick={() => openMaintForm(item)}>Edit</button>
                    <button class="btn btn-sm btn-danger" onclick={() => deleteMaintItem = item}>×</button>
                  </div>
                </div>
                <div class="maint-item-details">
                  <span>Status: <StatusBadge type="due" value={getDueStatus(item)} /></span>
                  {#if item.intervalOdometer}
                    <span>Every {item.intervalOdometer.toLocaleString()} {$settings.odometerUnit}</span>
                  {/if}
                  {#if item.intervalDays}
                    <span>Every {item.intervalDays} days</span>
                  {/if}
                  {#if item.lastCompletedDate}
                    <span>Last: {formatDate(item.lastCompletedDate)}</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if logMaintItem}
          <div class="overlay" onclick={() => logMaintItem = null} role="presentation">
            <div class="dialog card" onclick={(e) => e.stopPropagation()} role="dialog">
              <h3>Log Completion: {logMaintItem.name}</h3>
              <div class="form-group">
                <label>Completed Date</label>
                <input type="date" bind:value={logForm.completedDate} />
              </div>
              <div class="form-group">
                <label>Odometer at Service ({$settings.odometerUnit})</label>
                <input type="number" bind:value={logForm.completedOdometer} />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Cost ($)</label>
                  <input type="number" bind:value={logForm.cost} placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label>Service Provider</label>
                  <input type="text" bind:value={logForm.serviceProvider} placeholder="Shop name" />
                </div>
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea bind:value={logForm.notes}></textarea>
              </div>
              <div class="form-actions">
                <button class="btn" onclick={() => logMaintItem = null}>Cancel</button>
                <button class="btn btn-primary" onclick={saveLogCompletion}>Log Completion</button>
              </div>
            </div>
          </div>
        {/if}

        <div class="section">
          <h3>Service History</h3>
          {#if maintenanceRecords.length === 0}
            <p class="muted">No completed service records.</p>
          {:else}
            <div class="record-list">
              {#each maintenanceRecords as record (record.id)}
                <div class="record-row">
                  <span class="record-name">{maintenanceItems.find(i => i.id === record.maintenanceItemId)?.name ?? 'Unknown'}</span>
                  <span>{formatDate(record.completedDate)}</span>
                  <span>{record.completedOdometer.toLocaleString()} {$settings.odometerUnit}</span>
                  {#if record.cost}
                    <span>{formatCurrency(record.cost)}</span>
                  {/if}
                  {#if record.serviceProvider}
                    <span class="muted">{record.serviceProvider}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else if activeTab === 'issues'}
      <div class="tab-content">
        <div class="card-header">
          <h3>Issues</h3>
          <button class="btn btn-sm btn-primary" onclick={() => showIssueForm = !showIssueForm}>
            {showIssueForm ? 'Cancel' : 'Report Issue'}
          </button>
        </div>

        {#if showIssueForm}
          <div class="form card">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" bind:value={issueForm.title} placeholder="Brief description of the issue" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea bind:value={issueForm.description} placeholder="Detailed description"></textarea>
            </div>
            <div class="form-group">
              <label>Severity</label>
              <select bind:value={issueForm.severity}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-actions">
              <button class="btn btn-sm btn-primary" onclick={saveIssue} disabled={issueSaving}>
                {issueSaving ? 'Saving...' : 'Create Issue'}
              </button>
            </div>
          </div>
        {/if}

        {#if issues.length === 0}
          <EmptyState
            title="No issues tracked"
            description="Record an issue when something comes up."
          />
        {:else}
          <div class="issue-list">
            {#each issues as issue (issue.id)}
              <button class="issue-row card" onclick={() => viewIssue(issue.id)}>
                <div class="issue-header">
                  <h4>{issue.title}</h4>
                  <div class="issue-badges">
                    <StatusBadge type="issue-status" value={issue.status} />
                    <StatusBadge type="severity" value={issue.severity} />
                  </div>
                </div>
                {#if issue.description}
                  <p class="muted">{issue.description}</p>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if deleteMaintItem}
  <ConfirmDialog
    title="Delete Maintenance Item"
      message={`Delete "${deleteMaintItem?.name}"? This will not remove service history.`}
    confirmLabel="Delete"
    danger={true}
    onConfirm={confirmDeleteMaint}
    onCancel={() => deleteMaintItem = null}
  />
{/if}

<style>
  .vehicle-detail {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-md);
  }

  .back-btn {
    margin-bottom: var(--spacing-sm);
  }

  .vehicle-subtitle {
    color: var(--color-text-secondary);
    font-size: 0.9375rem;
  }

  .tabs {
    display: flex;
    gap: 2px;
    border-bottom: 2px solid var(--color-border);
    margin-bottom: var(--spacing-lg);
  }

  .tab {
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-weight: 500;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.15s;
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .info-grid dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--spacing-xs) var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .info-grid dt {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }

  .current-reading {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-md);
  }

  .reading-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .reading-date {
    color: var(--color-text-secondary);
  }

  .reading-history {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .reading-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) 0;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-border);
  }

  .maint-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .maint-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--spacing-sm);
  }

  .maint-item-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .maint-item-details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .dialog {
    max-width: 500px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }

  .section {
    margin-top: var(--spacing-lg);
  }

  .record-list {
    display: flex;
    flex-direction: column;
  }

  .record-row {
    display: flex;
    gap: var(--spacing-md);
    padding: var(--spacing-sm) 0;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--color-border);
  }

  .record-name {
    font-weight: 600;
    min-width: 120px;
  }

  .issue-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .issue-row {
    text-align: left;
    width: 100%;
    cursor: pointer;
  }

  .issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
  }

  .issue-badges {
    display: flex;
    gap: var(--spacing-xs);
  }

  .muted {
    color: var(--color-text-secondary);
  }

  .error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    margin-bottom: var(--spacing-sm);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-md);
  }

  .tab-content {
    min-height: 300px;
  }
</style>
