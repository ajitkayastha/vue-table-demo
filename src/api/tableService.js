var API_URL = 'https://jsonplaceholder.typicode.com/users';

function createJoinedDate(index) {
  var month = (index % 12) + 1;
  var day = ((index * 3) % 28) + 1;
  var year = 2022 + (index % 3);

  return new Date(year, month - 1, day);
}

function mapUserToRow(user, index) {
  var derivedId = user.id;
  var tagCatalog = [
    'Admin',
    'Billing',
    'Compliance',
    'Editor',
    'Finance',
    'Manager',
    'Operations',
    'Reviewer',
    'Support',
    'Viewer'
  ];
  var tags = [];
  var tagCount = 3 + (index % 3);
  var joinedAt = createJoinedDate(index);

  for (var tagIndex = 0; tagIndex < tagCount; tagIndex += 1) {
    tags.push(tagCatalog[(index + tagIndex * 2) % tagCatalog.length]);
  }

  return {
    id: derivedId,
    name: user.name,
    username: user.username,
    email: user.email,
    company: user.company ? user.company.name : 'Unknown',
    city: user.address ? user.address.city : 'Unknown',
    orderCount: 12 + index * 7,
    joinedAt: joinedAt.toISOString(),
    tags: tags,
    website: user.website
  };
}

function includesText(value, searchTerm) {
  return String(value || '')
    .toLowerCase()
    .indexOf(searchTerm) !== -1;
}

function filterText(rows, field, value) {
  var searchTerm = String(value || '').trim().toLowerCase();

  if (!searchTerm) {
    return rows;
  }

  return rows.filter(function matchText(row) {
    return includesText(row[field], searchTerm);
  });
}

function filterNumber(rows, field, value) {
  if (value === '' || value === null || value === undefined) {
    return rows;
  }

  var numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return rows;
  }

  return rows.filter(function matchNumber(row) {
    return Number(row[field]) >= numericValue;
  });
}

function filterDateRange(rows, field, range) {
  var fromValue = range && range.from ? new Date(range.from) : null;
  var toValue = range && range.to ? new Date(range.to) : null;

  if (!fromValue && !toValue) {
    return rows;
  }

  if (fromValue && Number.isNaN(fromValue.getTime())) {
    fromValue = null;
  }

  if (toValue && Number.isNaN(toValue.getTime())) {
    toValue = null;
  }

  return rows.filter(function matchDate(row) {
    var rowDate = new Date(row[field]);
    var rowTime = rowDate.getTime();

    if (Number.isNaN(rowTime)) {
      return false;
    }

    if (fromValue && rowTime < fromValue.getTime()) {
      return false;
    }

    if (toValue) {
      var inclusiveTo = new Date(toValue);

      inclusiveTo.setHours(23, 59, 59, 999);

      if (rowTime > inclusiveTo.getTime()) {
        return false;
      }
    }

    return true;
  });
}

function filterMultiValue(rows, field, value, mode) {
  var searchTerms = Array.isArray(value)
    ? value
        .map(function mapEntry(entry) {
          return String(entry || '').trim().toLowerCase();
        })
        .filter(Boolean)
    : String(value || '')
        .split(',')
        .map(function mapEntry(entry) {
          return entry.trim().toLowerCase();
        })
        .filter(Boolean);

  if (!searchTerms.length) {
    return rows;
  }

  return rows.filter(function matchMultiValue(row) {
    var matcher = mode === 'or' ? 'some' : 'every';

    return searchTerms[matcher](function matchSearch(searchTerm) {
      return (row[field] || []).some(function matchEntry(entry) {
        return includesText(entry, searchTerm);
      });
    });
  });
}

function applyGlobalSearch(rows, searchTerm) {
  var normalized = String(searchTerm || '').trim().toLowerCase();

  if (!normalized) {
    return rows;
  }

  return rows.filter(function matchGlobal(row) {
    return [
      row.name,
      row.username,
      row.email,
      row.company,
      row.city,
      row.website,
      (row.tags || []).join(' ')
    ].some(function matchesValue(value) {
      return includesText(value, normalized);
    });
  });
}

function applyColumnFilters(rows, filters) {
  var normalizedFilters = Object.assign(
    {
      orderCountMin: filters.orderCountMin || filters.orderCount,
      joinedFrom: filters.joinedFrom || filters.joinedAtFrom,
      joinedTo: filters.joinedTo || filters.joinedAtTo
    },
    filters
  );
  var nextRows = rows.slice();

  nextRows = filterText(nextRows, 'name', normalizedFilters.name);
  nextRows = filterText(nextRows, 'company', normalizedFilters.company);
  nextRows = filterNumber(nextRows, 'orderCount', normalizedFilters.orderCountMin);
  nextRows = filterDateRange(nextRows, 'joinedAt', {
    from: normalizedFilters.joinedFrom,
    to: normalizedFilters.joinedTo
  });
  nextRows = filterMultiValue(
    nextRows,
    'tags',
    normalizedFilters.tags,
    normalizedFilters.tagsMode
  );

  return nextRows;
}

function compareValues(left, right, direction) {
  var leftValue = left;
  var rightValue = right;

  if (typeof leftValue === 'string') {
    leftValue = leftValue.toLowerCase();
  }

  if (typeof rightValue === 'string') {
    rightValue = rightValue.toLowerCase();
  }

  if (leftValue < rightValue) {
    return direction === 'desc' ? 1 : -1;
  }

  if (leftValue > rightValue) {
    return direction === 'desc' ? -1 : 1;
  }

  return 0;
}

function sortRows(rows, sortField, sortDirection) {
  if (!sortField) {
    return rows;
  }

  return rows.slice().sort(function sortByField(a, b) {
    return compareValues(a[sortField], b[sortField], sortDirection || 'asc');
  });
}

function paginateRows(rows, page, pageSize) {
  var startIndex = (page - 1) * pageSize;
  var endIndex = startIndex + pageSize;

  return rows.slice(startIndex, endIndex);
}

function buildMeta(query, totalRows) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    sortField: query.sortField,
    sortDirection: query.sortDirection,
    totalRows: totalRows
  };
}

export async function fetchUsersTable(query) {
  var response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error('Unable to load users.');
  }

  var users = await response.json();
  var mappedRows = users.map(mapUserToRow);
  var filteredRows = applyColumnFilters(
    applyGlobalSearch(mappedRows, query.globalSearch),
    query.columnFilters || {}
  );
  var sortedRows = sortRows(filteredRows, query.sortField, query.sortDirection);
  var paginatedRows = paginateRows(sortedRows, query.page, query.pageSize);

  return {
    rows: paginatedRows,
    meta: buildMeta(query, filteredRows.length)
  };
}
