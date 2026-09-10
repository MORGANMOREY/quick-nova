import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KMSLogo from './KMSLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { playSound } from '../../services/soundEffects';

export default function Navbar({
  onOpenSidebar,
  searchQuery,
  setSearchQuery,
  latestQuiz,
  showBanner,
  setShowBanner
}) {
  const navigate = useNavigate();
  const { currentUser, userRole, logout, setIsLoginModalOpen } = useAuth();
  const { addToast } = useToast();

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('quiznova_muted') === 'true');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem('quiznova_muted', nextMute ? 'true' : 'false');
    if (!nextMute) {
      playSound('click');
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Voice search is not supported in this browser.', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      addToast(`🎤 Searching: "${transcript}"`, 'success');
      navigate('/?q=' + encodeURIComponent(transcript));
    };
    recognition.onerror = (event) => {
      addToast('Voice recognition error: ' + event.error, 'error');
    };
    recognition.start();
    addToast('🎤 Listening...', 'success');
  };

  return (
    <>
      {showBanner && latestQuiz && (
        <div style={{ background: 'var(--accent-gradient)', color: 'white', padding: '0.75rem 3.5rem 0.75rem 1rem', textAlign: 'center', position: 'relative', fontSize: '0.9rem', fontWeight: 'bold', zIndex: 50, boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span>🎉 LATEST QUIZ ADDED: "{latestQuiz.title || latestQuiz.name}" - Test your knowledge and earn XP!</span>
          <button
            style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '0.35rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
            onClick={() => navigate(`/quiz/${encodeURIComponent(latestQuiz._id || latestQuiz.id || latestQuiz.title || latestQuiz.name)}`)}
          >
            Play Now ▶
          </button>
          <span onClick={() => setShowBanner(false)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.8, padding: '0.4rem' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>✕</span>
        </div>
      )}

      <nav className="top-nav-dark">
        <div className="nav-left">
          <span className="hamburger" onClick={onOpenSidebar}>☰</span>
          <div className="brand-text" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <KMSLogo size="1.5rem" />
          </div>
        </div>

        <div className="search-container" style={{ position: 'relative' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search games & quizzes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          <button
            title="Voice Search"
            onClick={startVoiceSearch}
            style={{
              position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem',
              color: 'var(--text-muted)', padding: '0.25rem 0.4rem', borderRadius: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-1)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            🎤
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="lang-toggle"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            onClick={toggleMute}
            style={{ fontSize: '1.2rem', padding: '0.4rem 0.8rem', borderRadius: '12px' }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {userRole === 'admin' || userRole === 'sub_admin' ? (
            <div style={{ position: 'relative' }}>
              <div className="profile-pill" style={{ whiteSpace: 'nowrap' }} onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                <div className="avatar-circle">{userRole === 'sub_admin' ? 'SA' : 'AD'}</div>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{userRole === 'sub_admin' ? 'Sub Admin ▼' : 'Admin ▼'}</span>
              </div>
              {isProfileDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, background: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px',
                  boxShadow: 'var(--card-shadow)', zIndex: 1000
                }}>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/admin'); setIsProfileDropdownOpen(false); }}>🛡️ Admin Panel</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}>⚙️ Account</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/leaderboard'); setIsProfileDropdownOpen(false); }}>🏆 Leaderboard</div>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: '#ef4444', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { logout(); setIsProfileDropdownOpen(false); }}>🚪 Log Out</div>
                </div>
              )}
            </div>
          ) : userRole === 'user' ? (
            <div style={{ position: 'relative' }}>
              <div className="profile-pill" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem' }} onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                {currentUser && currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                  <img src={currentUser.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar-circle" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', width: '28px', height: '28px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {currentUser ? currentUser.avatar : 'US'}
                  </div>
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {currentUser ? currentUser.username.substring(0, 10) : 'Profile'} ▼
                </span>
              </div>
              {isProfileDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, background: 'var(--glass-bg)',
                  border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.5rem',
                  display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '160px',
                  boxShadow: 'var(--card-shadow)', zIndex: 1000
                }}>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}>👤 Profile</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/profile'); setIsProfileDropdownOpen(false); }}>⚙️ Account</div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { navigate('/leaderboard'); setIsProfileDropdownOpen(false); }}>🏆 Leaderboard</div>
                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }}></div>
                  <div style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '8px', fontSize: '0.9rem', color: '#ef4444', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => { logout(); setIsProfileDropdownOpen(false); }}>🚪 Log Out</div>
                </div>
              )}
            </div>
          ) : (
            <button className="newsletter-btn" onClick={() => setIsLoginModalOpen(true)}>
              Log In / Register
            </button>
          )}

          <button className="newsletter-btn" onClick={() => navigate('/leaderboard')}>
            🏆 Leaderboard
          </button>
        </div>
      </nav>
    </>
  );
}
