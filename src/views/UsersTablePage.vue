<template>
  <main class="users-page">
    <section class="users-page__hero">
      <p class="users-page__eyebrow">Reusable Vue 2 Table Foundation</p>
      <h1>Users</h1>
      <p class="users-page__intro">
        Server-style pagination, sorting, debounced search, and reusable column
        filters for legacy admin screens.
      </p>
    </section>

    <section class="users-page__table-shell">
      <TableToolbar
        :has-active-filters="hasActiveFiltering"
        :page="query.page"
        :page-size="query.pageSize"
        :search-value="searchInput"
        :total-rows="query.totalRows"
        @clear-filters="clearAllFilters"
        @search-input="handleSearchInput" />

      <TableStateWrapper
        :error="query.error"
        :is-empty="isEmptyState"
        :is-no-results="isNoResultsState"
        :loading="query.loading"
        @retry="fetchTableData">
        <BaseDataTable
          :key="tableRenderKey"
          :columns="columns"
          :query="query"
          :rows="rows"
          :total-rows="query.totalRows"
          @column-filter-change="handleBuiltInColumnFilterChange"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          @sort-change="handleSortChange">
          <template
            slot="column-filter"
            slot-scope="props">
            <div
              v-if="props.column.field === 'tags'"
              class="tag-filter">
              <input
                :value="tagFilterInput"
                class="tag-filter__input"
                type="text"
                placeholder="admin, support or admin support"
                @input="handleTagFilterInput($event.target.value)" />
              <div class="tag-filter__mode">
                <button
                  class="tag-filter__mode-button"
                  :class="{
                    'tag-filter__mode-button--active': tagFilterMode === 'and',
                  }"
                  type="button"
                  @click="handleTagFilterModeChange('and')">
                  AND
                </button>
                <button
                  class="tag-filter__mode-button"
                  :class="{
                    'tag-filter__mode-button--active': tagFilterMode === 'or',
                  }"
                  type="button"
                  @click="handleTagFilterModeChange('or')">
                  OR
                </button>
              </div>
            </div>
            <date-range-picker
              v-else-if="props.column.field === 'joinedAt'"
              :auto-apply="true"
              :append-to-body="false"
              :date-range="joinedDateRange"
              :linked-calendars="false"
              :opens="'left'"
              class="date-range-picker"
              @update="handleJoinedDateRangeUpdate">
              <template
                slot="input"
                slot-scope="picker">
                <button
                  class="date-range-picker__trigger"
                  :class="{
                    'date-range-picker__trigger--placeholder':
                      !picker.startDate || !picker.endDate,
                  }"
                  type="button">
                  {{ formatJoinedRangeLabel(picker.startDate, picker.endDate) }}
                </button>
              </template>
            </date-range-picker>
          </template>
          <template
            slot="table-row"
            slot-scope="props">
            <div
              v-if="props.column.field === 'name'"
              class="cell-user">
              <strong>{{ props.row.name }}</strong>
              <span>{{ props.row.email }}</span>
            </div>

            <div
              v-else-if="props.column.field === 'orderCount'"
              class="cell-metric">
              {{ props.row.orderCount }}
            </div>

            <div v-else-if="props.column.field === 'joinedAt'">
              {{ formatDate(props.row.joinedAt) }}
            </div>

            <div
              v-else-if="props.column.field === 'tags'"
              class="tag-list">
              {{ props.row.tags.join(', ') }}
            </div>

            <div
              v-else-if="props.column.field === 'actions'"
              class="cell-actions">
              <button
                type="button"
                class="icon-button"
                aria-label="View user">
                <LucideIcon :icon="actionIcons.eye" />
              </button>
              <button
                type="button"
                class="icon-button"
                aria-label="Message user">
                <LucideIcon :icon="actionIcons.mail" />
              </button>
            </div>

            <span v-else>{{ props.formattedRow[props.column.field] }}</span>
          </template>
        </BaseDataTable>
      </TableStateWrapper>
    </section>
  </main>
</template>

