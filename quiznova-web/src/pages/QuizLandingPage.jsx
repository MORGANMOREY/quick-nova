import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';

export default function QuizLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findQuizByIdOrTitle } = useQuiz();

  const quiz = findQuizByIdOrTitle(id);

  const [selectedTimer, setSelectedTimer] = useState(
    quiz && quiz.timerSeconds !== undefined ? quiz.timerSeconds : 15
  );
  const [timerBonus, setTimerBonus] = useState(true);

  if (!quiz) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Quiz Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          We couldn't find the quiz you're looking for.
        </p>
        <button className="start-btn" onClick={() => navigate('/')}>
          ← Back to Quizzes
        </button>
      </div>
    );
  }

  const TIMER_OPTIONS = [
    { value: 10, label: '10s', name: '⚡ Fast', desc: 'High adrenaline speed run' },
    { value: 15, label: '15s', name: '⏱️ Standard', desc: 'Balanced classic trivia pace' },
    { value: 30, label: '30s', name: '🧘 Relaxed', desc: 'More time to think & deduce' },
    { value: 60, label: '60s', name: '⏳ Extended', desc: 'Deep reading & analysis' },
    { value: 0, label: 'Zen', name: '♾️ Untimed', desc: 'No countdown timer pressure' }
  ];

  const handleStart = () => {
    // If it's a Snake game
    if ((quiz.title || quiz.name || '').toLowerCase().includes('snake')) {
      navigate(`/snake/${encodeURIComponent(quiz._id || quiz.id || quiz.title || quiz.name)}`);
      return;
    }

    // Save timer preferences in sessionStorage for the play screen
    sessionStorage.setItem(
      'quiznova_active_play_options',
      JSON.stringify({
        timerSeconds: selectedTimer,
        timerBonus: timerBonus && selectedTimer > 0,
      })
    );
    navigate(`/play/${encodeURIComponent(quiz._id || quiz.id || quiz.title || quiz.name)}`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span className="back-link" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          ← BACK TO GAMES & QUIZZES
        </span>
      </div>

      <div className="breadcrumb">
        <span style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/')}>
          Home
        </span>
        <span>›</span>
        <span style={{ margin: 0, cursor: 'pointer' }} onClick={() => navigate('/browse')}>
          Games & Quizzes
        </span>
        <span>›</span>
        <span style={{ margin: 0, color: 'var(--text-gray)' }}>{quiz.title || quiz.name}</span>
      </div>

      <div className="landing-hero" style={{ backgroundImage: `url(${quiz.image})` }}>
        <div className="image-quiz-badge">{quiz.category || 'Trivia'} Quiz</div>

        <div className="floating-start-card" style={{ maxWidth: '440px' }}>
          <div className="landing-category-pill">{quiz.category || 'General Knowledge'}</div>
          <h1 style={{ fontSize: '1.8rem', margin: '0.5rem 0 1rem 0' }}>{quiz.title || quiz.name}</h1>
          {quiz.desc && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{quiz.desc}</p>}

          {/* Timer Settings Selector */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                ⏱️ Question Timer: <strong style={{ color: 'var(--accent-1)' }}>{selectedTimer === 0 ? 'Untimed (Zen)' : `${selectedTimer}s per question`}</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {TIMER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedTimer(opt.value)}
                  style={{
                    padding: '0.5rem 0.2rem',
                    borderRadius: '8px',
                    border: selectedTimer === opt.value ? '1.5px solid var(--accent-1)' : '1px solid var(--border-subtle)',
                    background: selectedTimer === opt.value ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.03)',
                    color: selectedTimer === opt.value ? '#fff' : 'var(--text-muted)',
                    fontWeight: 'bold',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Speed Bonus Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>⚡ Speed Bonus (+50 XP for fast answers)</span>
              <label className="toggle-switch" style={{ transform: 'scale(0.85)' }}>
                <input
                  type="checkbox"
                  checked={timerBonus && selectedTimer > 0}
                  disabled={selectedTimer === 0}
                  onChange={(e) => setTimerBonus(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <button
            className="start-btn"
            onClick={handleStart}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            Start Quiz ▶
          </button>

          <div className="landing-meta" style={{ marginTop: '1rem', justifyContent: 'space-around' }}>
            <span>📝 {(quiz.questions || []).length} Questions</span>
            <span>🏆 Up to {(quiz.questions || []).length * 100} XP</span>
            <span>⭐ {quiz.difficulty || 'Medium'}</span>
          </div>
        </div>
      </div>

      <div className="login-prompt" style={{ marginTop: '1.5rem' }}>
        <span>★</span> Save your scores & track your leaderboard ranking! Login before playing.
      </div>
    </div>
  );
}
