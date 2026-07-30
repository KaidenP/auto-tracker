<script lang="ts">
  import { dueStatusLabel } from '$lib/dueStatus';
  import type { DueStatus } from '$lib/types';

  let { type, value }: {
    type: 'due' | 'issue-status' | 'severity';
    value: string;
  } = $props();

  $effect(() => {
    console.log(value);
  });

  function badgeClass(): string {
    if (type === 'due') {
      return `badge badge-${value}`;
    }
    if (type === 'issue-status') {
      const cls = value === 'in-progress' ? 'in-progress' : value;
      return `badge badge-${cls}`;
    }
    if (type === 'severity') {
      return `badge badge-${value}`;
    }
    return 'badge';
  }

  function label(): string {
    if (type === 'due') return dueStatusLabel(value as DueStatus);
    if (type === 'issue-status') {
      const map: Record<string, string> = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
        'closed': 'Closed',
      };
      return map[value] ?? value;
    }
    if (type === 'severity') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
  }
</script>

<span class={badgeClass()}>{label()}</span>
