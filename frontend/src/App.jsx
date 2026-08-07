import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import UploadPage from './components/UploadPage';
import UnderstandPage from './components/UnderstandPage';
import CleanDataPage from './components/CleanDataPage';
import VisualizePage from './components/VisualizePage';
import TrainModelPage from './components/TrainModelPage';
import AIChatPage from './components/AIChatPage';
import InsightsPage from './components/InsightsPage';
import ExportPage from './components/ExportPage';
import LoginPage from './components/Auth/LoginPage';
import SignupPage from './components/Auth/SignupPage';
import { checkHealth } from './utils/api';
import { auth } from './utils/auth';

const STEP_LABELS = {
  upload: 'Upload dataset',
  understand: 'Understand data',
  clean: 'Clean data',
  visualize: 'Visualize',
  train: 'Train model',
  chat: 'AI chat',
  insights: 'Insights',
  export: 'Export',
};

const STEP_SUBTITLES = {
  upload: 'Start by uploading your CSV file',
  understand: 'Python pandas → df.info(), df.head(), df.isnull()',
  clean: 'Python pandas → handle missing values & duplicates',
  visualize: 'Python matplotlib + seaborn charts',
  train: 'Python scikit-learn model training',
  chat: 'Ask questions — analyzed by Python pandas',
  insights: 'Python pandas → df.describe(), skew, kurtosis',
  export: 'Python pandas → df.to_csv(), df.to_json()',
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  
  const [activeStep, setActiveStep] = useState('upload');
  const [demoMode, setDemoMode] = useState(true);
  const [fileData, setFileData] = useState(null);
  const [backendOnline, setBackendOnline] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then(setBackendOnline);
    
    // Listen for Firebase auth state changes if auth is initialized
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleStepChange = useCallback((step) => setActiveStep(step), []);
  const handleToggleDemo = useCallback(() => setDemoMode((prev) => !prev), []);
  const handleFileLoaded = useCallback((meta) => setFileData(meta), []);

  const handleNextStage = useCallback(() => {
    const steps = ['upload', 'understand', 'clean', 'visualize', 'train', 'chat', 'insights', 'export'];
    const idx = steps.indexOf(activeStep);
    if (idx < steps.length - 1) setActiveStep(steps[idx + 1]);
  }, [activeStep]);

  const progress = fileData
    ? Math.max(1, ['upload', 'understand', 'clean', 'visualize', 'train', 'chat', 'insights', 'export'].indexOf(activeStep) + 1)
    : 0;

  const renderPage = () => {
    switch (activeStep) {
      case 'upload': return <UploadPage fileData={fileData} onFileLoaded={handleFileLoaded} demoMode={demoMode} />;
      case 'understand': return <UnderstandPage fileData={fileData} />;
      case 'clean': return <CleanDataPage fileData={fileData} />;
      case 'visualize': return <VisualizePage fileData={fileData} />;
      case 'train': return <TrainModelPage fileData={fileData} />;
      case 'chat': return <AIChatPage fileData={fileData} />;
      case 'insights': return <InsightsPage fileData={fileData} />;
      case 'export': return <ExportPage fileData={fileData} />;
      default: return <UploadPage fileData={fileData} onFileLoaded={handleFileLoaded} demoMode={demoMode} />;
    }
  };

  if (!user) {
    if (authView === 'login') {
      return <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />;
    }
    return <SignupPage onLogin={handleLogin} onSwitchToLogin={() => setAuthView('login')} />;
  }

  return (
    <div className="app-layout" id="app-layout">
      <Sidebar activeStep={activeStep} onStepChange={handleStepChange} fileInfo={fileData} progress={progress} user={user} />
      <main className="main-content" id="main-content">
        <TopBar demoMode={demoMode} onToggleDemo={handleToggleDemo} title={STEP_LABELS[activeStep]} subtitle={STEP_SUBTITLES[activeStep]} onNext={handleNextStage} user={user} />

        {backendOnline === false && (
          <div className="backend-warning">
            Python backend not detected. Run: <code>cd backend && pip install -r requirements.txt && python app.py</code>
          </div>
        )}

        {renderPage()}
      </main>
    </div>
  );
}
