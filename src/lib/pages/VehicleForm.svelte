<script lang="ts">
  import { vehicleRepository } from '$lib/db/vehicleRepository';
  import { currentTab, editVehicleId } from '$lib/stores/app';
  import type { Vehicle, VehicleFormData } from '$lib/types';

  let vehicle = $state<Vehicle | null>(null);
  let saving = $state(false);
  let error = $state('');

  let form: VehicleFormData = $state({
    name: '',
    make: '',
    model: '',
    year: '' as number | '',
    vin: '',
    licensePlate: '',
    notes: '',
  });

  async function load() {
    const id = $editVehicleId;
    if (id) {
      vehicle = (await vehicleRepository.getById(id)) ?? null;
      if (vehicle) {
        form = {
          name: vehicle.name,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year || '',
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          notes: vehicle.notes,
        };
      }
    }
  }

  async function save() {
    if (!form.name.trim()) {
      error = 'Name is required';
      return;
    }
    saving = true;
    error = '';
    try {
      if (vehicle) {
        await vehicleRepository.update(vehicle.id, form);
      } else {
        await vehicleRepository.create(form);
      }
      editVehicleId.set(null);
      currentTab.set('vehicles');
    } catch (e) {
      error = 'Failed to save vehicle';
    } finally {
      saving = false;
    }
  }

  function cancel() {
    editVehicleId.set(null);
    currentTab.set('vehicles');
  }

  $effect(() => {
    load();
  });
</script>

<div class="vehicle-form">
  <div class="page-header">
    <h1>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h1>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <div class="form card">
    <div class="form-group">
      <label for="name">Name *</label>
      <input id="name" type="text" bind:value={form.name} placeholder="e.g. My Car" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="make">Make</label>
        <input id="make" type="text" bind:value={form.make} placeholder="e.g. Toyota" />
      </div>
      <div class="form-group">
        <label for="model">Model</label>
        <input id="model" type="text" bind:value={form.model} placeholder="e.g. Camry" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="year">Year</label>
        <input id="year" type="number" bind:value={form.year} placeholder="e.g. 2020" />
      </div>
      <div class="form-group">
        <label for="vin">VIN</label>
        <input id="vin" type="text" bind:value={form.vin} placeholder="Vehicle Identification Number" />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="licensePlate">License Plate</label>
        <input id="licensePlate" type="text" bind:value={form.licensePlate} />
      </div>
    </div>

    <div class="form-group">
      <label for="notes">Notes</label>
      <textarea id="notes" bind:value={form.notes} placeholder="Optional notes about this vehicle"></textarea>
    </div>

    <div class="form-actions">
      <button class="btn" onclick={cancel}>Cancel</button>
      <button class="btn btn-primary" onclick={save} disabled={saving}>
        {saving ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Add Vehicle'}
      </button>
    </div>
  </div>
</div>

<style>
  .vehicle-form {
    max-width: 600px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: var(--spacing-lg);
  }

  .error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-md);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-sm);
  }
</style>
