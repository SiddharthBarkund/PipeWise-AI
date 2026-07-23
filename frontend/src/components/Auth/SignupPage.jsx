import React, { useState } from 'react';
import { signInWithGoogle, signInWithGithub } from '../../utils/auth';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import './Auth.css';

export default function SignupPage({ onLogin, onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGithub();
      if (result?.user) {
        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = (e) => {
    e.preventDefault();
    setError('Email/Password signup is not configured yet. Please use Google or GitHub.');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-card scale-in fade-in">
          <div className="auth-header">
            <h1 className="auth-title">PipeWise<span className="text-green">-AI</span></h1>
            <h2 className="auth-subtitle-main">Create an Account</h2>
            <p className="auth-subtitle-sub">Join PipeWise-AI to build ML pipelines</p>
          </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-providers">
          <button 
            onClick={handleGoogleSignup} 
            disabled={loading}
            className="auth-btn provider-btn google-btn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          
          <button 
            onClick={handleGithubSignup} 
            disabled={loading}
            className="auth-btn provider-btn github-btn"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            Sign up with GitHub
          </button>
        </div>

          <div className="auth-divider">
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleEmailSignup} className="auth-form">
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon-left" />
                <input type="text" placeholder="Full Name" required />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon-left" />
                <input type="email" placeholder="Email Address" required />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Create Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon-left" />
                <input type="password" placeholder="Create Password" required />
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="auth-btn primary-btn" style={{marginTop: '0.75rem'}}>
              {loading ? <Loader2 className="spinner" size={20} /> : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <button onClick={onSwitchToLogin} className="link-btn">Log in</button>
          </div>
          
          <div className="auth-version">
            v1.2.3 | © PipeWise Inc.
          </div>
        </div>
      </div>
    </div>
  );
}
