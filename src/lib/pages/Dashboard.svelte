<script lang="ts">
  import { vehicleRepository } from '$lib/db/vehicleRepository';
  import { odoReadingRepository } from '$lib/db/odoReadingRepository';
  import { maintenanceItemRepository } from '$lib/db/maintenanceItemRepository';
  import { issueRepository } from '$lib/db/issueRepository';
  import { settings } from '$lib/stores/app';
  import { computeDueStatus, dueStatusLabel, dueStatusColor } from '$lib/dueStatus';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { currentTab } from '$lib/stores/app';
  import type { Vehicle, OdometerReading, MaintenanceItem, DueStatus } from '$lib/types';

  let vehicles: Vehicle[] = $state([]);
  let readings = $state(new Map<string, OdometerReading>());
  let maintenances = $state(new Map<string, MaintenanceItem[]>());
  let openIssueCounts = $state(new Map<string, number>());
  let loading = $state(true);

  async function load() {
    loading = true;
    vehicles = await vehicleRepository.getAll();
    const vehicleIds = vehicles.map((v) => v.id);

    const readingMap = new Map<string, OdometerReading>();
    for (const id of vehicleIds) {
      const r = await odoReadingRepository.getLatest(id);
      if (r) readingMap.set(id, r);
    }
    readings = readingMap;

    const maintMap = new Map<string, MaintenanceItem[]>();
    for (const id of vehicleIds) {
      maintMap.set(id, await maintenanceItemRepository.getByVehicle(id));
    }
    maintenances = maintMap;

    const issueCounts = new Map<string, number>();
    const allIssues = await issueRepository.getAll();
    for (const id of vehicleIds) {
      issueCounts.set(id, allIssues.filter((i) => i.vehicleId === id && i.status !== 'closed').length);
    }
    openIssueCounts = issueCounts;
    loading = false;
  }

  function viewVehicle(id: string) {
    currentTab.set(`vehicle-${id}`);
  }

  function getDueItems(vehicleId: string): { item: MaintenanceItem; status: DueStatus }[] {
    const items = maintenances.get(vehicleId) ?? [];
    const reading = readings.get(vehicleId);
    return items.map((item) => ({
      item,
      status: computeDueStatus({
        intervalOdometer: item.intervalOdometer,
        intervalDays: item.intervalDays,
        lastCompletedDate: item.lastCompletedDate,
        lastCompletedOdometer: item.lastCompletedOdometer,
        currentOdometer: reading?.value ?? 0,
        odometerUnit: $settings.odometerUnit,
      }),
    }));
  }

  function allDueItems() {
    const result: { vehicle: Vehicle; item: MaintenanceItem; status: DueStatus }[] = [];
    for (const v of vehicles) {
      const dueItems = getDueItems(v.id);
      for (const di of dueItems) {
        if (di.status === 'overdue' || di.status === 'due-soon') {
          result.push({ vehicle: v, ...di });
        }
      }
    }
    result.sort((a, b) => {
      const order = { overdue: 0, 'due-soon': 1 };
      return (order[a.status] ?? 2) - (order[b.status] ?? 2);
    });
    return result;
  }

  $effect(() => {
    load();
  });
</script>

<div class="dashboard">
  <div class="page-header">
    <h1>Dashboard</h1>
  </div>

  {#if loading}
    <p class="loading">Loading...</p>
  {:else if vehicles.length === 0}
    <EmptyState
      title="No vehicles yet"
      description="Add your first vehicle to start tracking maintenance and issues."
      actionLabel="Add Vehicle"
      onAction={() => currentTab.set('vehicles')}
    />
  {:else}
    <div class="stats-bar">
      <div class="stat">
        <span class="stat-value">{vehicles.length}</span>
        <span class="stat-label">Vehicles</span>
      </div>
      <div class="stat">
        <span class="stat-value">{allDueItems().filter((d) => d.status === 'overdue').length}</span>
        <span class="stat-label">Overdue</span>
      </div>
      <div class="stat">
        <span class="stat-value">{allDueItems().filter((d) => d.status === 'due-soon').length}</span>
        <span class="stat-label">Due Soon</span>
      </div>
      <div class="stat">
        <span class="stat-value">{Array.from(openIssueCounts.values()).reduce((a, b) => a + b, 0)}</span>
        <span class="stat-label">Open Issues</span>
      </div>
    </div>

    <div class="vehicle-grid">
      {#each vehicles as vehicle}
        <button class="vehicle-card card" onclick={() => viewVehicle(vehicle.id)}>
          <div class="vehicle-card-header">
            <h3>{vehicle.name}</h3>
            {#if openIssueCounts.get(vehicle.id) ?? 0 > 0}
              <span class="badge badge-open">{openIssueCounts.get(vehicle.id)} open</span>
            {/if}
          </div>
          {#if readings.get(vehicle.id)}
            <p class="odo-reading">
              {readings.get(vehicle.id)!.value.toLocaleString()} {$settings.odometerUnit}
              <span class="reading-date">{new Date(readings.get(vehicle.id)!.date).toLocaleDateString()}</span>
            </p>
          {:else}
            <p class="odo-reading muted">No readings recorded</p>
          {/if}
          <div class="vehicle-card-meta">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </div>
          <div class="due-summary">
            {#each getDueItems(vehicle.id) as { item, status }}
              {#if status !== 'ok' && status !== 'never'}
                <span class="due-item" style="color: {dueStatusColor(status)}">
                  {item.name}: {dueStatusLabel(status)}
                </span>
              {/if}
            {/each}
          </div>
        </button>
      {/each}
    </div>

    {#if allDueItems().length > 0}
      <div class="section">
        <h2>Upcoming & Overdue Maintenance</h2>
        <div class="due-list">
          {#each allDueItems() as { vehicle, item, status }}
            <div class="due-item-row" class:overdue={status === 'overdue'}>
              <StatusBadge type="due" value={status} />
              <span class="due-vehicle">{vehicle.name}</span>
              <span class="due-name">{item.name}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .dashboard {
    max-width: 1000px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: var(--spacing-lg);
  }

  .loading {
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--spacing-2xl);
  }

  .stats-bar {
    display: flex;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .stat {
    flex: 1;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-text);
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .vehicle-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .vehicle-card {
    text-align: left;
    cursor: pointer;
    width: 100%;
    transition: box-shadow 0.15s;
  }

  .vehicle-card:hover {
    box-shadow: 0 4px 12px var(--color-card-shadow);
  }

  .vehicle-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-sm);
  }

  .odo-reading {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .odo-reading .reading-date {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-text-secondary);
    margin-left: var(--spacing-sm);
  }

  .odo-reading.muted {
    color: var(--color-text-muted);
    font-weight: 400;
    font-size: 0.875rem;
  }

  .vehicle-card-meta {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  .due-summary {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .due-item {
    font-size: 0.75rem;
  }

  .section {
    margin-top: var(--spacing-lg);
  }

  .section h2 {
    margin-bottom: var(--spacing-md);
  }

  .due-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .due-item-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .due-item-row.overdue {
    border-left: 3px solid var(--color-danger);
  }

  .due-vehicle {
    font-weight: 600;
  }

  .due-name {
    color: var(--color-text-secondary);
  }
</style>
