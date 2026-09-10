import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi, userApi } from '../services/api';
import { playSound } from '../services/soundEffects';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateUser, logout } = useAuth();

  const [history, setHistory] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', avatar: '', interests: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const maxStreak = (() => {
    try {
      return Number(localStorage.getItem('quiznova_max_streak') || 0);
    } catch {
      return 0;
    }
  })();

  useEffect(() => {
    const fetchHistory = async () => {
      if (currentUser) {
        try {
          const res = await userApi.getHistory(1, 50);
          const logs = Array.isArray(res) ? res : res.data || [];
          const formatted = logs.map((log) => ({
            quizTitle: log.quizTitle,
            date: new Date(log.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            accuracy: typeof log.accuracy === 'number' ? log.accuracy : 0,
            xpEarned: log.xpEarned || 0,
          }));
          setHistory(formatted);
          return;
        } catch (err) {
          console.warn('Error fetching backend logs, using cache fallback:', err.message);
        }
      }

      // Fallback local storage
      try {
        const savedHistory = localStorage.getItem('quiznova_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          const arr = Array.isArray(parsed) ? parsed : [];
          setHistory(
            arr.map((r) => ({
              ...r,
              accuracy: typeof r.accuracy === 'number' ? r.accuracy : 0,
            }))
          );
        }
      } catch (e) {
        console.error(e);
        setHistory([]);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const totalXP = currentUser?.totalXP ?? history.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0);
  const avgAccuracy =
    history.length > 0
      ? Math.round(
          history.reduce(
            (acc, curr) => acc + (typeof curr.accuracy === 'number' ? curr.accuracy : 0),
            0
          ) / history.length
        )
      : 0;

  const handleEditOpen = () => {
    setEditForm({
      username: currentUser?.username || '',
      avatar: currentUser?.avatar || '',
      interests: (currentUser?.interests || []).join(', '),
    });
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const updates = {
        username: editForm.username.trim(),
        avatar: editForm.avatar.trim().toUpperCase().substring(0, 2) || currentUser?.avatar,
        interests: editForm.interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const data = await authApi.updateMe(updates);
      const updatedUser = { ...currentUser, ...updates, ...(data.user || {}) };
      updateUser(updatedUser);
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  // Achievement badges logic
  const achievements = [
    {
      id: 'first_step',
      icon: '🎓',
      title: 'Trivia Scholar',
      desc: 'Completed your first quiz',
      unlocked: history.length >= 1,
    },
    {
      id: 'streak_master',
      icon: '🔥',
      title: 'Streak Master',
      desc: 'Achieved a 3+ correct answer combo streak',
      unlocked: maxStreak >= 3,
    },
    {
      id: 'accuracy_king',
      icon: '⚡',
      title: 'Perfect Marks',
      desc: 'Scored 100% accuracy on any quiz',
      unlocked: history.some((h) => h.accuracy === 100),
    },
    {
      id: 'snake_charmer',
      icon: '🐍',
      title: 'Snake Charmer',
      desc: 'Conquered the Snake Retro Quiz',
      unlocked: history.some((h) => (h.quizTitle || '').toLowerCase().includes('snake')),
    },
    {
      id: 'xp_champion',
      icon: '👑',
      title: 'XP Lord',
      desc: 'Earned more than 500 XP in total',
      unlocked: totalXP >= 500,
    },
  ];

  return (
    <div className="main-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          className="back-link"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            playSound('click');
            navigate('/');
          }}
        >
          ← BACK TO GAMES & QUIZZES
        </span>
      </div>

      {/* Profile Edit Modal */}
      {isEditOpen && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              padding: '2.5rem',
              maxWidth: '480px',
              width: '90%',
              boxShadow: 'var(--card-shadow)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '1.8rem',
                marginBottom: '1.5rem',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              ✏️ Edit Profile
            </h3>
            <div className="form-group">
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Username
              </label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Your display name"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'white', fontSize: '1rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Avatar Initials (2 letters)
              </label>
              <input
                type="text"
                value={editForm.avatar}
                maxLength={2}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value.toUpperCase() })}
                placeholder="e.g. JD"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'white', fontSize: '1rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Interests (comma-separated)
              </label>
              <input
                type="text"
                value={editForm.interests}
                onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })}
                placeholder="Science, History, Sports..."
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'white', fontSize: '1rem', boxSizing: 'border-box', marginTop: '0.5rem' }}
              />
            </div>
            {editError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem', marginTop: '1rem' }}>
                ⚠️ {editError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '10px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                style={{ flex: 2, padding: '0.8rem', background: 'var(--accent-gradient)', border: 'none', borderRadius: '10px', color: 'white', cursor: editLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.95rem', opacity: editLoading ? 0.7 : 1 }}
              >
                {editLoading ? 'Saving...' : '✅ Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {/* User Card */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {currentUser && currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-1)', boxShadow: '0 8px 25px rgba(56,189,248,0.3)' }}
                />
              ) : (
                <div
                  style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: 'white', boxShadow: '0 8px 25px rgba(56,189,248,0.3)', cursor: 'pointer' }}
                  onClick={handleEditOpen}
                >
                  {currentUser ? currentUser.avatar : 'US'}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--text-main)' }}>
                  {currentUser ? currentUser.username : 'Quiz Explorer'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>
                  {currentUser ? currentUser.email : 'explorer@quiznova.org'}
                </p>
                {currentUser?.interests?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {currentUser.interests.map((interest, i) => (
                      <span
                        key={i}
                        style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.1)', color: 'var(--accent-1)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(56,189,248,0.2)' }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="primary-btn"
                onClick={handleEditOpen}
                style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: 'var(--accent-1)', boxShadow: 'none' }}
              >
                ✏️ Edit Profile
              </button>
              <button
                className="primary-btn"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', boxShadow: 'none' }}
                onClick={() => {
                  playSound('click');
                  logout();
                  navigate('/');
                }}
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Stats Summary Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-1)', marginBottom: '0.25rem' }}>
                {totalXP.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ⚡ Total XP
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-1)', marginBottom: '0.25rem' }}>
                {history.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🎮 Quizzes Played
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: avgAccuracy === 100 ? '#4ade80' : avgAccuracy >= 60 ? '#38bdf8' : '#f87171', marginBottom: '0.25rem' }}>
                {avgAccuracy}%
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🎯 Avg Accuracy
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', marginBottom: '0.25rem' }}>
                {currentUser?.streakShieldCount !== undefined ? `${currentUser.streakShieldCount} Shields` : `${maxStreak}x`}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                🛡️ Streak Protection
              </div>
            </div>
          </div>
        </div>

        {/* Achievements / Badges Section */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-1)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏆 Achievements ({achievements.filter((a) => a.unlocked).length} / {achievements.length})
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {achievements.map((ach) => (
              <div
                key={ach.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  background: ach.unlocked ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${ach.unlocked ? 'var(--accent-1)' : 'var(--border-subtle)'}`,
                  opacity: ach.unlocked ? 1 : 0.45,
                  transition: 'all 0.3s ease',
                  boxShadow: ach.unlocked ? '0 0 15px rgba(56,189,248,0.1)' : 'none',
                }}
              >
                <div style={{ fontSize: '2.5rem', filter: ach.unlocked ? 'grayscale(0)' : 'grayscale(100%) drop-shadow(0 0 5px rgba(255,255,255,0.05))' }}>
                  {ach.icon}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: ach.unlocked ? '#fff' : 'var(--text-muted)', fontSize: '1.05rem' }}>
                    {ach.title}
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.3' }}>
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div style={{ background: 'var(--glass-bg)', borderRadius: '24px', padding: '2.5rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-1)', marginBottom: '1.5rem' }}>
            🎮 Quiz History Logs
          </h3>

          {history.length === 0 ? (
            <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: '1px dashed var(--border-subtle)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                No quizzes completed yet. Your logs will appear here once you play!
              </p>
              <button className="primary-btn" style={{ marginTop: '1.5rem' }} onClick={() => { playSound('click'); navigate('/'); }}>
                Start Playing Now 🚀
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Quiz/Game</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Date Played</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Accuracy</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>XP Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, index) => {
                    const acc = typeof record.accuracy === 'number' ? record.accuracy : 0;
                    return (
                      <tr
                        key={index}
                        style={{ borderBottom: index < history.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <strong style={{ color: '#fff', fontSize: '1rem' }}>{record.quizTitle}</strong>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-muted)' }}>{record.date}</td>
                        <td style={{ padding: '1.25rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '99px',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                background: acc === 100 ? 'rgba(74, 222, 128, 0.15)' : acc >= 60 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: acc === 100 ? '#4ade80' : acc >= 60 ? '#38bdf8' : '#f87171',
                              }}
                            >
                              {acc}%
                            </span>
                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', minWidth: '60px' }}>
                              <div style={{ width: `${acc}%`, height: '100%', background: acc === 100 ? '#4ade80' : acc >= 60 ? 'var(--accent-1)' : '#f87171', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: '800', color: 'var(--accent-1)', fontSize: '1.1rem' }}>
                          +{record.xpEarned} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
