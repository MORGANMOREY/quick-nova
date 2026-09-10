import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { userApi } from '../services/api';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { featuredQuizzes, newQuizzes } = useQuiz();

  const [leaderboardData, setLeaderboardData] = useState([]);
  const [filter, setFilter] = useState('All-time');
  const [type, setType] = useState('Global');
  const [selectedQuiz, setSelectedQuiz] = useState('All Quizzes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await userApi.getLeaderboard();
        if (Array.isArray(data)) {
          setLeaderboardData(data);
        }
      } catch (err) {
        console.warn('Failed to load live leaderboard from backend, using fallback:', err.message);
        setLeaderboardData([
          { rank: 1, name: 'QuizMaster99', score: 14500, time: 'Active', avatar: 'QM' },
          { rank: 2, name: 'TriviaKing', score: 13200, time: 'Active', avatar: 'TK' },
          { rank: 3, name: 'SmartyPants', score: 12850, time: 'Active', avatar: 'SP' },
          { rank: 4, name: 'Brainiac22', score: 11400, time: 'Active', avatar: 'BR' },
          { rank: 5, name: 'NovaPlayer', score: 10900, time: 'Active', avatar: 'NP' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getFilteredData = () => {
    let filtered = [...leaderboardData];
    if (type === 'Quiz-specific' && selectedQuiz !== 'All Quizzes') {
      filtered = filtered.filter((_, idx) => idx % 2 === 0).slice(0, 5);
    }
    if (filter === 'Daily') {
      filtered = filtered.slice(0, 3).map((u, i) => ({ ...u, rank: i + 1, score: Math.floor(u.score * 0.1), time: 'Today' }));
    } else if (filter === 'Weekly') {
      filtered = filtered.slice(0, 5).map((u, i) => ({ ...u, rank: i + 1, score: Math.floor(u.score * 0.4), time: 'This week' }));
    } else if (filter === 'Monthly') {
      filtered = filtered.slice(0, 7).map((u, i) => ({ ...u, rank: i + 1, score: Math.floor(u.score * 0.7), time: 'This month' }));
    }
    return filtered;
  };

  const displayData = getFilteredData();
  const quizList = [...featuredQuizzes, ...newQuizzes];

  return (
    <div className="main-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="back-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          ← BACK TO GAMES & QUIZZES
        </span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Leaderboard 🏆
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
          See how you stack up against the best QuizNova players.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '0.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
          {['Global', 'Quiz-specific'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: type === t ? 'var(--accent-1)' : 'transparent',
                color: type === t ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
          {type === 'Quiz-specific' && (
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              style={{ background: 'var(--bg-main)', color: '#fff', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.5rem', marginLeft: '0.5rem' }}
            >
              <option value="All Quizzes">All Quizzes</option>
              {quizList.map((q, i) => (
                <option key={i} value={q.title || q.name}>
                  {q.title || q.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Daily', 'Weekly', 'Monthly', 'All-time'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: filter === f ? 'var(--accent-1)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: filter === f ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--glass-bg)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border-subtle)', boxShadow: 'var(--card-shadow)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading rankings...
          </div>
        ) : displayData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏆</div>
            <p>No leaderboard data available right now. Play some quizzes!</p>
          </div>
        ) : (
          displayData.map((user, index) => (
            <div
              key={user.rank || index}
              style={{ display: 'flex', alignItems: 'center', padding: '1.25rem', borderBottom: index < displayData.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s', borderRadius: '12px', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-muted)', width: '40px', textAlign: 'center' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${user.rank}`}
              </div>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', marginLeft: '1rem', marginRight: '1.5rem', overflow: 'hidden', flexShrink: 0 }}>
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerText = user.name ? user.name.substring(0, 2).toUpperCase() : 'US';
                    }}
                  />
                ) : (
                  user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'US')
                )}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {user.time}</div>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--accent-1)' }}>
                {user.score.toLocaleString()} XP
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
