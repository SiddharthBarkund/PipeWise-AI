import { ChevronRightIcon } from './Icons';
import { exportData } from '../utils/api';
import { useState } from 'react';

export default function ExportPage({ fileData }) {
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');

  const handleExport = async (format) => {
    setExporting(format);
    setError('');
    try {
      await exportData(format);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting('');
    }
  };

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Export</span></div>
        <h2 className="page-title">Export</h2>
        <p className="page-subtitle">Upload a dataset first to enable export.</p>
        <div className="empty-state"><div className="empty-state-icon">📦</div><p>No data loaded yet</p></div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in" id="export-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Export</span></div>
      <h2 className="page-title">Export your data</h2>
      <p className="page-subtitle">Download processed dataset — exported by Python pandas</p>

      {error && <div className="error-banner">⚠️ {error}</div>}

      <div className="export-grid">
        <div className="export-card" onClick={() => handleExport('csv')} id="btn-export-csv">
          <div className="export-card-icon">📄</div>
          <div className="export-card-title">{exporting === 'csv' ? '⏳ Exporting…' : 'CSV'}</div>
          <div className="export-card-desc">pandas <code>df.to_csv()</code> — compatible with Excel and most tools</div>
          <div className="export-card-meta">{fileData.rows.toLocaleString()} rows · {fileData.columns} columns</div>
        </div>
        <div className="export-card" onClick={() => handleExport('json')} id="btn-export-json">
          <div className="export-card-icon">🔗</div>
          <div className="export-card-title">{exporting === 'json' ? '⏳ Exporting…' : 'JSON'}</div>
          <div className="export-card-desc">pandas <code>df.to_json()</code> — for APIs and web applications</div>
          <div className="export-card-meta">{fileData.rows.toLocaleString()} records</div>
        </div>
        <div className="export-card disabled">
          <div className="export-card-icon">📊</div>
          <div className="export-card-title">Excel (.xlsx)</div>
          <div className="export-card-desc">pandas <code>df.to_excel()</code> — requires openpyxl</div>
          <div className="export-card-meta">Add openpyxl to enable</div>
        </div>
        <div className="export-card disabled">
          <div className="export-card-icon">🗃️</div>
          <div className="export-card-title">Parquet</div>
          <div className="export-card-desc">pandas <code>df.to_parquet()</code> — for big data workflows</div>
          <div className="export-card-meta">Add pyarrow to enable</div>
        </div>
      </div>

      <div className="section-block" style={{ marginTop: '1.5rem' }}>
        <h3 className="section-title">Export Summary</h3>
        <div className="export-summary">
          <div className="export-summary-item"><span>Source file</span><strong>{fileData.name}</strong></div>
          <div className="export-summary-item"><span>Rows</span><strong>{fileData.rows.toLocaleString()}</strong></div>
          <div className="export-summary-item"><span>Columns</span><strong>{fileData.columns}</strong></div>
          <div className="export-summary-item"><span>Backend</span><strong>Python pandas</strong></div>
        </div>
      </div>
    </div>
  );
}
