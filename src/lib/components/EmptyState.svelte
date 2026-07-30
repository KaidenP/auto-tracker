<script lang="ts">
  let { title, description, actionLabel, onAction }: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  } = $props();
</script>

<div class="empty-state">
  <div class="empty-state-icon">📋</div>
  <h3>{title}</h3>
  <p>{description}</p>
  {#if actionLabel && onAction}
    <button class="btn btn-primary" onclick={onAction}>
      {actionLabel}
    </button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2xl);
    text-align: center;
    color: var(--color-text-secondary);
    gap: var(--spacing-md);
  }

  .empty-state-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    color: var(--color-text);
  }

  .empty-state p {
    max-width: 400px;
  }
</style>
