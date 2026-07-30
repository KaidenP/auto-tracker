<script lang="ts">
  let { title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();
</script>

<div class="overlay" onclick={onCancel} role="presentation">
  <div class="dialog" onclick={(e: MouseEvent) => e.stopPropagation()} role="dialog" aria-modal="true">
    <h3>{title}</h3>
    <p>{message}</p>
    <div class="actions">
      <button class="btn" onclick={onCancel}>{cancelLabel}</button>
      <button class="btn" class:btn-danger={danger} class:btn-primary={!danger} onclick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </div>
</div>

<style>
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
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    max-width: 400px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }
</style>
