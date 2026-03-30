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
      styleClass="vgt-table striped bordered"
      @on-column-filter="emitColumnFilter"
      @on-page-change="emitPageChange"
      @on-per-page-change="emitPerPageChange"
      @on-sort-change="emitSortChange"
    >
      <template slot="column-filter" slot-scope="props">
        <slot name="column-filter" v-bind="props" />
      </template>
      <template slot="table-row" slot-scope="props">
        <slot name="table-row" v-bind="props">
          <span>{{ props.formattedRow[props.column.field] }}</span>
        </slot>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
import { TABLE_PAGE_SIZES } from '../utils/tableQuery';

function areFiltersEqual(leftFilters, rightFilters) {
  var leftKeys = Object.keys(leftFilters || {});
  var rightKeys = Object.keys(rightFilters || {});

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every(function compareKey(key) {
    return JSON.stringify(leftFilters[key]) === JSON.stringify(rightFilters[key]);
  });
}

export default {
  name: 'BaseDataTable',
  props: {
    columns: {
      type: Array,
      required: true
    },
    rows: {
      type: Array,
      required: true
    },
    totalRows: {
      type: Number,
      default: 0
    },
    query: {
      type: Object,
      required: true
    }
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
        prevLabel: 'Previous'
      };
    },
    sortOptions: function sortOptions() {
      return {
        enabled: true,
        initialSortBy: {
          field: this.query.sortField,
          type: this.query.sortDirection
        }
      };
    }
  },
  methods: {
    emitPageChange: function emitPageChange(params) {
      var nextPage = params.currentPage;

      if (nextPage === this.query.page) {
        return;
      }

      this.$emit('page-change', nextPage);
    },
    emitPerPageChange: function emitPerPageChange(params) {
      var nextPageSize = params.currentPerPage;

      if (nextPageSize === this.query.pageSize) {
        return;
      }

      this.$emit('page-size-change', nextPageSize);
    },
    emitSortChange: function emitSortChange(params) {
      var firstSort = params && params[0] ? params[0] : {};
      var nextField = firstSort.field || this.query.sortField;
      var nextDirection = firstSort.type || 'asc';

      if (
        nextField === this.query.sortField &&
        nextDirection === this.query.sortDirection
      ) {
        return;
      }

      this.$emit('sort-change', {
        field: nextField,
        direction: nextDirection
      });
    },
    emitColumnFilter: function emitColumnFilter(params) {
      var nextFilters = params && params.columnFilters ? params.columnFilters : {};

      if (areFiltersEqual(nextFilters, this.query.columnFilters)) {
        return;
      }

      this.$emit('column-filter-change', nextFilters);
    }
  }
};
</script>

<style scoped>
.base-data-table {
  padding: 0 12px 12px;
}

.base-data-table /deep/ .vgt-wrap {
  box-shadow: none;
}

.base-data-table /deep/ table.vgt-table {
  font-size: 13px;
  border-radius: 10px;
  overflow: hidden;
}

.base-data-table /deep/ .vgt-table th {
  padding-top: 10px;
  padding-bottom: 10px;
  background: #f6f8fb;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.base-data-table /deep/ .vgt-table td {
  padding-top: 10px;
  padding-bottom: 10px;
  vertical-align: middle;
}

.base-data-table /deep/ .vgt-table thead .vgt-input,
.base-data-table /deep/ .vgt-table thead input {
  min-height: 30px;
  padding: 6px 8px;
  border: 1px solid #d7dee7;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
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

.base-data-table /deep/ .vgt-left-align {
  white-space: nowrap;
}

.base-data-table /deep/ .vgt-global-search {
  display: none;
}

.base-data-table /deep/ .vgt-pagination {
  padding: 10px 0 0;
  font-size: 12px;
}

.base-data-table /deep/ .vgt-pagination .footer__row-count__label,
.base-data-table /deep/ .vgt-pagination .footer__navigation__page-btn,
.base-data-table /deep/ .vgt-pagination .footer__navigation__info,
.base-data-table /deep/ .vgt-pagination select {
  font-size: 12px;
}

.base-data-table /deep/ .vgt-pagination .footer__navigation__page-btn {
  min-width: 28px;
  height: 28px;
}

@media (max-width: 720px) {
  .base-data-table {
    padding: 0 8px 8px;
  }
}
</style>
