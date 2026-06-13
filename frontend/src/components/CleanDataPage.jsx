import { useState, useEffect } from 'react';
import { ChevronRightIcon } from './Icons';
import { getCleanInfo, applyClean } from '../utils/api';

export default function CleanDataPage({ fileData, onDataChanged }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [columnToRemove, setColumnToRemove] = useState('');

  const fetchInfo = () => {
    if (!fileData) return;
    setLoading(true);
    setError('');
    getCleanInfo()
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInfo(); }, [fileData]);

  const handleClean = async (action, column, strategy) => {
    setActionLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await applyClean(action, column, strategy);
      setMessage(`✅ ${result.message}. Shape: ${result.newShape.rows} × ${result.newShape.columns}. Missing: ${result.totalMissing}`);
      if (onDataChanged) onDataChanged(result);
      fetchInfo(); // refresh
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Clean data</span></div>
        <h2 className="page-title">Clean your data</h2>
        <p className="page-subtitle">Upload a dataset first to inspect quality issues.</p>
        <div className="empty-state"><div className="empty-state-icon">🧹</div><p>No data loaded yet</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Clean data</span></div>
        <h2 className="page-title">Analyzing data quality…</h2>
        <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in" id="clean-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Clean data</span></div>
      <h2 className="page-title">Clean your data</h2>
      <p className="page-subtitle">Review and fix missing values, duplicates — powered by pandas</p>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {message && <div className="success-banner" style={{ marginBottom: '1rem' }}><span className="success-banner-text">{message}</span></div>}

      {info && (
        <>
          {/* Quality Overview */}
          <div className="info-cards-row">
            <div className="info-card">
              <span className="info-card-label">Data Quality</span>
              <span className="info-card-value" style={{ color: info.qualityPercent >= 90 ? 'var(--color-accent)' : '#f59e0b' }}>
                {info.qualityPercent}%
              </span>
            </div>
            <div className="info-card">
              <span className="info-card-label">Total Missing</span>
              <span className="info-card-value">{info.totalMissing.toLocaleString()}</span>
            </div>
            <div className="info-card">
              <span className="info-card-label">Affected Columns</span>
              <span className="info-card-value">{info.affectedColumns}</span>
            </div>
            <div className="info-card">
              <span className="info-card-label">Duplicate Rows</span>
              <span className="info-card-value">{info.duplicateRows.toLocaleString()}</span>
            </div>
          </div>

          {/* Missing Values Chart */}
          {info.columnsWithMissing.length > 0 && (
            <div className="section-block">
              <h3 className="section-title">Missing Values by Column</h3>
              <div className="missing-chart">
                {info.columnsWithMissing.map((col) => (
                  <div className="missing-chart-row" key={col.name}>
                    <span className="missing-chart-label">{col.name}</span>
                    <div className="missing-chart-bar-track">
                      <div className="missing-chart-bar-fill" style={{
                        width: `${col.percent}%`,
                        background: col.percent >= 50 ? '#ef4444' : col.percent >= 20 ? '#f59e0b' : 'var(--color-accent)',
                      }} />
                    </div>
                    <span className="missing-chart-value">{col.missing} ({col.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cleaning Actions */}
          <div className="section-block">
            <h3 className="section-title">Quick Clean Actions</h3>
            <div className="clean-actions-grid">
              <button className="clean-action-btn" onClick={() => handleClean('fill_missing', null, 'mean')} disabled={actionLoading}>
                🔧 Fill Missing (Mean/Mode)
              </button>
              <button className="clean-action-btn" onClick={() => handleClean('drop_missing_rows')} disabled={actionLoading}>
                🗑️ Drop Rows with Missing
              </button>
              <button className="clean-action-btn" onClick={() => handleClean('drop_duplicates')} disabled={actionLoading}>
                📋 Drop Duplicate Rows
              </button>
              {info.columnsWithMissing.map((col) => (
                <button key={col.name} className="clean-action-btn small" onClick={() => handleClean('fill_missing', col.name, 'median')} disabled={actionLoading}>
                  Fill "{col.name}" (median)
                </button>
              ))}
            </div>
          </div>

          {/* Remove Column Action */}
          <div className="section-block">
            <h3 className="section-title">Remove Column</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={columnToRemove} 
                onChange={(e) => setColumnToRemove(e.target.value)}
                className="form-input"
                style={{ maxWidth: '300px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="">Select column to remove...</option>
                {fileData.columnNames && fileData.columnNames.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <button 
                className="clean-action-btn" 
                onClick={() => {
                  handleClean('drop_column', columnToRemove);
                  setColumnToRemove('');
                }} 
                disabled={actionLoading || !columnToRemove}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none' }}
              >
                🗑️ Remove
              </button>
            </div>
          </div>
        </>

      )}
    </div>
  );
}
