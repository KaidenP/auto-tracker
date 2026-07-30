<script lang="ts">
  import { currentTab, editVehicleId, editIssueId } from '$lib/stores/app';
  import Layout from '$lib/components/Layout.svelte';
  import Dashboard from '$lib/pages/Dashboard.svelte';
  import Vehicles from '$lib/pages/Vehicles.svelte';
  import VehicleForm from '$lib/pages/VehicleForm.svelte';
  import VehicleDetail from '$lib/pages/VehicleDetail.svelte';
  import IssueDetail from '$lib/pages/IssueDetail.svelte';
  import Settings from '$lib/pages/Settings.svelte';

  function currentPage() {
    const tab = $currentTab;

    if (tab === 'dashboard') return 'dashboard';
    if (tab === 'vehicles') return 'vehicles';
    if (tab === 'vehicle-form') return 'vehicle-form';
    if (tab.startsWith('vehicle-')) return 'vehicle-detail';
    if (tab === 'issue-detail') return 'issue-detail';
    if (tab === 'settings') return 'settings';

    return 'dashboard';
  }

  function getVehicleId(): string {
    if ($currentTab.startsWith('vehicle-')) {
      return $currentTab.slice('vehicle-'.length);
    }
    return '';
  }
</script>

<Layout>
  {#if currentPage() === 'dashboard'}
    <Dashboard />
  {:else if currentPage() === 'vehicles'}
    <Vehicles />
  {:else if currentPage() === 'vehicle-form'}
    <VehicleForm />
  {:else if currentPage() === 'vehicle-detail'}
    <VehicleDetail vehicleId={getVehicleId()} />
  {:else if currentPage() === 'issue-detail'}
    {#if $editIssueId}
      <IssueDetail issueId={$editIssueId} />
    {/if}
  {:else if currentPage() === 'settings'}
    <Settings />
  {/if}
</Layout>
