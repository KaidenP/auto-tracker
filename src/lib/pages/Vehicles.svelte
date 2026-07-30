<script lang="ts">
  import { vehicleRepository } from '$lib/db/vehicleRepository';
  import { odoReadingRepository } from '$lib/db/odoReadingRepository';
  import { currentTab, editVehicleId } from '$lib/stores/app';
  import { settings } from '$lib/stores/app';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import type { Vehicle, OdometerReading } from '$lib/types';

  let vehicles: Vehicle[] = $state([]);
  let readings = $state(new Map<string, OdometerReading>());
  let loading = $state(true);
  let deleteTarget = $state<Vehicle | null>(null);

  async function load() {
    loading = true;
    vehicles = await vehicleRepository.getAll();
    const rMap = new Map<string, OdometerReading>();
    for (const v of vehicles) {
      const r = await odoReadingRepository.getLatest(v.id);
      if (r) rMap.set(v.id, r);
    }
    readings = rMap;
    loading = false;
  }

  function addVehicle() {
    editVehicleId.set(null);
    currentTab.set('vehicle-form');
  }

  function editVehicle(id: string) {
    editVehicleId.set(id);
    currentTab.set('vehicle-form');
  }

  function viewVehicle(id: string) {
    currentTab.set(`vehicle-${id}`);
  }

  async function confirmDelete() {
    if (deleteTarget) {
      await vehicleRepository.remove(deleteTarget.id);
      deleteTarget = null;
      await load();
    }
  }

  $effect(() => {
    load();
  });
</script>

<div class="vehicles-page">
  <div class="page-header">
    <h1>Vehicles</h1>
    <button class="btn btn-primary" onclick={addVehicle}>Add Vehicle</button>
  </div>

  {#if loading}
    <p class="loading">Loading...</p>
  {:else if vehicles.length === 0}
    <EmptyState
      title="No vehicles yet"
      description="Add your first vehicle to start tracking."
      actionLabel="Add Vehicle"
      onAction={addVehicle}
    />
  {:else}
    <div class="vehicle-list">
      {#each vehicles as vehicle (vehicle.id)}
        <div class="vehicle-row card">
          <button class="vehicle-info" onclick={() => viewVehicle(vehicle.id)}>
            <h3>{vehicle.name}</h3>
            <p class="vehicle-meta">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            {#if readings.get(vehicle.id)}
              <p class="odo">
                {readings.get(vehicle.id)!.value.toLocaleString()} {$settings.odometerUnit}
                <span class="date">{new Date(readings.get(vehicle.id)!.date).toLocaleDateString()}</span>
              </p>
            {:else}
              <p class="odo muted">No readings</p>
            {/if}
          </button>
          <div class="vehicle-actions">
            <button class="btn btn-sm" onclick={() => editVehicle(vehicle.id)}>Edit</button>
            <button class="btn btn-sm btn-danger" onclick={() => deleteTarget = vehicle}>Delete</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if deleteTarget}
  <ConfirmDialog
    title="Delete Vehicle"
    message="Are you sure you want to delete {deleteTarget.name}? This will permanently remove all associated maintenance records, odometer readings, and issues."
    confirmLabel="Delete"
    danger={true}
    onConfirm={confirmDelete}
    onCancel={() => deleteTarget = null}
  />
{/if}

<style>
  .vehicles-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  .loading {
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--spacing-2xl);
  }

  .vehicle-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .vehicle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .vehicle-info {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
  }

  .vehicle-info:hover h3 {
    color: var(--color-primary);
  }

  .vehicle-meta {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
  }

  .odo {
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .odo .date {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-text-secondary);
    margin-left: var(--spacing-sm);
  }

  .odo.muted {
    color: var(--color-text-muted);
    font-weight: 400;
    font-size: 0.875rem;
  }

  .vehicle-actions {
    display: flex;
    gap: var(--spacing-xs);
  }
</style>
