import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (response) => {
    try {
      const data = await authApi.googleLogin(response.credential);
      if (data && data.token && data.user) {
        login(data.token, data.user);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google sign-in failed');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setError('');
      setSuccessMsg('');
      setDevOtp('');
      return;
    }

    const initGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-placeholderclientid.apps.googleusercontent.com",
          callback: handleGoogleLogin
        });

        const btnDiv = document.getElementById("google-signin-btn");
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: "filled_blue",
            size: "large",
            text: "signin_with"
          });
        }
      } else {
        setTimeout(initGoogleSignIn, 300);
      }
    };

    initGoogleSignIn();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevOtp('');
    setLoading(true);

    try {
      const data = await authApi.forgotPassword(email.trim());
      setSuccessMsg(data.message || 'Verification code sent to your email!');
      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setMode('reset');
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.resetPassword(email.trim(), resetCode.trim(), newPassword);
      setSuccessMsg(data.message || 'Password reset successfully! Please log in with your new password.');
      setPassword(newPassword);
      setMode('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const body = {
          username: name.trim() || email.split('@')[0],
          email: email.includes('@') ? email : `${email}@quiznova.org`,
          password,
          role: 'user'
        };
        const data = await authApi.register(body);
        login(data.token, data.user);
        onClose();
      } else {
        const data = await authApi.login(email.trim(), password);
        login(data.token, data.user);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-card" onClick={e => e.stopPropagation()}>
        <span className="login-close" onClick={onClose}>✕</span>
        <div className="login-brand-icon">
          {mode === 'forgot' ? '🔑' : mode === 'reset' ? '🔒' : '🏵️'}
        </div>
        
        <h2>
          {mode === 'register' && 'Create Account'}
          {mode === 'login' && 'Welcome Back'}
          {mode === 'forgot' && 'Forgot Password'}
          {mode === 'reset' && 'Enter Reset Code'}
        </h2>
        <p>
          {mode === 'register' && 'Join KMS Academy to save scores and climb the leaderboard.'}
          {mode === 'login' && 'Log in to continue your learning journey and track your stats.'}
          {mode === 'forgot' && "Enter your registered email or username to receive a 6-digit verification code."}
          {mode === 'reset' && `We sent a code to ${email || 'your email'}. Enter it below to set a new password.`}
        </p>

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#34d399', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'left' }}>
            ✓ {successMsg}
          </div>
        )}

        {devOtp && (
          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px dashed var(--accent-1)', borderRadius: '8px', padding: '0.65rem 1rem', color: 'var(--accent-1)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' }}>
            💡 <strong>Dev Verification Code:</strong> <span style={{ fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px', marginLeft: '0.5rem' }}>{devOtp}</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' && (
          <form className="login-form" onSubmit={handleForgotSubmit}>
            <div className="login-input-wrapper">
              <label>Email or Username</label>
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com or username"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Sending Code...' : 'Send Reset Code ✉️'}
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>
                ← Back to Log In
              </span>
            </div>
          </form>
        )}

        {/* ── RESET PASSWORD FORM ── */}
        {mode === 'reset' && (
          <form className="login-form" onSubmit={handleResetSubmit}>
            <div className="login-input-wrapper">
              <label>6-Digit Verification Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={e => { setResetCode(e.target.value); setError(''); }}
                placeholder="e.g. 123456"
                maxLength={6}
                required
                style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                autoFocus
              />
            </div>
            <div className="login-input-wrapper">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(''); }}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div className="login-input-wrapper">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm password"
                required
              />
            </div>
            <button type="submit" className="login-submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Resetting...' : 'Save New Password & Log In 🔐'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--accent-1)', cursor: 'pointer' }} onClick={() => { handleForgotSubmit({ preventDefault: () => {} }); }}>
                Resend Code
              </span>
              <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setMode('login'); setError(''); }}>
                Cancel
              </span>
            </div>
          </form>
        )}

        {/* ── LOGIN / REGISTER FORM ── */}
        {(mode === 'login' || mode === 'register') && (
          <>
            <form className="login-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="login-input-wrapper">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                </div>
              )}
              <div className="login-input-wrapper">
                <label>Email or Username</label>
                <input
                  type="text"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder={mode === 'register' ? 'john@example.com' : 'your@email.com or username'}
                  required
                />
              </div>
              <div className="login-input-wrapper">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                />
              </div>

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
                  <span
                    onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
                    style={{ color: 'var(--accent-1)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '500' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Forgot Password?
                  </span>
                </div>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? (mode === 'register' ? 'Creating account...' : 'Logging in...') : (mode === 'register' ? 'Register' : 'Log In')}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ padding: '0 0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            <div id="google-signin-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '44px', marginBottom: '0.5rem' }}></div>

            <p style={{ marginTop: '1.25rem', cursor: 'pointer', color: 'var(--accent-1)', fontSize: '0.9rem', textAlign: 'center' }} onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
              {mode === 'register' ? 'Already have an account? Log in' : "Don't have an account? Register"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
