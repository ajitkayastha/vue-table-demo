<template>
  <div class="base-ag-grid-table">
    <ag-grid-vue
      ref="grid"
      class="ag-theme-alpine base-ag-grid-table__grid"
      :components="gridComponents"
      :columnDefs="columnDefs"
      :defaultColDef="defaultColDef"
      :overlayNoRowsTemplate="overlayNoRowsTemplate"
      :animateRows="true"
      :headerHeight="32"
      :floatingFiltersHeight="38"
      :rowHeight="34"
      :pagination="true"
      :paginationPageSize="query.pageSize"
      :rowData="gridRows"
      :rowModelType="'clientSide'"
      :suppressPaginationPanel="true"
      @grid-ready="handleGridReady"
      @filter-changed="handleFilterChanged"
      @pagination-changed="handlePaginationChanged"
      @sort-changed="handleSortChanged" />

    <footer class="base-ag-grid-table__footer">
      <div class="base-ag-grid-table__meta">
        <span>{{ effectiveTotalRows }} rows</span>
      </div>
      <div class="base-ag-grid-table__controls">
        <button
          type="button"
          class="base-ag-grid-table__csv-button"
          @click="exportCsv">
          Export CSV
        </button>
        <button
          type="button"
          class="base-ag-grid-table__csv-button"
          @click="openImportDialog">
          Import CSV
        </button>
        <input
          ref="csvInput"
          class="base-ag-grid-table__csv-input"
          type="file"
          accept=".csv,text/csv"
          @change="handleCsvImport" />
        <label class="base-ag-grid-table__page-size">
          <span>Page size</span>
          <select
            :value="query.pageSize"
            @change="handlePageSizeInput($event.target.value)">
            <option
              v-for="size in pageSizes"
              :key="size"
              :value="size">
              {{ size }}
            </option>
          </select>
        </label>
        <button
          type="button"
          class="base-ag-grid-table__pager-button"
          :disabled="query.page <= 1"
          @click="goToPage(query.page - 1)">
          Previous
        </button>
        <span class="base-ag-grid-table__pager-text">
          Page {{ query.page }} / {{ totalPages }}
        </span>
        <button
          type="button"
          class="base-ag-grid-table__pager-button"
          :disabled="query.page >= totalPages"
          @click="goToPage(query.page + 1)">
          Next
        </button>
      </div>
    </footer>
  </div>
</template>

<script>
import { AgGridVue } from 'ag-grid-vue'
import { Eye, Mail } from 'lucide'
import { TABLE_PAGE_SIZES } from '../utils/tableQuery'

function TagsFloatingFilter() {}

TagsFloatingFilter.prototype.init = function init(params) {
  this.params = params
  this.filterParams =
    (params && params.column && params.column.getColDef().filterParams) || {}
  this.mode =
    this.filterParams && this.filterParams.getMatchMode
      ? this.filterParams.getMatchMode()
      : 'and'

  this.eGui = document.createElement('div')
  this.eGui.className = 'tags-floating-filter'
  this.eInput = document.createElement('input')
  this.eInput.className = 'tags-floating-filter__input'
  this.eInput.type = 'text'
  this.eInput.placeholder = 'admin, support'

  this.eMode = document.createElement('div')
  this.eMode.className = 'tags-floating-filter__mode'

  this.eAnd = document.createElement('button')
  this.eAnd.type = 'button'
  this.eAnd.textContent = 'AND'
  this.eAnd.className = 'tags-floating-filter__button'

  this.eOr = document.createElement('button')
  this.eOr.type = 'button'
  this.eOr.textContent = 'OR'
  this.eOr.className = 'tags-floating-filter__button'

  this.eMode.appendChild(this.eAnd)
  this.eMode.appendChild(this.eOr)
  this.eGui.appendChild(this.eInput)
  this.eGui.appendChild(this.eMode)

  this.updateModeButtons()

  this.onInput = this.handleInput.bind(this)
  this.onAnd = this.handleModeChange.bind(this, 'and')
  this.onOr = this.handleModeChange.bind(this, 'or')
  this.eInput.addEventListener('input', this.onInput)
  this.eAnd.addEventListener('click', this.onAnd)
  this.eOr.addEventListener('click', this.onOr)
}

