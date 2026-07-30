<script lang="ts">
  import { settingsRepository } from '$lib/db/settingsRepository';
  import { settings } from '$lib/stores/app';
  import { getPlatform } from '$lib/platform/types';
  import { exportAllData, importAllData } from '$lib/dataPortability';
  import type { ThemeMode, OdometerUnit } from '$lib/types';

  let saving = $state(false);
  let importError = $state('');
  let importSuccess = $state('');
  let exportLoading = $state(false);

  async function setOdometerUnit(unit: OdometerUnit) {
    saving = true;
    await settingsRepository.setOdometerUnit(unit);
    await settingsRepository.get().then((s) => settings.set(s));
    saving = false;
  }

  async function setTheme(theme: ThemeMode) {
    saving = true;
    await settingsRepository.setTheme(theme);
    await settingsRepository.get().then((s) => settings.set(s));
    applyTheme(theme);
    saving = false;
  }

  function applyTheme(theme: ThemeMode) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  async function handleExport() {
    exportLoading = true;
    try {
      const data = await exportAllData();
      const platform = getPlatform();
      const filename = `autotracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      await platform.exportFile(data, filename);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      exportLoading = false;
    }
  }

  async function handleImport() {
    importError = '';
    importSuccess = '';
    try {
      const platform = getPlatform();
      const data = await platform.importFile();
      if (!data) return;
      await importAllData(data);
      importSuccess = 'Data imported successfully.';
      await settingsRepository.get().then((s) => settings.set(s));
    } catch (e) {
      importError = e instanceof Error ? e.message : 'Import failed';
    }
  }

  $effect(() => {
    applyTheme($settings.theme);
  });

  $effect(() => {
    // Re-apply theme when settings load
    if ($settings) {
      applyTheme($settings.theme);
    }
  });
</script>

<div class="settings-page">
  <div class="page-header">
    <h1>Settings</h1>
  </div>

  <div class="settings-sections">
    <div class="card">
      <h3>Odometer Unit</h3>
      <p class="description">Choose the default unit for odometer readings across all vehicles.</p>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          class:active={$settings.odometerUnit === 'mi'}
          onclick={() => setOdometerUnit('mi')}
          disabled={saving}
        >
          Miles (mi)
        </button>
        <button
          class="toggle-btn"
          class:active={$settings.odometerUnit === 'km'}
          onclick={() => setOdometerUnit('km')}
          disabled={saving}
        >
          Kilometers (km)
        </button>
      </div>
    </div>

    <div class="card">
      <h3>Theme</h3>
      <p class="description">Choose your preferred appearance.</p>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          class:active={$settings.theme === 'system'}
          onclick={() => setTheme('system')}
          disabled={saving}
        >
          System
        </button>
        <button
          class="toggle-btn"
          class:active={$settings.theme === 'light'}
          onclick={() => setTheme('light')}
          disabled={saving}
        >
          Light
        </button>
        <button
          class="toggle-btn"
          class:active={$settings.theme === 'dark'}
          onclick={() => setTheme('dark')}
          disabled={saving}
        >
          Dark
        </button>
      </div>
    </div>

    <div class="card">
      <h3>Data Management</h3>
      <p class="description">Export your data for backup or import a previously exported backup.</p>
      <div class="data-actions">
        <button class="btn btn-primary" onclick={handleExport} disabled={exportLoading}>
          {exportLoading ? 'Exporting...' : 'Export Data'}
        </button>
        <button class="btn" onclick={handleImport}>
          Import Data
        </button>
      </div>
      {#if importError}
        <div class="error">{importError}</div>
      {/if}
      {#if importSuccess}
        <div class="success">{importSuccess}</div>
      {/if}
    </div>

    <div class="card">
      <h3>About</h3>
      <p class="description">AutoTracker v0.1.0</p>
      <p class="description">An offline-first vehicle maintenance tracker.</p>
    </div>
  </div>
</div>

<style>
  .settings-page {
    max-width: 600px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: var(--spacing-lg);
  }

  .settings-sections {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }

  .toggle-group {
    display: flex;
    gap: var(--spacing-xs);
  }

  .toggle-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    transition: all 0.15s;
  }

  .toggle-btn.active {
    background: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
  }

  .data-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .error {
    background: var(--color-danger-light);
    color: var(--color-danger);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    margin-top: var(--spacing-sm);
  }

  .success {
    background: var(--color-success-light);
    color: var(--color-success);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    font-size: 0.8125rem;
    margin-top: var(--spacing-sm);
  }
</style>
