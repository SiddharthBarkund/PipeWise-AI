import { useState } from 'react';
import { ChevronRightIcon } from './Icons';
import { generateChart } from '../utils/api';

const GRAPH_TYPES = ['Scatter Plot', 'Bar Chart', 'Histogram', 'Box Plot', 'Heatmap', 'Count Plot', 'Pair Plot'];

export default function VisualizePage({ fileData }) {
  const [graphType, setGraphType] = useState('Histogram');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [chartImage, setChartImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const columns = fileData?.columnNames || [];

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Visualize</span></div>
        <h2 className="page-title">Visualize your data</h2>
        <p className="page-subtitle">Upload a dataset first to create charts.</p>
        <div className="empty-state"><div className="empty-state-icon"></div><p>No data loaded yet</p></div>
      </div>
    );
  }

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setChartImage(null);
    try {
      const result = await generateChart(graphType, xCol || columns[0], yCol || columns[1]);
      setChartImage(result.image);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content fade-in" id="visualize-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Visualize</span></div>
      <h2 className="page-title">Graph Visualization</h2>
      <p className="page-subtitle">Charts rendered by Python matplotlib + seaborn</p>

      {/* Controls */}
      <div className="viz-controls">
        <div className="viz-control-group">
          <label className="viz-label">Graph Type</label>
          <select className="viz-select" value={graphType} onChange={(e) => { setGraphType(e.target.value); setChartImage(null); }} id="select-graph-type">
            {GRAPH_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        {graphType !== 'Heatmap' && graphType !== 'Pair Plot' && (
          <div className="viz-control-group">
            <label className="viz-label">X-axis Column</label>
            <select className="viz-select" value={xCol || columns[0] || ''} onChange={(e) => setXCol(e.target.value)} id="select-x-col">
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {!['Histogram', 'Heatmap', 'Pair Plot', 'Count Plot'].includes(graphType) && (
          <div className="viz-control-group">
            <label className="viz-label">Y-axis Column</label>
            <select className="viz-select" value={yCol || columns[1] || ''} onChange={(e) => setYCol(e.target.value)} id="select-y-col">
              {columns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        <button className="viz-generate-btn" onClick={handleGenerate} disabled={loading} id="btn-generate-graph">
          {loading ? 'Generating…' : 'Generate Graph'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Chart Image from matplotlib */}
      {chartImage && (
        <div className="section-block scale-in">
          <h3 className="section-title">
            {graphType}
            <span className="section-badge">matplotlib + seaborn</span>
          </h3>
          <div className="chart-image-container">
            <img src={`data:image/png;base64,${chartImage}`} alt={graphType} className="chart-image" />
          </div>
        </div>
      )}

      {loading && (
        <div className="section-block">
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: '1rem' }}>Rendering chart with Python…</p></div>
        </div>
      )}
    </div>
  );
}