<script>
import { fetchUsersTable } from '../api/tableService'
import BaseDataTable from '../components/BaseDataTable.vue'
import LucideIcon from '../components/LucideIcon.vue'
import TableStateWrapper from '../components/TableStateWrapper.vue'
import TableToolbar from '../components/TableToolbar.vue'
import DateRangePicker from 'vue2-daterange-picker'
import { Eye, Mail } from 'lucide'
import { debounce } from '../utils/debounce'
import {
  createTableQuery,
  normalizeQueryForRequest,
  replaceColumnFilters,
  resetPage,
} from '../utils/tableQuery'

export default {
  name: 'UsersTablePage',
  components: {
    BaseDataTable,
    DateRangePicker,
    LucideIcon,
    TableStateWrapper,
    TableToolbar,
  },
  data: function data() {
    return {
      actionIcons: {
        eye: Eye,
        mail: Mail,
      },
      columns: [
        {
          label: 'User',
          field: 'name',
          type: 'text',
          sortable: true,
          filterable: true,
          width: '240px',
          filterKey: 'name',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter user',
            slotFilterField: 'name',
          },
        },
        {
          label: 'Username',
          field: 'username',
          type: 'text',
          sortable: true,
          filterable: false,
          width: '140px',
        },
        {
          label: 'Company',
          field: 'company',
          type: 'text',
          sortable: true,
          filterable: true,
          width: '180px',
          filterKey: 'company',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter company',
            slotFilterField: 'company',
          },
        },
        {
          label: 'Orders',
          field: 'orderCount',
          type: 'number',
          sortable: true,
          filterable: true,
          width: '110px',
          filterKey: 'orderCountMin',
          filterOptions: {
            enabled: true,
            placeholder: 'Min orders',
            slotFilterField: 'orderCountMin',
          },
        },
        {
          label: 'Joined',
          field: 'joinedAt',
          type: 'date',
          sortable: true,
          filterable: true,
          width: '150px',
          dateInputFormat: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
          dateOutputFormat: 'MMM d, yyyy',
          filterKey: 'joinedAfter',
          filterOptions: {
            enabled: true,
            placeholder: 'Date range',
          },
        },
        {
          label: 'Tags',
          field: 'tags',
          type: 'text',
          sortable: false,
          filterable: true,
          width: '220px',
          filterKey: 'tags',
          filterOptions: {
            enabled: true,
            placeholder: 'Filter tags',
            slotFilterField: 'tags',
          },
        },
        {
          label: 'Actions',
          field: 'actions',
          sortable: false,
          filterable: false,
          width: '96px',
        },
      ],
      query: createTableQuery({
        sortField: 'name',
      }),
      joinedDateRange: {
        startDate: null,
        endDate: null,
      },
      requestSequence: 0,
      rows: [],
      searchInput: '',
      tagFilterInput: '',
      tagFilterMode: 'and',
      tableRenderKey: 0,
    }
  },
  created: function created() {
    this.debouncedSearch = debounce(this.commitSearch, 300)
    this.fetchTableData()
  },
  computed: {
    hasActiveFiltering: function hasActiveFiltering() {
      return (
        Boolean(this.query.globalSearch) ||
        Object.keys(this.query.columnFilters).length > 0
      )
    },
    isEmptyState: function isEmptyState() {
      return (
        !this.query.loading &&
        !this.query.error &&
        this.query.totalRows === 0 &&
        !this.hasActiveFiltering
      )
    },
    isNoResultsState: function isNoResultsState() {
      return (
        !this.query.loading &&
        !this.query.error &&
        this.query.totalRows === 0 &&
        this.hasActiveFiltering
      )
    },
  },
  methods: {
    sanitizeColumnFilters: function sanitizeColumnFilters(filters) {
      var nextFilters = Object.assign({}, filters)

      ;['name', 'company'].forEach(function sanitizeTextFilter(field) {
        var value = nextFilters[field]
        var normalizedValue = typeof value === 'string' ? value.trim() : value

        if (!normalizedValue || normalizedValue.length < 3) {
          delete nextFilters[field]
          return
        }

        nextFilters[field] = normalizedValue
      })

      return nextFilters
    },
    async fetchTableData() {
      var requestId = this.requestSequence + 1

      this.requestSequence = requestId
      this.query = Object.assign({}, this.query, {
        loading: true,
        error: '',
      })

      try {
        var response = await fetchUsersTable(
          normalizeQueryForRequest(this.query),
        )

        if (requestId !== this.requestSequence) {
          return
        }

        this.rows = response.rows
        this.query = Object.assign({}, this.query, {
          loading: false,
          totalRows: response.meta.totalRows,
        })
      } catch (error) {
        if (requestId !== this.requestSequence) {
          return
        }

        this.rows = []
        this.query = Object.assign({}, this.query, {
          loading: false,
          error:
            error && error.message
              ? error.message
              : 'Unable to load table data.',
          totalRows: 0,
        })
      }
    },
    handlePageChange: function handlePageChange(nextPage) {
      this.query = Object.assign({}, this.query, {
        page: nextPage,
      })
      this.fetchTableData()
    },
    handlePageSizeChange: function handlePageSizeChange(nextPageSize) {
      this.query = Object.assign({}, this.query, {
        page: 1,
        pageSize: nextPageSize,
      })
      this.fetchTableData()
    },
    handleSortChange: function handleSortChange(sort) {
      this.query = Object.assign({}, this.query, {
        page: 1,
        sortField: sort.field || this.query.sortField,
        sortDirection: sort.direction || 'asc',
      })
      this.fetchTableData()
    },
    handleSearchInput: function handleSearchInput(value) {
      var normalizedValue = value.trim()

      this.searchInput = value

      if (!normalizedValue.length) {
        if (this.query.globalSearch) {
          this.commitSearch('')
        }
        return
      }

      if (normalizedValue.length < 3) {
        if (this.query.globalSearch) {
          this.commitSearch('')
        }

        return
      }

      this.debouncedSearch(normalizedValue)
    },
    clearAllFilters: function clearAllFilters() {
      this.searchInput = ''
      this.tagFilterInput = ''
      this.tagFilterMode = 'and'
      this.joinedDateRange = {
        startDate: null,
        endDate: null,
      }
      this.tableRenderKey += 1
      this.query = Object.assign({}, this.query, {
        page: 1,
        globalSearch: '',
        columnFilters: {},
        error: '',
      })
      this.fetchTableData()
    },
    commitSearch: function commitSearch(value) {
      this.query = resetPage(
        Object.assign({}, this.query, {
          globalSearch: value,
        }),
      )
      this.fetchTableData()
    },
    mergeCustomColumnFilters: function mergeCustomColumnFilters(filters) {
      var nextFilters = Object.assign({}, filters)
      var customKeys = [
        'tags',
        'tagsMode',
        'joinedAtFrom',
        'joinedFrom',
        'joinedAtTo',
        'joinedTo',
      ]
      var currentFilters = this.query.columnFilters || {}

      customKeys.forEach(function preserveCustomFilter(key) {
        if (
          Object.prototype.hasOwnProperty.call(currentFilters, key) &&
          !Object.prototype.hasOwnProperty.call(nextFilters, key)
        ) {
          nextFilters[key] = currentFilters[key]
        }
      })

      return nextFilters
    },
    handleBuiltInColumnFilterChange: function handleBuiltInColumnFilterChange(
      filters,
    ) {
      this.handleColumnFilterChange(this.mergeCustomColumnFilters(filters))
    },
    handleColumnFilterChange: function handleColumnFilterChange(filters) {
      var nextQuery = replaceColumnFilters(
        this.query,
        this.sanitizeColumnFilters(filters),
      )

      if (
        JSON.stringify(nextQuery.columnFilters) ===
        JSON.stringify(this.query.columnFilters)
      ) {
        return
      }

      this.query = nextQuery
      this.fetchTableData()
    },
    syncTagFilters: function syncTagFilters() {
      var normalizedTags = this.tagFilterInput
        .split(/[\s,]+/)
        .map(function mapTag(tag) {
          return tag.trim()
        })
        .filter(Boolean)
      var nextFilters = Object.assign({}, this.query.columnFilters)

      if (normalizedTags.length) {
        nextFilters.tags = normalizedTags
        nextFilters.tagsMode = this.tagFilterMode
      } else {
        delete nextFilters.tags
        delete nextFilters.tagsMode
      }

      this.handleColumnFilterChange(nextFilters)
    },
    handleTagFilterInput: function handleTagFilterInput(value) {
      this.tagFilterInput = value
      this.syncTagFilters()
    },
    handleTagFilterModeChange: function handleTagFilterModeChange(mode) {
      this.tagFilterMode = mode
      this.syncTagFilters()
    },
    handleJoinedDateRangeUpdate: function handleJoinedDateRangeUpdate(range) {
      var nextRange = {
        startDate: range && range.startDate ? new Date(range.startDate) : null,
        endDate: range && range.endDate ? new Date(range.endDate) : null,
      }
      var nextFilters = Object.assign({}, this.query.columnFilters)

      this.joinedDateRange = nextRange

      if (nextRange.startDate) {
        nextFilters.joinedAtFrom = this.formatFilterDate(nextRange.startDate)
      } else {
        delete nextFilters.joinedAtFrom
        delete nextFilters.joinedFrom
      }

      if (nextRange.endDate) {
        nextFilters.joinedAtTo = this.formatFilterDate(nextRange.endDate)
      } else {
        delete nextFilters.joinedAtTo
        delete nextFilters.joinedTo
      }

      this.handleColumnFilterChange(nextFilters)
    },
    formatFilterDate: function formatFilterDate(value) {
      var year = value.getFullYear()
      var month = String(value.getMonth() + 1).padStart(2, '0')
      var day = String(value.getDate()).padStart(2, '0')

      return [year, month, day].join('-')
    },
    formatJoinedRangeLabel: function formatJoinedRangeLabel(
      startDate,
      endDate,
    ) {
      if (!startDate || !endDate) {
        return 'Select range'
      }

      return [this.formatDate(startDate), this.formatDate(endDate)].join(' - ')
    },
    formatDate: function formatDate(value) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
.users-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.users-page__hero {
  margin-bottom: 14px;
}

.users-page__eyebrow {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.users-page h1 {
  margin: 0;
  font-size: clamp(24px, 4vw, 32px);
  line-height: 1.1;
}

.users-page__intro {
  max-width: 760px;
  margin: 8px 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.users-page__table-shell {
  background: var(--color-surface);
  border: 1px solid rgba(215, 222, 231, 0.8);
  border-radius: 0.5rem;
  box-shadow: 0 14px 34px rgba(21, 32, 43, 0.06);
  overflow: hidden;
}

.cell-user {
  display: grid;
  gap: 0;
  line-height: 1.2;
}

.cell-user span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.cell-metric {
  font-weight: 500;
  color: var(--color-success);
}

.tag-list {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  line-height: 1.2;
}

.tag-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 240px;
  padding: 2px 0;
}

.tag-filter__input {
  flex: 1 1 auto;
  width: auto;
  min-height: 2rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d7dee7;
  border-radius: 0.25rem;
  background: #fff;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
}

.tag-filter__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(19, 102, 214, 0.08);
}

.tag-filter__mode {
  display: inline-flex;
  flex: 0 0 auto;
  padding: 0.125rem;
  border: 1px solid #d7dee7;
  border-radius: 999px;
  background: #f6f8fb;
}

.tag-filter__mode-button {
  min-height: 22px;
  min-width: 34px;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
}

.tag-filter__mode-button--active {
  background: #fff;
  color: #214d9a;
  box-shadow: 0 1px 2px rgba(21, 32, 43, 0.08);
}

.date-range-picker {
  min-width: 180px;
  width: 100%;
}

.date-range-picker /deep/ .reportrange-text {
  width: 100%;
}

.date-range-picker /deep/ .date-range-picker__trigger,
.date-range-picker /deep/ .daterangepicker-text-input,
.date-range-picker /deep/ .form-control.reportrange-text {
  box-shadow: none;
}

.date-range-picker /deep/ .form-control.reportrange-text {
  padding: 0;
  border: 0;
  background: transparent;
}

.date-range-picker__trigger {
  width: 100%;
  min-height: 2rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d7dee7;
  border-radius: 0.25rem;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  line-height: 1.2;
  text-align: left;
}

.date-range-picker__trigger:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(19, 102, 214, 0.08);
}

.date-range-picker__trigger:empty,
.date-range-picker__trigger--placeholder {
  color: #8291a0;
}

.cell-actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #d7dee7;
  border-radius: 6px;
  background: #fff;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 12px;
}

.icon-button:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(19, 102, 214, 0.08);
}

@media (max-width: 720px) {
  .users-page {
    padding: 18px 10px;
  }
}
</style>
