import { useState } from 'react';
import { ChevronRightIcon } from './Icons';
import { trainModel, compareModels } from '../utils/api';

const CLASSIFIERS = ['Random Forest', 'Decision Tree', 'Logistic Regression', 'Gradient Boosting', 'SVM', 'KNN'];
const REGRESSORS = ['Random Forest', 'Decision Tree', 'Linear Regression', 'Gradient Boosting', 'SVR', 'KNN'];

export default function TrainModelPage({ fileData }) {
  const [targetCol, setTargetCol] = useState('');
  const [algorithm, setAlgorithm] = useState('Compare All');
  const [taskType, setTaskType] = useState('classification');
  const [testSize, setTestSize] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const columns = fileData?.columnNames || [];
  const algos = taskType === 'classification' ? CLASSIFIERS : REGRESSORS;

  if (!fileData) {
    return (
      <div className="page-content fade-in">
        <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Train model</span></div>
        <h2 className="page-title">Train a model</h2>
        <p className="page-subtitle">Upload a dataset first to configure training.</p>
        <div className="empty-state"><div className="empty-state-icon"></div><p>No data loaded yet</p></div>
      </div>
    );
  }

  const handleTrain = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      if (algorithm === 'Compare All') {
        const res = await compareModels(targetCol || columns[0], testSize, taskType);
        setResult(res);
      } else {
        const res = await trainModel(targetCol || columns[0], algorithm, testSize, taskType);
        setResult(res);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content fade-in" id="train-page">
      <div className="breadcrumb"><span>Pipeline</span><ChevronRightIcon /><span className="current">Train model</span></div>
      <h2 className="page-title">Train a model</h2>
      <p className="page-subtitle">scikit-learn model training with real metrics</p>

      {/* Config */}
      <div className="viz-controls">
        <div className="viz-control-group">
          <label className="viz-label">Task Type</label>
          <select className="viz-select" value={taskType} onChange={(e) => { setTaskType(e.target.value); setAlgorithm('Compare All'); }} id="select-task-type">
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>
        </div>
        <div className="viz-control-group">
          <label className="viz-label">Target Column</label>
          <select className="viz-select" value={targetCol || columns[0]} onChange={(e) => setTargetCol(e.target.value)} id="select-target">
            {columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="viz-control-group">
          <label className="viz-label">Algorithm</label>
          <select className="viz-select" value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} id="select-algo">
            {algos.map((a) => <option key={a} value={a}>{a}</option>)}
            <option value="Compare All">Compare All</option>
          </select>
        </div>
        <div className="viz-control-group">
          <label className="viz-label">Test Size</label>
          <select className="viz-select" value={testSize} onChange={(e) => setTestSize(parseFloat(e.target.value))} id="select-test-size">
            <option value={0.1}>10%</option>
            <option value={0.2}>20%</option>
            <option value={0.25}>25%</option>
            <option value={0.3}>30%</option>
          </select>
        </div>
        <button className="viz-generate-btn" onClick={handleTrain} disabled={loading} id="btn-train-model">
          {loading ? 'Training…' : 'Train Model'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="section-block">
          <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /><p style={{ marginTop: '1rem' }}>Training with sklearn…</p></div>
        </div>
      )}

      {/* Results */}
      {result && !result.results && (
        <>
          {/* Metrics */}
          <div className="section-block scale-in">
            <h3 className="section-title">Model Results <span className="section-badge">{result.algorithm} — {result.taskType}</span></h3>

            <div className="info-cards-row" style={{ marginBottom: '1rem' }}>
              <div className="info-card">
                <span className="info-card-label">Train Samples</span>
                <span className="info-card-value">{result.trainSamples.toLocaleString()}</span>
              </div>
              <div className="info-card">
                <span className="info-card-label">Test Samples</span>
                <span className="info-card-value">{result.testSamples.toLocaleString()}</span>
              </div>
              {result.taskType === 'classification' ? (
                <>
                  <div className="info-card">
                    <span className="info-card-label">Accuracy</span>
                    <span className="info-card-value" style={{ color: 'var(--color-accent)' }}>{(result.metrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="info-card">
                    <span className="info-card-label">F1 Score</span>
                    <span className="info-card-value">{result.metrics.f1Score.toFixed(4)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-card">
                    <span className="info-card-label">R² Score</span>
                    <span className="info-card-value" style={{ color: 'var(--color-accent)' }}>{result.metrics.r2.toFixed(4)}</span>
                  </div>
                  <div className="info-card">
                    <span className="info-card-label">RMSE</span>
                    <span className="info-card-value">{result.metrics.rmse.toFixed(4)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Full metrics table */}
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                <tbody>
                  {result.taskType === 'classification' ? (
                    <>
                      <tr><td className="col-name-cell">Accuracy</td><td>{(result.metrics.accuracy * 100).toFixed(2)}%</td></tr>
                      <tr><td className="col-name-cell">Precision (weighted)</td><td>{result.metrics.precision.toFixed(4)}</td></tr>
                      <tr><td className="col-name-cell">Recall (weighted)</td><td>{result.metrics.recall.toFixed(4)}</td></tr>
                      <tr><td className="col-name-cell">F1 Score (weighted)</td><td>{result.metrics.f1Score.toFixed(4)}</td></tr>
                    </>
                  ) : (
                    <>
                      <tr><td className="col-name-cell">R² Score</td><td>{result.metrics.r2.toFixed(4)}</td></tr>
                      <tr><td className="col-name-cell">MSE</td><td>{result.metrics.mse.toFixed(4)}</td></tr>
                      <tr><td className="col-name-cell">RMSE</td><td>{result.metrics.rmse.toFixed(4)}</td></tr>
                      <tr><td className="col-name-cell">MAE</td><td>{result.metrics.mae.toFixed(4)}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts */}
          {result.charts.confusionMatrix && (
            <div className="section-block scale-in">
              <h3 className="section-title">Confusion Matrix <span className="section-badge">sklearn</span></h3>
              <div className="chart-image-container">
                <img src={`data:image/png;base64,${result.charts.confusionMatrix}`} alt="Confusion Matrix" className="chart-image" />
              </div>
            </div>
          )}

          {result.charts.actualVsPredicted && (
            <div className="section-block scale-in">
              <h3 className="section-title">Actual vs Predicted <span className="section-badge">sklearn</span></h3>
              <div className="chart-image-container">
                <img src={`data:image/png;base64,${result.charts.actualVsPredicted}`} alt="Actual vs Predicted" className="chart-image" />
              </div>
            </div>
          )}

          {result.charts.featureImportance && (
            <div className="section-block scale-in">
              <h3 className="section-title">Feature Importance <span className="section-badge">sklearn</span></h3>
              <div className="chart-image-container">
                <img src={`data:image/png;base64,${result.charts.featureImportance}`} alt="Feature Importance" className="chart-image" />
              </div>
            </div>
          )}
        </>
      )}

      {result && result.results && (
        <div className="section-block scale-in">
          <h3 className="section-title">Model Comparison <span className="section-badge">AutoML</span></h3>
          <p className="page-subtitle">Ranked by {result.taskType === 'classification' ? 'Accuracy' : 'R² Score'} (Higher is better)</p>
          
          <div className="table-wrapper" style={{ marginTop: '1rem' }}>
            <table className="data-table comparison-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  {result.taskType === 'classification' ? (
                    <><th>Accuracy</th><th>F1 Score</th><th>Precision</th><th>Recall</th></>
                  ) : (
                    <><th>R² Score</th><th>RMSE</th><th>MSE</th><th>MAE</th></>
                  )}
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, i) => (
                  <tr key={r.algorithm} className={i === 0 ? "best-model-row" : ""}>
                    <td className="col-name-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {i === 0 && <span title="Best Model"></span>}
                      {r.algorithm}
                      {i === 0 && <span className="section-badge" style={{ background: 'var(--color-accent)', color: 'white', border: 'none' }}>Best Model</span>}
                    </td>
                    {result.taskType === 'classification' ? (
                      <>
                        <td style={{ fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? 'var(--color-accent)' : 'inherit' }}>
                          {(r.metrics.accuracy * 100).toFixed(2)}%
                        </td>
                        <td>{r.metrics.f1Score.toFixed(4)}</td>
                        <td>{r.metrics.precision.toFixed(4)}</td>
                        <td>{r.metrics.recall.toFixed(4)}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: i === 0 ? 'bold' : 'normal', color: i === 0 ? 'var(--color-accent)' : 'inherit' }}>
                          {r.metrics.r2.toFixed(4)}
                        </td>
                        <td>{r.metrics.rmse.toFixed(4)}</td>
                        <td>{r.metrics.mse.toFixed(4)}</td>
                        <td>{r.metrics.mae.toFixed(4)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
