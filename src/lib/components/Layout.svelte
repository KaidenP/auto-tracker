<script lang="ts">
  import { currentTab } from '$lib/stores/app';

  let { children }: { children?: import('svelte').Snippet } = $props();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'settings', label: 'Settings' },
  ];

  function navigate(tab: string) {
    currentTab.set(tab);
  }
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>AutoTracker</h2>
    </div>
    <nav class="sidebar-nav">
      {#each navItems as item (item.id)}
        <button
          class="nav-item"
          class:active={$currentTab === item.id || ($currentTab.startsWith('vehicle-') && item.id === 'vehicles')}
          onclick={() => navigate(item.id)}
        >
          {item.label}
        </button>
      {/each}
    </nav>
  </aside>
  <main class="main">
    {@render children?.()}
  </main>
</div>

<style>
  .layout {
    display: flex;
    height: 100%;
  }

  .sidebar {
    width: var(--sidebar-width);
    background: var(--color-sidebar-bg);
    color: var(--color-sidebar-text);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-sidebar-hover);
  }

  .sidebar-header h2 {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-sm);
    gap: 2px;
  }

  .nav-item {
    display: block;
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: none;
    border: none;
    color: var(--color-sidebar-text);
    text-align: left;
    font-size: 0.9375rem;
    border-radius: var(--radius-sm);
    transition: background 0.15s;
  }

  .nav-item:hover {
    background: var(--color-sidebar-hover);
  }

  .nav-item.active {
    background: var(--color-sidebar-active);
    color: #fff;
  }

  .main {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-lg);
  }
</style>
