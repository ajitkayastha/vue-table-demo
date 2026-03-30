var DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

export var TABLE_PAGE_SIZES = DEFAULT_PAGE_SIZES;

export function createTableQuery(overrides) {
  return Object.assign(
    {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZES[0],
      sortField: 'name',
      sortDirection: 'asc',
      globalSearch: '',
      columnFilters: {},
      loading: false,
      error: '',
      totalRows: 0
    },
    overrides || {}
  );
}

export function normalizeQueryForRequest(query) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    sortField: query.sortField,
    sortDirection: query.sortDirection,
    globalSearch: (query.globalSearch || '').trim(),
    columnFilters: Object.assign({}, query.columnFilters)
  };
}

export function resetPage(query) {
  return Object.assign({}, query, { page: 1 });
}

export function updateColumnFilter(query, field, value) {
  var nextFilters = Object.assign({}, query.columnFilters);

  if (value === null || value === undefined || value === '') {
    delete nextFilters[field];
  } else {
    nextFilters[field] = value;
  }

  return Object.assign({}, query, {
    page: 1,
    columnFilters: nextFilters
  });
}

export function replaceColumnFilters(query, filters) {
  var nextFilters = {};

  Object.keys(filters || {}).forEach(function mapFilter(field) {
    var value = filters[field];

    if (value !== null && value !== undefined && value !== '') {
      nextFilters[field] = value;
    }
  });

  return Object.assign({}, query, {
    page: 1,
    columnFilters: nextFilters
  });
}
