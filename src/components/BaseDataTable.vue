<template>
  <div class="base-data-table">
    <vue-good-table
      mode="remote"
      :columns="columns"
      :rows="rows"
      :totalRows="totalRows"
      :line-numbers="false"
      :pagination-options="paginationOptions"
      :sort-options="sortOptions"
      styleClass="vgt-table  striped bordered"
      @on-column-filter="emitColumnFilter"
      @on-page-change="emitPageChange"
      @on-per-page-change="emitPerPageChange"
      @on-sort-change="emitSortChange">
      <template
        slot="column-filter"
        slot-scope="props">
        <slot
          name="column-filter"
          v-bind="props" />
      </template>
      <template
        slot="table-row"
        slot-scope="props">
        <slot
          name="table-row"
          v-bind="props">
          <span>{{ props.formattedRow[props.column.field] }}</span>
        </slot>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
import { TABLE_PAGE_SIZES } from '../utils/tableQuery'

function areFiltersEqual(leftFilters, rightFilters) {
  var leftKeys = Object.keys(leftFilters || {})
  var rightKeys = Object.keys(rightFilters || {})

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every(function compareKey(key) {
    return (
      JSON.stringify(leftFilters[key]) === JSON.stringify(rightFilters[key])
    )
  })
}

export default {
  name: 'BaseDataTable',
  props: {
    columns: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    query: {
      type: Object,
      required: true,
    },
  },
  computed: {
    paginationOptions: function paginationOptions() {
      return {
        enabled: true,
        mode: 'pages',
        perPage: this.query.pageSize,
        perPageDropdown: TABLE_PAGE_SIZES,
        dropdownAllowAll: false,
        nextLabel: 'Next',
        prevLabel: 'Previous',
      }
    },
    sortOptions: function sortOptions() {
      return {
        enabled: true,
        initialSortBy: {
          field: this.query.sortField,
          type: this.query.sortDirection,
        },
      }
    },
  },
  methods: {
    emitPageChange: function emitPageChange(params) {
      var nextPage = params.currentPage

      if (nextPage === this.query.page) {
        return
      }

      this.$emit('page-change', nextPage)
    },
    emitPerPageChange: function emitPerPageChange(params) {
      var nextPageSize = params.currentPerPage

      if (nextPageSize === this.query.pageSize) {
        return
      }

      this.$emit('page-size-change', nextPageSize)
    },
    emitSortChange: function emitSortChange(params) {
      var firstSort = params && params[0] ? params[0] : {}
      var nextField = firstSort.field || this.query.sortField
      var nextDirection = firstSort.type || 'asc'

      if (
        nextField === this.query.sortField &&
        nextDirection === this.query.sortDirection
      ) {
        return
      }

      this.$emit('sort-change', {
        field: nextField,
        direction: nextDirection,
      })
    },
    emitColumnFilter: function emitColumnFilter(params) {
      var nextFilters =
        params && params.columnFilters ? params.columnFilters : {}

      if (areFiltersEqual(nextFilters, this.query.columnFilters)) {
        return
      }

      this.$emit('column-filter-change', nextFilters)
    },
  },
}
</script>

<style scoped>
.base-data-table {
  padding: 0.5rem;
}

.base-data-table /deep/ .vgt-wrap {
  box-shadow: none;
}

.base-data-table /deep/ table.vgt-table {
  font-size: 0.75rem;
  border-radius: 0.5rem;
  overflow: hidden;
}

.base-data-table /deep/ .vgt-table th {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  background: #f6f8fb;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
}

.base-data-table /deep/ .vgt-table td {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  vertical-align: middle;
}

.base-data-table /deep/ .vgt-table thead .vgt-input,
.base-data-table /deep/ .vgt-table thead input {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d7dee7;
  border-radius: 0.25rem;
  background: #fff;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
}

.base-data-table /deep/ .vgt-table thead .vgt-input::placeholder,
.base-data-table /deep/ .vgt-table thead input::placeholder {
  color: #8291a0;
}

.base-data-table /deep/ .vgt-table thead .vgt-input:focus,
.base-data-table /deep/ .vgt-table thead input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(19, 102, 214, 0.08);
}

.base-data-table /deep/ .vgt-table.striped tbody tr:nth-of-type(odd) {
  background: #fcfdff;
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table th {
  background: #182130;
  color: #c7d4e7;
  border-color: #2c3746;
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table td {
  background: #121922;
  color: var(--color-text);
  border-color: #2c3746;
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table.striped tbody tr:nth-of-type(odd) {
  background: #111923;
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table thead .vgt-input,
[data-theme='dark'] .base-data-table /deep/ .vgt-table thead input {
  background: #121a24;
  border-color: #334154;
  color: var(--color-text);
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table thead .vgt-input::placeholder,
[data-theme='dark'] .base-data-table /deep/ .vgt-table thead input::placeholder {
  color: #8fa2b9;
}

[data-theme='dark'] .base-data-table /deep/ .vgt-table thead .vgt-input:focus,
[data-theme='dark'] .base-data-table /deep/ .vgt-table thead input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(114, 167, 255, 0.18);
}

.base-data-table /deep/ .vgt-left-align {
  white-space: nowrap;
}

.base-data-table /deep/ .vgt-global-search {
  display: none;
}

@media (max-width: 720px) {
  .base-data-table {
    padding: 0 8px 8px;
  }
}
</style>
