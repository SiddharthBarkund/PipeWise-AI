import { ArrowRightIcon, SaveIcon } from './Icons';

export default function TopBar({ demoMode, onToggleDemo, title, subtitle, onNext }) {
  return (
    <header className="topbar" id="topbar">
      <div className="topbar-title-section">
        <div className="topbar-title">{title || 'Upload dataset'}</div>
        <div className="topbar-subtitle">{subtitle || 'Start by uploading your CSV or Excel file'}</div>
      </div>

      <div className="topbar-actions">
        <button
          className={`topbar-btn${demoMode ? ' active' : ''}`}
          onClick={onToggleDemo}
          id="btn-demo-mode"
        >
          {demoMode && <span className="dot" />}
          Demo mode
        </button>

        <button className="topbar-btn" id="btn-save">
          <SaveIcon />
          Save
        </button>

        <button className="topbar-btn primary" id="btn-next-stage" onClick={onNext}>
          Next stage
          <ArrowRightIcon />
        </button>
      </div>
    </header>
  );
}
