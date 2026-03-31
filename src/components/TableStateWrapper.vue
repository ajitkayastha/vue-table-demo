<template>
  <div class="table-state-wrapper">
    <div v-if="error" class="table-state table-state--error">
      <p>{{ error }}</p>
      <button class="table-state__button" type="button" @click="$emit('retry')">
        Retry
      </button>
    </div>

    <div v-else-if="isEmpty" class="table-state table-state--empty">
      No records available yet.
    </div>

    <div v-else class="table-state-wrapper__content">
      <slot />

      <div v-if="isNoResults && !loading" class="table-state-inline">
        No results match the current search and filters.
      </div>

      <div v-if="loading" class="table-state-overlay">
        <div class="table-state-overlay__panel">
          <span class="table-state-overlay__spinner" />
          <span>Refreshing data...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableStateWrapper',
  props: {
    error: {
      type: String,
      default: ''
    },
    isEmpty: {
      type: Boolean,
      default: false
    },
    isNoResults: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.table-state-wrapper {
  position: relative;
  min-height: 320px;
}

.table-state-wrapper__content {
  position: relative;
}

.table-state-inline {
  display: flex;
  justify-content: center;
  padding: 10px 16px 2px;
  color: var(--color-text-muted);
  font-size: 12px;
}

.table-state {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 24px;
  color: var(--color-text-muted);
  text-align: center;
}

.table-state--error {
  color: var(--color-danger);
}

.table-state--empty {
  color: var(--color-text-muted);
}

.table-state__button {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.table-state-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(1px);
  pointer-events: none;
}

.table-state-overlay__panel {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(19, 102, 214, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 10px 22px rgba(21, 32, 43, 0.08);
}

.table-state-overlay__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(19, 102, 214, 0.18);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: table-spin 0.8s linear infinite;
}

@keyframes table-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
