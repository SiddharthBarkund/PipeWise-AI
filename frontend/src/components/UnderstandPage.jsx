import { useState, useEffect } from 'react';
import { ChevronRightIcon } from './Icons';
import { getUnderstandData } from '../utils/api';

export default function UnderstandPage({ fileData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fileData) {
      setLoading(true);
      setError('');
      getUnderstandData()
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [fileData]);

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Understand</span></div>
        <h2 className="page-title">Understand your data</h2>
        <p className="page-subtitle">Upload a dataset first to explore its structure.</p>
        <div className="empty-state"><div className="empty-state-icon">📊</div><p>No data loaded yet</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Understand</span></div>
        <h2 className="page-title">Analyzing dataset…</h2>
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Understand</span></div>
        <h2 className="page-title">Understand your data</h2>
        <div className="error-banner">⚠️ {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { preview, columnNames, dtypes, missing, unique, numericColumns, categoricalColumns, shape } = data;

  return (
    <div className="page-content fade-in" id="understand-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Understand</span></div>
      <h2 className="page-title">Understand your data</h2>
      <p className="page-subtitle">Results from Python pandas — <code>df.info()</code>, <code>df.head()</code>, <code>df.isnull().sum()</code>, <code>df.nunique()</code></p>

      {/* Shape Info */}
      <div className="info-cards-row">
        <div className="info-card">
          <span className="info-card-label">Rows</span>
          <span className="info-card-value">{shape.rows.toLocaleString()}</span>
        </div>
        <div className="info-card">
          <span className="info-card-label">Columns</span>
          <span className="info-card-value">{shape.columns}</span>
        </div>
        <div className="info-card">
          <span className="info-card-label">Numeric</span>
          <span className="info-card-value">{numericColumns.length}</span>
        </div>
        <div className="info-card">
          <span className="info-card-label">Categorical</span>
          <span className="info-card-value">{categoricalColumns.length}</span>
        </div>
      </div>

      {/* Dataset Preview — df.head(10) */}
      <div className="section-block">
        <h3 className="section-title">Dataset Preview <span className="section-badge">df.head(10)</span></h3>
        <div className="table-wrapper">
          <table className="data-table" id="preview-table">
            <thead>
              <tr>
                <th>#</th>
                {columnNames.map((col) => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  <td className="row-num">{i + 1}</td>
                  {columnNames.map((col) => (
                    <td key={col} className={row[col] === '' || row[col] == null ? 'cell-missing' : ''}>
                      {row[col] == null || row[col] === '' ? '—' : String(row[col]).length > 30 ? String(row[col]).slice(0, 30) + '…' : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Details */}
      <div className="section-block">
        <h3 className="section-title">Column Details <span className="section-badge">df.dtypes + df.isnull().sum() + df.nunique()</span></h3>
        <div className="table-wrapper">
          <table className="data-table" id="column-info-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Column Name</th>
                <th>pandas dtype</th>
                <th>Missing</th>
                <th>Unique</th>
                <th>Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {columnNames.map((col, i) => {
                const miss = missing[col] || 0;
                const fillPct = shape.rows > 0 ? (((shape.rows - miss) / shape.rows) * 100).toFixed(1) : '0';
                const dtype = dtypes[col] || '';
                const typeClass = dtype.includes('int') || dtype.includes('float') ? 'numeric' : dtype.includes('bool') ? 'boolean' : 'categorical';
                return (
                  <tr key={col}>
                    <td className="row-num">{i + 1}</td>
                    <td className="col-name-cell">{col}</td>
                    <td><span className={`type-badge type-${typeClass}`}>{dtype}</span></td>
                    <td className={miss > 0 ? 'cell-warn' : ''}>{miss.toLocaleString()}</td>
                    <td>{(unique[col] || 0).toLocaleString()}</td>
                    <td>
                      <div className="fill-rate-bar">
                        <div className="fill-rate-track">
                          <div className="fill-rate-fill" style={{ width: `${fillPct}%`, background: fillPct >= 90 ? 'var(--color-accent)' : fillPct >= 50 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="fill-rate-label">{fillPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
