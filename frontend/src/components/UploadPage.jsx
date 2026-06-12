import { useState, useRef, useCallback } from 'react';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
  CheckIcon,
} from './Icons';
import { uploadFile, loadDemo } from '../utils/api';

function StatCard({ label, value, badge, badgeType }) {
  return (
    <div className="stat-card scale-in" id={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {badge && (
        <span className={`stat-card-badge ${badgeType}`}>
          {badgeType === 'ok' && <CheckIcon />}
          {badgeType === 'warn' && <AlertTriangleIcon />}
          {badgeType === 'info' && <ArrowUpIcon />}
          {badge}
        </span>
      )}
    </div>
  );
}

export default function UploadPage({ fileData, onFileLoaded, demoMode }) {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isLoaded = !!fileData;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  }, []);

  const processFile = async (file) => {
    setParsing(true);
    setError('');
    try {
      const result = await uploadFile(file);
      const sizeKB = result.fileSize ? Math.round(result.fileSize / 1024) : 0;
      onFileLoaded({
        name: result.filename,
        rows: result.rows,
        columns: result.columns,
        fileSize: sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB}KB`,
        missing: result.totalMissing,
        missingPercent: `${result.missingPercent}%`,
        columnNames: result.columnNames,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleLoadDemo = async () => {
    setParsing(true);
    setError('');
    try {
      const result = await loadDemo();
      onFileLoaded({
        name: result.filename,
        rows: result.rows,
        columns: result.columns,
        fileSize: '59KB',
        missing: result.totalMissing,
        missingPercent: `${result.missingPercent}%`,
        columnNames: result.columnNames,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleZoneClick = () => {
    if (!isLoaded && !parsing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="page-content fade-in" id="upload-page">
      <div className="breadcrumb" id="breadcrumb">
        <span>Pipeline</span>
        <ChevronRightIcon />
        <span className="current">Upload data</span>
      </div>

      <h2 className="page-title">Upload your dataset</h2>
      <p className="page-subtitle">Supports CSV files — parsed with Python pandas on the backend</p>

      {error && (
        <div className="error-banner">⚠️ {error}</div>
      )}

      {/* Upload Zone */}
      <div
        className={`upload-zone${isLoaded ? ' loaded' : ''}${dragOver ? ' drag-over' : ''}`}
        id="upload-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json,.parquet"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />

        {parsing ? (
          <>
            <div className="upload-zone-icon"><div className="spinner" /></div>
            <div className="upload-zone-title">Uploading & parsing with pandas…</div>
            <div className="upload-zone-meta">Analyzing with Python backend</div>
          </>
        ) : isLoaded ? (
          <>
            <div className="upload-zone-icon success"><CheckCircleIcon size={28} /></div>
            <div className="upload-zone-title">{fileData.name} loaded</div>
            <div className="upload-zone-meta">
              {fileData.rows.toLocaleString()} rows · {fileData.columns} columns
              {demoMode ? ' · demo dataset' : ''}
            </div>
          </>
        ) : (
          <>
            <div className="upload-zone-icon"><ArrowUpIcon /></div>
            <div className="upload-zone-title">Drag & drop your CSV file here</div>
            <div className="upload-zone-meta">or click to browse</div>
          </>
        )}

        <div className="upload-zone-formats">
          {['CSV', 'XLSX', 'JSON', 'Parquet'].map((fmt) => (
            <span className="format-badge" key={fmt}>{fmt}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      {isLoaded && (
        <div className="stats-grid" id="stats-grid">
          <StatCard label="Rows" value={fileData.rows.toLocaleString()} badge="Loaded" badgeType="info" />
          <StatCard label="Columns" value={fileData.columns} badge="Valid" badgeType="ok" />
          <StatCard label="File Size" value={fileData.fileSize} badge="OK" badgeType="ok" />
          <StatCard label="Missing" value={fileData.missing.toLocaleString()} badge={fileData.missingPercent} badgeType="warn" />
        </div>
      )}

      {/* Success Banner */}
      {isLoaded && (
        <div className="success-banner" id="success-banner">
          <span className="success-banner-icon"><CheckCircleIcon size={22} /></span>
          <span className="success-banner-text">
            <strong>{fileData.name}</strong>&nbsp; processed by Python pandas. Click &quot;Next stage&quot; to continue.
          </span>
        </div>
      )}

      {/* Demo button */}
      {!isLoaded && !parsing && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button className="viz-generate-btn" onClick={handleLoadDemo} id="btn-load-demo">
            🧪 Load Demo Dataset (Titanic)
          </button>
        </div>
      )}
    </div>
  );
}