TagsFloatingFilter.prototype.getGui = function getGui() {
  return this.eGui
}

TagsFloatingFilter.prototype.onParentModelChanged =
  function onParentModelChanged(parentModel) {
    var nextValue =
      parentModel && parentModel.filter ? String(parentModel.filter) : ''

    if (this.eInput.value !== nextValue) {
      this.eInput.value = nextValue
    }
  }

TagsFloatingFilter.prototype.handleInput = function handleInput() {
  var value = this.eInput.value

  this.params.parentFilterInstance(function updateParent(instance) {
    if (instance && instance.onFloatingFilterChanged) {
      instance.onFloatingFilterChanged('contains', value)
    }
  })
}

TagsFloatingFilter.prototype.handleModeChange = function handleModeChange(mode) {
  if (mode === this.mode) {
    return
  }

  this.mode = mode
  this.updateModeButtons()

  if (this.filterParams && this.filterParams.setMatchMode) {
    this.filterParams.setMatchMode(mode)
  }
}

TagsFloatingFilter.prototype.updateModeButtons = function updateModeButtons() {
  this.eAnd.classList.toggle(
    'tags-floating-filter__button--active',
    this.mode === 'and',
  )
  this.eOr.classList.toggle(
    'tags-floating-filter__button--active',
    this.mode === 'or',
  )
}

TagsFloatingFilter.prototype.destroy = function destroy() {
  if (this.eInput && this.onInput) {
    this.eInput.removeEventListener('input', this.onInput)
  }

  if (this.eAnd && this.onAnd) {
    this.eAnd.removeEventListener('click', this.onAnd)
  }

  if (this.eOr && this.onOr) {
    this.eOr.removeEventListener('click', this.onOr)
  }
}

