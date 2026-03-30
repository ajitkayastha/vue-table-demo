<template>
  <section class="table-toolbar">
    <div class="table-toolbar__main">
      <label class="table-toolbar__search">
        <span class="table-toolbar__label">Search users</span>
        <input
          :value="searchValue"
          class="table-toolbar__input"
          type="search"
          placeholder="Name, email, company, city, tags"
          @input="$emit('search-input', $event.target.value)"
        />
      </label>

      <div class="table-toolbar__summary">
        <strong>{{ totalRows }}</strong>
        <span>results</span>
        <span class="table-toolbar__summary-muted">
          Page {{ page }} / Size {{ pageSize }}
        </span>
        <button
          class="table-toolbar__clear"
          type="button"
          :disabled="!hasActiveFilters"
          @click="$emit('clear-filters')"
        >
          Clear filters
        </button>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'TableToolbar',
  props: {
    page: {
      type: Number,
      required: true
    },
    pageSize: {
      type: Number,
      required: true
    },
    searchValue: {
      type: String,
      default: ''
    },
    hasActiveFilters: {
      type: Boolean,
      default: false
    },
    totalRows: {
      type: Number,
      default: 0
    }
  }
};
</script>

<style scoped>
.table-toolbar {
  padding: 14px 16px 12px;
  background: #fbfcfe;
  border-bottom: 1px solid var(--color-border);
}

.table-toolbar__main {
  display: flex;
  gap: 12px;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
}

.table-toolbar__search {
  display: grid;
  gap: 4px;
}

.table-toolbar__search {
  min-width: min(360px, 100%);
}

.table-toolbar__label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-toolbar__input {
  width: 100%;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: #fff;
  color: var(--color-text);
  font-size: 13px;
}

.table-toolbar__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}

.table-toolbar__summary {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--color-text-muted);
  font-size: 12px;
}

.table-toolbar__summary strong {
  color: var(--color-text);
  font-size: 16px;
}

.table-toolbar__summary-muted {
  padding-left: 6px;
  border-left: 1px solid var(--color-border);
}

.table-toolbar__clear {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.table-toolbar__clear:disabled {
  opacity: 0.45;
  cursor: default;
}
@media (max-width: 720px) {
  .table-toolbar {
    padding: 12px;
  }

  .table-toolbar__search {
    min-width: 100%;
  }
}
</style>
