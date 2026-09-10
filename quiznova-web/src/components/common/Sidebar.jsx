import { useNavigate } from 'react-router-dom';
import KMSLogo from './KMSLogo';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser, userRole, logout, setIsLoginModalOpen } = useAuth();
  const { games, featuredQuizzes, newQuizzes } = useQuiz();

  const renderAvatar = () => {
    if (userRole === 'guest') {
      return (
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
          👤
        </div>
      );
    }
    
    if (currentUser && currentUser.avatar) {
      if (currentUser.avatar.startsWith('http')) {
        return (
          <img src={currentUser.avatar} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '0.75rem', objectFit: 'cover', border: '2px solid var(--accent-1)' }} />
        );
      }
      return (
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 'bold', marginBottom: '0.75rem', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }}>
          {currentUser.avatar}
        </div>
      );
    }

    return (
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'white', fontWeight: 'bold', marginBottom: '0.75rem', boxShadow: '0 8px 25px rgba(16,185,129,0.25)' }}>
        {userRole === 'admin' ? 'AD' : 'US'}
      </div>
    );
  };

  const nameText = userRole === 'guest' 
    ? 'Welcome, Guest!' 
    : userRole === 'admin' 
      ? 'Administrator' 
      : (currentUser ? currentUser.username : 'Quiz Explorer');

  const emailText = userRole === 'admin' 
    ? 'admin@kmsacademy.org' 
    : (currentUser ? currentUser.email : 'explorer@kmsacademy.org');

  const sidebarQuizzes = [];
  const seenTitles = new Set();
  [...newQuizzes, ...featuredQuizzes].forEach(q => {
    const title = q.title || q.name || '';
    if (title && !seenTitles.has(title.toLowerCase())) {
      seenTitles.add(title.toLowerCase());
      sidebarQuizzes.push(q);
    }
  });

  return (
    <div className={`menu-overlay ${isOpen ? 'show' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }} onClick={onClose}>
      <div className={`sidebar ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <span className="close-btn" onClick={onClose}>✕</span>
          <div className="brand-text" style={{ display: 'flex', alignItems: 'center' }}>
            <KMSLogo size="1.2rem" />
          </div>
        </div>

        <div
          style={{
            padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
            borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)',
            cursor: 'pointer', transition: 'background 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
          onClick={() => {
            if (userRole === 'guest') {
              setIsLoginModalOpen(true);
            } else if (userRole === 'admin' || userRole === 'sub_admin') {
              navigate('/admin');
            } else {
              navigate('/profile');
            }
            onClose();
          }}
        >
          {renderAvatar()}

          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '0.5px', textAlign: 'center' }}>
            {nameText}
          </div>
          {userRole !== 'guest' && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: '500', textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>
              {emailText}
            </div>
          )}
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section-title">Account</div>
          {userRole !== 'guest' ? (
            <>
              {userRole === 'admin' || userRole === 'sub_admin' ? (
                <div className="sidebar-item" onClick={() => { navigate('/admin'); onClose(); }}>
                  <div className="sidebar-icon">🛡️</div>
                  <div className="sidebar-text">Admin Panel</div>
                </div>
              ) : (
                <div className="sidebar-item" onClick={() => { navigate('/profile'); onClose(); }}>
                  <div className="sidebar-icon">👤</div>
                  <div className="sidebar-text">Profile</div>
                </div>
              )}
              <div className="sidebar-item" onClick={() => { navigate('/profile'); onClose(); }}>
                <div className="sidebar-icon">⚙️</div>
                <div className="sidebar-text">Account</div>
              </div>
              <div className="sidebar-item" onClick={() => { navigate('/leaderboard'); onClose(); }}>
                <div className="sidebar-icon">🏆</div>
                <div className="sidebar-text">Leaderboard</div>
              </div>
              <div className="sidebar-item" onClick={() => { logout(); onClose(); }}>
                <div className="sidebar-icon">🚪</div>
                <div className="sidebar-text" style={{ color: '#ef4444' }}>Log Out</div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-item" onClick={() => { setIsLoginModalOpen(true); onClose(); }}>
                <div className="sidebar-icon">🔑</div>
                <div className="sidebar-text">Log In / Register</div>
              </div>
              <div className="sidebar-item" onClick={() => { navigate('/leaderboard'); onClose(); }}>
                <div className="sidebar-icon">🏆</div>
                <div className="sidebar-text">Leaderboard</div>
              </div>
            </>
          )}

          <div className="sidebar-section-title" style={{ marginTop: '1.5rem' }}>Games</div>
          {games.filter(g => !g.isHidden).map((game, idx) => (
            <div key={game._id || game.id || game.name} className="sidebar-item" onClick={() => {
              navigate(`/quiz/${encodeURIComponent(game._id || game.id || game.name || game.title)}`);
              onClose();
            }}>
              <div className="sidebar-icon">
                <img src={game.image} alt="" loading="lazy" decoding="async" />
              </div>
              <div className="sidebar-text">{game.title || game.name} {idx === 0 && <span className="new-badge">NEW</span>}</div>
            </div>
          ))}

          <div className="sidebar-section-title">KMS Academy Quizzes</div>
          {sidebarQuizzes.slice(0, 10).map(quiz => (
            <div key={quiz._id || quiz.id || quiz.title} className="sidebar-item" onClick={() => {
              navigate(`/quiz/${encodeURIComponent(quiz._id || quiz.id || quiz.title)}`);
              onClose();
            }}>
              <div className="sidebar-icon" style={{ overflow: 'hidden', borderRadius: '4px' }}>
                {quiz.image ? (
                  <img src={quiz.image} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '❓'
                )}
              </div>
              <div className="sidebar-text">{quiz.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
