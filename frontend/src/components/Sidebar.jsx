import {
  UploadIcon,
  SearchIcon,
  BroomIcon,
  ChartIcon,
  CpuIcon,
  MessageIcon,
  LightbulbIcon,
  DownloadIcon,
  SettingsIcon,
  PipeWiseLogo,
} from './Icons';

const pipelineSteps = [
  { id: 'upload', label: 'Upload data', icon: UploadIcon, step: 1 },
  { id: 'understand', label: 'Understand', icon: SearchIcon, step: 2 },
  { id: 'clean', label: 'Clean data', icon: BroomIcon, step: 3 },
  { id: 'visualize', label: 'Visualize', icon: ChartIcon, step: 4 },
  { id: 'train', label: 'Train model', icon: CpuIcon, step: 5 },
  { id: 'chat', label: 'AI chat', icon: MessageIcon, step: 6 },
  { id: 'insights', label: 'Insights', icon: LightbulbIcon, step: 7 },
  { id: 'export', label: 'Export', icon: DownloadIcon, step: 8 },
];

export default function Sidebar({ activeStep, onStepChange, fileInfo, progress }) {
  return (
    <aside className="sidebar" id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <PipeWiseLogo />
        </div>
        <div className="sidebar-brand-text">
          <h1>PipeWise-AI</h1>
          <span>ML Pipeline Studio</span>
        </div>
      </div>

      {/* Pipeline Label */}
      <div className="sidebar-section-label">Pipeline</div>

      {/* Navigation */}
      <nav className="sidebar-nav" id="sidebar-nav">
        {pipelineSteps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`sidebar-nav-item${activeStep === item.id ? ' active' : ''}`}
              onClick={() => onStepChange(item.id)}
              id={`nav-${item.id}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onStepChange(item.id)}
            >
              <span className="nav-icon"><Icon /></span>
              <span>{item.label}</span>
              <span className="nav-step-num">{item.step}</span>
            </div>
          );
        })}
      </nav>

      {/* Status */}
      <div className="sidebar-status" id="sidebar-status">
        <div className="sidebar-status-label">Status</div>
        <div className="sidebar-status-row">
          <span>Pipeline progress</span>
          <span>{progress} / 8</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${(progress / 8) * 100}%` }}
          />
        </div>
        {fileInfo && (
          <div className="sidebar-file-info">
            {fileInfo.name} · {fileInfo.rows.toLocaleString()} rows
          </div>
        )}
      </div>

      {/* User */}
      <div className="sidebar-user" id="sidebar-user">
        <div className="sidebar-user-avatar">SB</div>
        <div className="sidebar-user-info">
          <div className="name">Siddharth</div>
          <div className="role">ML Engineer</div>
        </div>
        <button className="sidebar-user-settings" aria-label="Settings" id="btn-settings">
          <SettingsIcon />
        </button>
      </div>
    </aside>
  );
}
