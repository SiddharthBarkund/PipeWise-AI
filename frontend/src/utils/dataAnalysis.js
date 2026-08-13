/**
 * Client-side data analysis utilities — mirrors pandas describe/info.
 */

/**
 * Infer column types from parsed data rows.
 * Returns an object: { columnName: 'numeric' | 'categorical' | 'datetime' | 'boolean' }
 */
export function inferColumnTypes(rows, columns) {
  const types = {};
  for (const col of columns) {
    const sample = rows.slice(0, 100).map((r) => r[col]).filter((v) => v !== '' && v != null);
    if (sample.length === 0) {
      types[col] = 'categorical';
      continue;
    }
    const allNumbers = sample.every((v) => !isNaN(Number(v)));
    const allBooleans = sample.every((v) => ['true', 'false', '0', '1'].includes(String(v).toLowerCase()));
    if (allBooleans && !allNumbers) {
      types[col] = 'boolean';
    } else if (allNumbers) {
      types[col] = 'numeric';
    } else {
      types[col] = 'categorical';
    }
  }
  return types;
}

/**
 * Count missing (null / empty string) values per column.
 */
export function countMissing(rows, columns) {
  const missing = {};
  for (const col of columns) {
    missing[col] = rows.filter((r) => r[col] === '' || r[col] == null).length;
  }
  return missing;
}

/**
 * Count unique values per column.
 */
export function countUnique(rows, columns) {
  const unique = {};
  for (const col of columns) {
    unique[col] = new Set(rows.map((r) => r[col])).size;
  }
  return unique;
}

/**
 * Compute descriptive statistics for numeric columns (like pandas describe()).
 */
export function describeNumeric(rows, columns, types) {
  const stats = {};
  const numericCols = columns.filter((c) => types[c] === 'numeric');

  for (const col of numericCols) {
    const values = rows
      .map((r) => parseFloat(r[col]))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    const n = values.length;
    if (n === 0) {
      stats[col] = { count: 0, mean: 0, std: 0, min: 0, '25%': 0, '50%': 0, '75%': 0, max: 0 };
      continue;
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1 || 1);
    const std = Math.sqrt(variance);

    const percentile = (p) => {
      const idx = (p / 100) * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return lo === hi ? values[lo] : values[lo] + (values[hi] - values[lo]) * (idx - lo);
    };

    stats[col] = {
      count: n,
      mean: +mean.toFixed(4),
      std: +std.toFixed(4),
      min: values[0],
      '25%': +percentile(25).toFixed(4),
      '50%': +percentile(50).toFixed(4),
      '75%': +percentile(75).toFixed(4),
      max: values[n - 1],
    };
  }
  return stats;
}

/**
 * Get total missing count across all columns.
 */
export function totalMissing(missingMap) {
  return Object.values(missingMap).reduce((a, b) => a + b, 0);
}
