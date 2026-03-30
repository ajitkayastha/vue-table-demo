# Vue 2 vue-good-table Foundation

This project sets up a reusable Vue 2 table baseline using `vue-good-table` with a controlled, server-style data flow.

## Run

```bash
npm install
npm run serve
```

## Build

```bash
npm run build
```

## Architecture

- `src/views/UsersTablePage.vue` owns query state, server-style fetch triggers, and page-specific column definitions.
- `src/components/BaseDataTable.vue` wraps `vue-good-table` and normalizes remote-mode pagination and sorting events.
- `src/components/TableToolbar.vue` provides reusable global search and scalable text/number/date filter inputs.
- `src/components/TableStateWrapper.vue` centralizes loading, empty, no-results, and error UI states.
- `src/api/tableService.js` acts as a backend adapter layer. It fetches placeholder data, maps it into stable table rows, and simulates server-side filtering, sorting, and pagination.
- `src/utils/tableQuery.js` standardizes the query model so every future table screen can share the same request contract.
- `src/utils/debounce.js` keeps search responsive without hammering the service layer.

## Query State Model

The page owns a single query object with:

- `page`
- `pageSize`
- `sortField`
- `sortDirection`
- `globalSearch`
- `columnFilters`
- `loading`
- `error`
- `totalRows`

The query object is the only source of truth for table state. Event handlers update it explicitly through methods such as `handlePageChange`, `handleSortChange`, and `handleColumnFilterChange`, then call `fetchTableData()`.

## Why This Pattern

This pattern is better than mixing client-side and server-side behavior inside the table component because:

- the parent owns query state and request timing
- the API layer can be replaced later without rewriting the table UI
- sorting, pagination, and filters follow one predictable contract
- debounced search and page resets are handled consistently
- row mapping is done once in the service instead of repeatedly in templates

Mixed client/server setups tend to drift into inconsistent behavior where the table sorts one subset of data locally while pagination or filters are driven elsewhere. This foundation avoids that split-brain state.

## vue-good-table Limitations

`vue-good-table` works well for conventional admin tables, but it is not the right abstraction for virtualization-heavy grids with thousands of rendered rows at once. For those use cases, keep server-driven pagination or move to a purpose-built virtualized grid.

## File Summary

- `src/main.js`: Vue 2 bootstrap and `vue-good-table` plugin registration with required CSS.
- `src/App.vue`: top-level application shell.
- `src/api/tableService.js`: placeholder backend adapter and row transformation logic.
- `src/components/BaseDataTable.vue`: reusable remote-mode table wrapper.
- `src/components/TableToolbar.vue`: reusable search and filter UI.
- `src/components/TableStateWrapper.vue`: reusable loading/error/empty/no-results container.
- `src/views/UsersTablePage.vue`: example production-style page using the shared table foundation.
- `src/utils/debounce.js`: lightweight debounce helper.
- `src/utils/tableQuery.js`: centralized query model helpers.
