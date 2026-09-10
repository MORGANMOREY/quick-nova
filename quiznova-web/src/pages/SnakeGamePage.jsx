import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { playSound } from '../services/soundEffects';
import { userApi } from '../services/api';

export default function SnakeGamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findQuizByIdOrTitle } = useQuiz();
  const { currentUser, updateUser } = useAuth();
  const { addToast } = useToast();

  const quiz = findQuizByIdOrTitle(id) || {
    title: 'Snake Trivia Challenge',
    questions: [
      { q: "Which snake is known as the longest venomous snake in the world?", options: ["King Cobra", "Black Mamba", "Inland Taipan", "Rattlesnake"], ans: 0 },
      { q: "What do snakes use to smell their surroundings?", options: ["Their nose", "Their tongue", "Their skin", "Their eyes"], ans: 1 },
      { q: "Which of these snakes is a constrictor?", options: ["Python", "Cobra", "Viper", "Coral Snake"], ans: 0 }
    ]
  };

  const GRID_SIZE = 15;
  const [snake, setSnake] = useState([{ x: 7, y: 7 }]);
  const [dir, setDir] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [foods, setFoods] = useState([]);
  const [won, setWon] = useState(false);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('quiznova_snake_highscore') || '0'));

  const tickSpeed = Math.max(160, 420 - currentQIdx * 70);

  useEffect(() => {
    if (gameOver || won) return;
    const q = quiz.questions[currentQIdx];
    if (!q) {
      setWon(true);
      return;
    }

    const newFoods = [];
    q.options.forEach((opt, i) => {
      let fx, fy, overlap;
      do {
        fx = Math.floor(Math.random() * GRID_SIZE);
        fy = Math.floor(Math.random() * GRID_SIZE);
        overlap = snake.some((s) => s.x === fx && s.y === fy) || newFoods.some((f) => f.x === fx && f.y === fy);
      } while (overlap);
      newFoods.push({ x: fx, y: fy, text: opt, isCorrect: i === q.ans });
    });
    setFoods(newFoods);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIdx, gameOver, won]);

  const handleGameComplete = async (earnedXP) => {
    if (currentUser) {
      const newTotal = (currentUser.totalXP || 0) + earnedXP;
      const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1;
      updateUser({ totalXP: newTotal, level: newLevel });

      try {
        await userApi.saveHistory({
          quizTitle: quiz.title || 'Snake Quiz',
          accuracy: 100,
          xpEarned: earnedXP,
          maxStreak: currentQIdx + 1,
        });
      } catch (err) {
        console.error('Failed to log snake quiz history:', err);
      }
    }
    addToast(`Earned +${earnedXP} XP!`, 'success');
  };

  useEffect(() => {
    if (gameOver || won || foods.length === 0) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };
        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          playSound('snake_die');
          setGameOver(true);
          return prev;
        }
        if (prev.some((s) => s.x === head.x && s.y === head.y)) {
          playSound('snake_die');
          setGameOver(true);
          return prev;
        }

        const newSnake = [head, ...prev];
        const eatenIdx = foods.findIndex((f) => f.x === head.x && f.y === head.y);

        if (eatenIdx !== -1) {
          if (foods[eatenIdx].isCorrect) {
            const addedScore = 5 + currentQIdx * 2;
            const newScore = score + addedScore;
            setScore(newScore);
            playSound('snake_eat');

            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('quiznova_snake_highscore', newScore.toString());
            }

            if (currentQIdx < quiz.questions.length - 1) {
              setFoods([]);
              setCurrentQIdx((q) => q + 1);
            } else {
              setWon(true);
              playSound('complete');
              handleGameComplete(newScore * 30);
            }
          } else {
            playSound('snake_die');
            setGameOver(true);
          }
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, tickSpeed);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, gameOver, won, foods, currentQIdx, score, tickSpeed]);

  useEffect(() => {
    const handleKey = (e) => {
      if (['ArrowUp', 'w', 'W'].includes(e.key) && dir !== 'DOWN') {
        e.preventDefault();
        setDir('UP');
      }
      if (['ArrowDown', 's', 'S'].includes(e.key) && dir !== 'UP') {
        e.preventDefault();
        setDir('DOWN');
      }
      if (['ArrowLeft', 'a', 'A'].includes(e.key) && dir !== 'RIGHT') {
        e.preventDefault();
        setDir('LEFT');
      }
      if (['ArrowRight', 'd', 'D'].includes(e.key) && dir !== 'LEFT') {
        e.preventDefault();
        setDir('RIGHT');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dir]);

  return (
    <div className="quiz-page-wrapper flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          🐍 Retro Neon Snake Quiz
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
          Steer the snake with <strong>Arrow keys / WASD</strong> or the <strong>Arcade D-Pad</strong> to eat the <strong>CORRECT</strong> answer!
        </p>
      </div>

      {/* Info Stats Bar */}
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '0.75rem 2rem', borderRadius: '50px', backdropFilter: 'blur(10px)' }}>
        <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 'bold' }}>
          Score: <span style={{ color: 'var(--accent-1)' }}>{score}</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          🏆 Highscore: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{highScore}</span>
        </div>
        <div style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
          ⚡ Speed Level: <span style={{ color: '#ff4b4b', fontWeight: 'bold' }}>{currentQIdx + 1}</span>
        </div>
      </div>

      {gameOver && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem 2rem', borderRadius: '16px', marginBottom: '1rem', animation: 'popIn 0.3s ease' }}>
          <h3 style={{ color: '#f87171', margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💥 GAME OVER! You crashed or ate the wrong option.
          </h3>
        </div>
      )}

      {won && (
        <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '1.5rem 3rem', borderRadius: '16px', marginBottom: '1rem', textAlign: 'center', animation: 'popIn 0.4s ease' }}>
          <h3 style={{ color: '#4ade80', margin: 0, fontSize: '1.5rem' }}>🎉 PERFECT RUN! YOU WIN!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.5rem 0 0 0' }}>Earned +{(score * 30).toLocaleString()} XP!</p>
        </div>
      )}

      {/* Question Card Box */}
      {!gameOver && !won && (
        <div style={{ width: '100%', maxWidth: '650px', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', textAlign: 'center', boxShadow: 'var(--card-shadow)', backdropFilter: 'blur(10px)' }}>
          <span style={{ background: 'var(--accent-gradient)', color: 'white', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Question {currentQIdx + 1} of {quiz.questions.length}
          </span>
          <h3 style={{ fontSize: '1.45rem', marginTop: '0.75rem', color: '#fff', lineHeight: '1.4' }}>
            {quiz.questions[currentQIdx]?.q}
          </h3>
        </div>
      )}

      {/* Grid Container */}
      <div style={{
        position: 'relative',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, #090d16 0%, #030712 100%)',
        border: '4px solid var(--accent-1)',
        borderRadius: '16px',
        boxShadow: '0 0 25px rgba(56, 189, 248, 0.3), inset 0 0 40px rgba(0,0,0,0.8)',
        overflow: 'hidden'
      }}>
        {/* Retro Grid Cell BG Lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
          pointerEvents: 'none'
        }} />

        {/* Render Snake */}
        {snake.map((s, i) => {
          const isHead = i === 0;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${(s.x / GRID_SIZE) * 100}%`,
                top: `${(s.y / GRID_SIZE) * 100}%`,
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                background: isHead ? 'linear-gradient(135deg, #4ade80, #22c55e)' : '#16a34a',
                border: '1.5px solid #030712',
                borderRadius: isHead ? '6px' : '4px',
                boxShadow: isHead ? '0 0 10px rgba(74, 222, 128, 0.6)' : 'none',
                zIndex: isHead ? 4 : 3,
                transition: 'all 0.1s linear'
              }}
            />
          );
        })}

        {/* Render Foods */}
        {foods.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(f.x / GRID_SIZE) * 100}%`,
              top: `${(f.y / GRID_SIZE) * 100}%`,
              width: `${100 / GRID_SIZE}%`,
              height: `${100 / GRID_SIZE}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5
            }}
          >
            <div style={{
              background: f.isCorrect ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${f.isCorrect ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
              color: f.isCorrect ? '#000' : 'rgba(255,255,255,0.8)',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '0.65rem',
              fontWeight: '900',
              whiteSpace: 'nowrap',
              boxShadow: f.isCorrect ? '0 0 15px rgba(245, 158, 11, 0.5)' : 'none',
              transform: 'scale(1)',
              animation: f.isCorrect ? 'pulse 1.5s infinite alternate' : 'none'
            }}>
              {f.text}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual Arcade D-Pad */}
      <div className="arcade-controller" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          className="arcade-btn"
          onClick={() => { if (dir !== 'DOWN') setDir('UP'); playSound('click'); }}
          style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
        >
          ▲
        </button>
        <div style={{ display: 'flex', gap: '2rem', margin: '0.3rem 0' }}>
          <button
            className="arcade-btn"
            onClick={() => { if (dir !== 'RIGHT') setDir('LEFT'); playSound('click'); }}
            style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
          >
            ◀
          </button>
          <button
            className="arcade-btn"
            onClick={() => { if (dir !== 'LEFT') setDir('RIGHT'); playSound('click'); }}
            style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
          >
            ▶
          </button>
        </div>
        <button
          className="arcade-btn"
          onClick={() => { if (dir !== 'UP') setDir('DOWN'); playSound('click'); }}
          style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transition: 'all 0.1s' }}
        >
          ▼
        </button>
      </div>

      {/* Bottom Actions Row */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
        <button
          className="primary-btn"
          style={{ background: 'transparent', border: '1px solid var(--border-subtle)' }}
          onClick={() => { playSound('click'); navigate('/'); }}
        >
          Back to Browse
        </button>
        {(gameOver || won) && (
          <button
            className="primary-btn"
            onClick={() => {
              playSound('click');
              setSnake([{ x: 7, y: 7 }]);
              setDir('RIGHT');
              setScore(0);
              setCurrentQIdx(0);
              setGameOver(false);
              setWon(false);
            }}
          >
            Play Again 🔄
          </button>
        )}
      </div>
    </div>
  );
}