export default {
  name: 'BaseAgGridTable',
  components: {
    AgGridVue,
  },
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
  data: function data() {
    return {
      gridApi: null,
      pageSizes: TABLE_PAGE_SIZES,
      suppressPaginationSync: false,
      suppressSortSync: false,
      tagsMatchMode: 'and',
      overlayMessage: 'No rows to show',
      importedRows: null,
      resizeHandler: null,
    }
  },
  computed: {
    gridComponents: function gridComponents() {
      return {
        tagsFloatingFilter: TagsFloatingFilter,
      }
    },
    defaultColDef: function defaultColDef() {
      return {
        sortable: true,
        filter: true,
        suppressMenu: true,
        floatingFilter: true,
        floatingFilterComponentParams: {
          suppressFilterButton: true,
        },
        resizable: true,
      }
    },
    columnDefs: function columnDefs() {
      return this.columns.map(
        function mapColumn(column) {
          return {
            headerName: column.label,
            field: column.field,
            sortable:
              column.field === 'tags' ? true : Boolean(column.sortable),
            width: this.getColumnWidth(column.width),
            filter: this.getColumnFilter(column),
            filterParams: this.getColumnFilterParams(column),
            suppressMenu:
              column.field === 'name' || column.field === 'joinedAt'
                ? false
                : true,
            floatingFilterComponent:
              column.field === 'tags' ? 'tagsFloatingFilter' : undefined,
            floatingFilterComponentParams:
              column.field === 'name' || column.field === 'joinedAt'
                ? { suppressFilterButton: false }
                : { suppressFilterButton: true },
            cellClass: this.getColumnCellClass(column),
            cellRenderer: this.createCellRenderer(column),
            valueFormatter: this.createValueFormatter(column),
            valueGetter: this.createValueGetter(column),
          }
        }.bind(this),
      )
    },
    gridRows: function gridRows() {
      return this.importedRows || this.rows
    },
    effectiveTotalRows: function effectiveTotalRows() {
      if (this.importedRows) {
        return this.importedRows.length
      }

      return this.totalRows
    },
    totalPages: function totalPages() {
      var pages = Math.ceil((this.effectiveTotalRows || 0) / this.query.pageSize)
      return pages > 0 ? pages : 1
    },
    overlayNoRowsTemplate: function overlayNoRowsTemplate() {
      return (
        '<span class="ag-overlay-no-rows-center base-ag-grid-table__overlay-message">' +
        this.overlayMessage +
        '</span>'
      )
    },
  },
  watch: {
    rows: function rows() {
      this.syncCurrentPage()
      this.updateNoRowsOverlay()
    },
    'query.loading': function queryLoading(nextLoading) {
      if (nextLoading && this.importedRows) {
        this.importedRows = null
      }
    },
    'query.page': function queryPage(nextPage) {
      if (!this.gridApi) {
        return
      }

      this.suppressPaginationSync = true
      this.gridApi.paginationGoToPage(nextPage - 1)
      this.$nextTick(
        function resetPaginationSync() {
          this.suppressPaginationSync = false
        }.bind(this),
      )
    },
    'query.pageSize': function queryPageSize(nextPageSize) {
      if (!this.gridApi) {
        return
      }

      this.gridApi.paginationSetPageSize(nextPageSize)
      this.syncCurrentPage()
    },
    'query.sortField': function querySortField() {
      this.syncSortState()
    },
    'query.sortDirection': function querySortDirection() {
      this.syncSortState()
    },
  },
  beforeDestroy: function beforeDestroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
  },
  methods: {
    handleGridReady: function handleGridReady(params) {
      this.gridApi = params.api
      this.gridApi.paginationSetPageSize(this.query.pageSize)
      this.resizeColumnsToFit()
      this.resizeHandler = this.resizeColumnsToFit.bind(this)
      window.addEventListener('resize', this.resizeHandler)
      this.syncSortState()
      this.syncCurrentPage()
      this.updateNoRowsOverlay()
    },
    resizeColumnsToFit: function resizeColumnsToFit() {
      if (!this.gridApi) {
        return
      }

      this.$nextTick(
        function fitGridColumns() {
          if (this.gridApi) {
            this.gridApi.sizeColumnsToFit()
          }
        }.bind(this),
      )
    },
    handleFilterChanged: function handleFilterChanged() {
      this.syncCurrentPage()
      this.updateNoRowsOverlay()
    },
    handlePaginationChanged: function handlePaginationChanged() {
      if (!this.gridApi || this.suppressPaginationSync) {
        return
      }

      var nextPage = this.gridApi.paginationGetCurrentPage() + 1

      if (nextPage !== this.query.page) {
        this.$emit('page-change', nextPage)
      }
    },
    handleSortChanged: function handleSortChanged() {
      if (!this.gridApi || this.suppressSortSync) {
        return
      }

      var sortState = this.gridApi
        .getColumnState()
        .find(function findSortedColumn(column) {
          return Boolean(column.sort)
        })

      if (!sortState) {
        if (this.query.sortField || this.query.sortDirection !== 'asc') {
          this.$emit('sort-change', {
            field: '',
            direction: 'asc',
          })
        }
        return
      }

      if (
        sortState.colId === this.query.sortField &&
        sortState.sort === this.query.sortDirection
      ) {
        return
      }

      this.$emit('sort-change', {
        field: sortState.colId,
        direction: sortState.sort || 'asc',
      })
    },
    handlePageSizeInput: function handlePageSizeInput(value) {
      var nextPageSize = Number(value)

      if (!nextPageSize || nextPageSize === this.query.pageSize) {
        return
      }

      this.$emit('page-size-change', nextPageSize)
    },
    goToPage: function goToPage(nextPage) {
      if (nextPage < 1 || nextPage > this.totalPages) {
        return
      }

      if (nextPage === this.query.page) {
        return
      }

      this.$emit('page-change', nextPage)
    },
    syncCurrentPage: function syncCurrentPage() {
      if (!this.gridApi) {
        return
      }

      var maxPage = this.gridApi.paginationGetTotalPages()

      if (!maxPage || maxPage < 1) {
        maxPage = 1
      }

      var targetPage = this.query.page

      if (targetPage > maxPage) {
        this.$emit('page-change', maxPage)
        return
      }

      this.gridApi.paginationGoToPage(targetPage - 1)
    },
    syncSortState: function syncSortState() {
      if (!this.gridApi) {
        return
      }

      this.suppressSortSync = true
      this.gridApi.applyColumnState({
        defaultState: {
          sort: null,
        },
        state: this.query.sortField
          ? [
              {
                colId: this.query.sortField,
                sort: this.query.sortDirection || 'asc',
              },
            ]
          : [],
      })
      this.$nextTick(
        function releaseSortSync() {
          this.suppressSortSync = false
        }.bind(this),
      )
    },
    getColumnWidth: function getColumnWidth(value) {
      if (!value) {
        return undefined
      }

      if (typeof value === 'number') {
        return value
      }

      if (typeof value === 'string') {
        return parseInt(value, 10)
      }

      return undefined
    },
    getColumnFilter: function getColumnFilter(column) {
      if (column.field === 'actions') {
        return false
      }

      if (column.field === 'tags') {
        return 'agTextColumnFilter'
      }

      if (column.field === 'orderCount') {
        return 'agNumberColumnFilter'
      }

      if (column.field === 'joinedAt') {
        return 'agDateColumnFilter'
      }

      return 'agTextColumnFilter'
    },
    getColumnFilterParams: function getColumnFilterParams(column) {
      var vm = this

      if (column.field === 'joinedAt') {
        return {
          comparator: function compareDateFilter(filterLocalDateAtMidnight, cellValue) {
            if (!cellValue) {
              return -1
            }

            var cellDate = new Date(cellValue)

            cellDate.setHours(0, 0, 0, 0)

            if (cellDate < filterLocalDateAtMidnight) {
              return -1
            }

            if (cellDate > filterLocalDateAtMidnight) {
              return 1
            }

            return 0
          },
        }
      }

      if (column.field === 'tags') {
        return {
          trimInput: true,
          maxNumConditions: 1,
          numAlwaysVisibleConditions: 1,
          defaultOption: 'contains',
          filterOptions: ['contains'],
          getMatchMode: function getMatchMode() {
            return vm.tagsMatchMode
          },
          setMatchMode: function setMatchMode(mode) {
            vm.setTagsMatchMode(mode)
          },
          textMatcher: function tagsMatcher(params) {
            var rawFilter = String(params.filterText || '')
              .trim()
              .toLowerCase()

            if (!rawFilter) {
              return true
            }

            var tagsText = String(params.value || '').toLowerCase()
            var tokens = rawFilter
              .split(/[\s,]+/)
              .map(function mapToken(token) {
                return token.trim()
              })
              .filter(Boolean)

            if (!tokens.length) {
              return true
            }

            if (vm.tagsMatchMode === 'or') {
              return tokens.some(function matchTokenOr(token) {
                return tagsText.indexOf(token) !== -1
              })
            }

            return tokens.every(function matchTokenAnd(token) {
              return tagsText.indexOf(token) !== -1
            })
          },
        }
      }

      return undefined
    },
    createValueGetter: function createValueGetter(column) {
      if (column.field === 'tags') {
        return function getTagsValue(params) {
          return Array.isArray(params.data.tags) ? params.data.tags.join(', ') : ''
        }
      }

      return undefined
    },
    getColumnCellClass: function getColumnCellClass(column) {
      if (column.field === 'orderCount' || column.field === 'joinedAt') {
        return 'ag-right-aligned-cell'
      }

      if (column.field === 'actions') {
        return 'ag-actions-cell'
      }

      return undefined
    },
    createCellRenderer: function createCellRenderer(column) {
      if (column.field === 'actions') {
        return function renderActions() {
          var wrapper = document.createElement('div')
          var viewIcon = document.createElement('span')
          var messageIcon = document.createElement('span')

          wrapper.className = 'ag-action-cell'
          viewIcon.className = 'ag-action-icon'
          viewIcon.setAttribute('title', 'View user')
          viewIcon.setAttribute('aria-hidden', 'true')
          viewIcon.appendChild(this.createLucideIcon(Eye))

          messageIcon.className = 'ag-action-icon'
          messageIcon.setAttribute('title', 'Message user')
          messageIcon.setAttribute('aria-hidden', 'true')
          messageIcon.appendChild(this.createLucideIcon(Mail))

          wrapper.appendChild(viewIcon)
          wrapper.appendChild(messageIcon)

          return wrapper
        }.bind(this)
      }

      return undefined
    },
    createLucideIcon: function createLucideIcon(iconNode) {
      var namespace = 'http://www.w3.org/2000/svg'
      var svg = document.createElementNS(namespace, 'svg')

      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', 'currentColor')
      svg.setAttribute('stroke-width', '2')
      svg.setAttribute('stroke-linecap', 'round')
      svg.setAttribute('stroke-linejoin', 'round')
      svg.setAttribute('width', '14')
      svg.setAttribute('height', '14')
      svg.setAttribute('aria-hidden', 'true')

      ;(iconNode || []).forEach(function addNode(node) {
        var tagName = node[0]
        var attributes = node[1] || {}
        var element = document.createElementNS(namespace, tagName)

        Object.keys(attributes).forEach(function setAttribute(key) {
          element.setAttribute(key, String(attributes[key]))
        })

        svg.appendChild(element)
      })

      return svg
    },
    setTagsMatchMode: function setTagsMatchMode(mode) {
      if (mode !== 'and' && mode !== 'or') {
        return
      }

      this.tagsMatchMode = mode

      if (this.gridApi) {
        this.gridApi.onFilterChanged()
      }
    },
    updateNoRowsOverlay: function updateNoRowsOverlay() {
      if (!this.gridApi) {
        return
      }

      var totalRows = Array.isArray(this.rows) ? this.rows.length : 0
      var displayedRows = this.gridApi.getDisplayedRowCount()
      var nextOverlayMessage =
        totalRows > 0 && displayedRows === 0
          ? 'No matching results'
          : 'No rows to show'

      if (this.overlayMessage !== nextOverlayMessage) {
        this.overlayMessage = nextOverlayMessage
      }

      this.$nextTick(
        function syncOverlayVisibility() {
          if (!this.gridApi) {
            return
          }

          if (displayedRows === 0) {
            this.gridApi.showNoRowsOverlay()
            return
          }

          this.gridApi.hideOverlay()
        }.bind(this),
      )
    },
    exportCsv: function exportCsv() {
      if (!this.gridApi) {
        return
      }

      this.gridApi.exportDataAsCsv({
        fileName: 'users-table.csv',
      })
    },
    openImportDialog: function openImportDialog() {
      if (this.$refs.csvInput) {
        this.$refs.csvInput.click()
      }
    },
    handleCsvImport: function handleCsvImport(event) {
      var input = event && event.target ? event.target : null
      var file = input && input.files ? input.files[0] : null
      var vm = this

      if (!file) {
        return
      }

      var reader = new FileReader()

      reader.onload = function onLoad(loadEvent) {
        var csvText = String(
          loadEvent && loadEvent.target ? loadEvent.target.result || '' : '',
        )

        vm.applyImportedCsv(csvText)
      }
      reader.readAsText(file)

      if (input) {
        input.value = ''
      }
    },
    applyImportedCsv: function applyImportedCsv(csvText) {
      var parsed = this.parseCsv(csvText)
      var header = parsed.length ? parsed[0] : []
      var body = parsed.slice(1)
      var fieldByHeader = this.createHeaderFieldMap(header)
      var rows = body
        .map(
          function mapCsvRow(row, index) {
            return this.toRowModel(row, fieldByHeader, index)
          }.bind(this),
        )
        .filter(Boolean)

      this.importedRows = rows
      this.$emit('page-change', 1)
      this.$nextTick(
        function syncAfterImport() {
          this.updateNoRowsOverlay()
        }.bind(this),
      )
    },
    parseCsv: function parseCsv(text) {
      var rows = []
      var row = []
      var value = ''
      var inQuotes = false
      var index = 0

      while (index < text.length) {
        var char = text[index]
        var next = text[index + 1]

        if (char === '"') {
          if (inQuotes && next === '"') {
            value += '"'
            index += 2
            continue
          }

          inQuotes = !inQuotes
          index += 1
          continue
        }

        if (!inQuotes && char === ',') {
          row.push(value)
          value = ''
          index += 1
          continue
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
          if (char === '\r' && next === '\n') {
            index += 1
          }

          row.push(value)
          rows.push(row)
          row = []
          value = ''
          index += 1
          continue
        }

        value += char
        index += 1
      }

      if (value.length > 0 || row.length > 0) {
        row.push(value)
        rows.push(row)
      }

      return rows
    },
    createHeaderFieldMap: function createHeaderFieldMap(header) {
      var fieldLookup = {}
      var mapByIndex = {}

      this.columns.forEach(function registerColumn(column) {
        fieldLookup[String(column.field).toLowerCase()] = column.field
        fieldLookup[String(column.label).toLowerCase()] = column.field
      })

      header.forEach(function registerHeader(columnName, columnIndex) {
        var normalized = String(columnName || '')
          .trim()
          .toLowerCase()
        var field = fieldLookup[normalized]

        if (field) {
          mapByIndex[columnIndex] = field
        }
      })

      return mapByIndex
    },
    toRowModel: function toRowModel(csvRow, fieldByHeader, index) {
      var row = {
        id: index + 1,
      }
      var hasMappedFields = false

      Object.keys(fieldByHeader).forEach(
        function mapField(indexKey) {
          var columnIndex = Number(indexKey)
          var field = fieldByHeader[indexKey]
          var rawValue = String(csvRow[columnIndex] || '').trim()

          hasMappedFields = true

          if (field === 'orderCount') {
            var numericValue = Number(rawValue)
            row[field] = Number.isNaN(numericValue) ? 0 : numericValue
            return
          }

          if (field === 'joinedAt') {
            var dateValue = new Date(rawValue)

            row[field] = Number.isNaN(dateValue.getTime())
              ? ''
              : dateValue.toISOString()
            return
          }

          if (field === 'tags') {
            row[field] = rawValue
              .split(/[|,;]+/)
              .map(function mapTag(tag) {
                return tag.trim()
              })
              .filter(Boolean)
            return
          }

          row[field] = rawValue
        }.bind(this),
      )

      if (!hasMappedFields) {
        return null
      }

      if (!Array.isArray(row.tags)) {
        row.tags = []
      }

      if (typeof row.orderCount !== 'number') {
        row.orderCount = 0
      }

      if (!row.joinedAt) {
        row.joinedAt = ''
      }

      return row
    },
    createValueFormatter: function createValueFormatter(column) {
      if (column.field === 'joinedAt') {
        return function formatJoinedAt(params) {
          if (!params.value) {
            return ''
          }

          return new Date(params.value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
      }

      if (column.field === 'tags') {
        return function formatTags(params) {
          return String(params.value || '')
        }
      }

      if (column.field === 'actions') {
        return function emptyActions() {
          return ''
        }
      }

      return undefined
    },
  },
}
</script>

<style scoped>
.base-ag-grid-table {
  padding: 0.5rem;
}

.base-ag-grid-table__grid {
  width: 100%;
  height: 540px;
  --ag-font-family: 'Noto Sans', 'Segoe UI', sans-serif;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  overflow: hidden;
}

.base-ag-grid-table /deep/ .ag-root-wrapper,
.base-ag-grid-table /deep/ .ag-root,
.base-ag-grid-table /deep/ .ag-body-viewport,
.base-ag-grid-table /deep/ .ag-center-cols-viewport {
  font-size: 12px;
  font-weight: 300;
}

.base-ag-grid-table /deep/ .ag-root-wrapper {
  border: 0;
}

.base-ag-grid-table /deep/ .ag-header {
  background: #f6f8fb;
}

.base-ag-grid-table /deep/ .ag-header-cell-text {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 300;
}

.base-ag-grid-table /deep/ .ag-header-cell {
  padding-left: 8px;
  padding-right: 8px;
}

.base-ag-grid-table /deep/ .ag-floating-filter-full-body {
  padding-left: 0;
  padding-right: 0;
}

.base-ag-grid-table /deep/ .ag-floating-filter-body {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 30px;
  box-sizing: border-box;
  padding-left: 8px;
  padding-right: 8px;
}

.base-ag-grid-table /deep/ .ag-floating-filter-body-input {
  width: 100%;
}

.base-ag-grid-table /deep/ .ag-floating-filter-input {
  min-height: 24px;
  height: 24px;
  line-height: 22px;
  font-size: 11px;
  font-weight: 300;
}

.base-ag-grid-table /deep/ .ag-cell {
  display: flex;
  align-items: center;
  font-size: 12px;
  line-height: 1.2;
  font-weight: 300;
  padding-left: 8px;
  padding-right: 8px;
}

.base-ag-grid-table /deep/ .ag-cell.ag-right-aligned-cell {
  justify-content: flex-end;
  text-align: right;
}

.base-ag-grid-table /deep/ .ag-cell.ag-actions-cell {
  justify-content: center;
}

.base-ag-grid-table /deep/ .base-ag-grid-table__overlay-message {
  color: var(--color-text-muted);
  font-size: 12px;
}

.base-ag-grid-table /deep/ .tags-floating-filter {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 28px;
}

.base-ag-grid-table /deep/ .tags-floating-filter__input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0 6px;
  background: #fff;
  font-size: 11px;
  font-weight: 300;
}

.base-ag-grid-table /deep/ .tags-floating-filter__mode {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #f6f8fb;
  padding: 1px;
}

.base-ag-grid-table /deep/ .tags-floating-filter__button {
  min-height: 20px;
  min-width: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 10px;
  font-weight: 300;
  line-height: 1;
}

.base-ag-grid-table /deep/ .tags-floating-filter__button--active {
  background: #fff;
  color: #214d9a;
  box-shadow: 0 1px 2px rgba(21, 32, 43, 0.08);
}

.base-ag-grid-table /deep/ .ag-action-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.base-ag-grid-table /deep/ .ag-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--color-primary);
  opacity: 0.9;
}

.base-ag-grid-table__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 2px 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

.base-ag-grid-table__controls {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.base-ag-grid-table__csv-button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 300;
}

.base-ag-grid-table__csv-input {
  display: none;
}

.base-ag-grid-table__page-size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.base-ag-grid-table__page-size select {
  min-height: 28px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  padding: 0 6px;
}

.base-ag-grid-table__pager-button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
}

.base-ag-grid-table__pager-button:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 720px) {
  .base-ag-grid-table {
    padding: 0 8px 8px;
  }

  .base-ag-grid-table__grid {
    height: 460px;
  }

  .base-ag-grid-table__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
