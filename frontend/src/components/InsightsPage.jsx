import { useState, useEffect } from 'react';
import { ChevronRightIcon } from './Icons';
import { getInsights } from '../utils/api';

export default function InsightsPage({ fileData }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (fileData) {
      setLoading(true);
      setError('');
      getInsights()
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [fileData]);

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Insights</span></div>
        <h2 className="page-title">Insights</h2>
        <p className="page-subtitle">Upload a dataset first to see statistics.</p>
        <div className="empty-state"><div className="empty-state-icon">💡</div><p>No data loaded yet</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Insights</span></div>
        <h2 className="page-title">Computing statistics…</h2>
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Insights</span></div>
        <h2 className="page-title">Insights</h2>
        <div className="error-banner">⚠️ {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { describe, numericColumns, skewness, kurtosis } = data;
  const statKeys = ['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'];

  return (
    <div className="page-content fade-in" id="insights-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Insights</span></div>
      <h2 className="page-title">Basic Statistics</h2>
      <p className="page-subtitle">Computed by Python pandas — <code>df.describe()</code>, <code>df.skew()</code>, <code>df.kurtosis()</code></p>

      {/* Descriptive Statistics Table */}
      {numericColumns.length > 0 && (
        <div className="section-block">
          <h3 className="section-title">
            df.describe()
            <span className="section-badge">{numericColumns.length} numeric column{numericColumns.length > 1 ? 's' : ''}</span>
          </h3>
          <div className="table-wrapper">
            <table className="data-table" id="stats-table">
              <thead>
                <tr>
                  <th>Statistic</th>
                  {numericColumns.map((col) => <th key={col}>{col}</th>)}
                </tr>
              </thead>
              <tbody>
                {statKeys.map((key) => (
                  <tr key={key}>
                    <td className="col-name-cell">{key}</td>
                    {numericColumns.map((col) => (
                      <td key={col}>{describe[col] && describe[col][key] != null ? Number(describe[col][key]).toLocaleString() : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skewness & Kurtosis */}
      {numericColumns.length > 0 && (
        <div className="section-block">
          <h3 className="section-title">Distribution Shape <span className="section-badge">Skewness & Kurtosis</span></h3>
          <div className="highlights-grid">
            {numericColumns.slice(0, 8).map((col) => (
              <div className="highlight-card" key={col}>
                <div className="highlight-card-title">{col}</div>
                <div className="highlight-card-stats">
                  <div className="highlight-stat">
                    <span className="highlight-stat-label">Mean</span>
                    <span className="highlight-stat-value">{describe[col]?.mean != null ? Number(describe[col].mean).toLocaleString() : '—'}</span>
                  </div>
                  <div className="highlight-stat">
                    <span className="highlight-stat-label">Std</span>
                    <span className="highlight-stat-value">{describe[col]?.std != null ? Number(describe[col].std).toLocaleString() : '—'}</span>
                  </div>
                  <div className="highlight-stat">
                    <span className="highlight-stat-label">Skewness</span>
                    <span className="highlight-stat-value">{skewness[col] != null ? skewness[col] : '—'}</span>
                  </div>
                  <div className="highlight-stat">
                    <span className="highlight-stat-label">Kurtosis</span>
                    <span className="highlight-stat-value">{kurtosis[col] != null ? kurtosis[col] : '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
