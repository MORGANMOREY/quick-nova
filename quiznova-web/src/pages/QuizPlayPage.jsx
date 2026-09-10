import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { playSound } from '../services/soundEffects';
import { userApi } from '../services/api';
import ConfettiCanvas from '../components/common/ConfettiCanvas';

export default function QuizPlayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { findQuizByIdOrTitle } = useQuiz();
  const { currentUser, updateUser } = useAuth();
  const { addToast } = useToast();

  const quiz = findQuizByIdOrTitle(id);

  // Read options from sessionStorage if set by landing page
  const playOptions = (() => {
    try {
      const stored = sessionStorage.getItem('quiznova_active_play_options');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timerDuration, setTimerDuration] = useState(playOptions?.timerSeconds !== undefined ? playOptions.timerSeconds : 15);
  const [timerBonusEnabled, setTimerBonusEnabled] = useState(playOptions?.timerBonus !== undefined ? playOptions.timerBonus : true);
  const [timeLeft, setTimeLeft] = useState(playOptions?.timerSeconds !== undefined ? playOptions.timerSeconds : 15);
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [speedBonusTotal, setSpeedBonusTotal] = useState(0);
  const [lastAwardedXP, setLastAwardedXP] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  // 50-50 Lifeline
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [hiddenOptionIndices, setHiddenOptionIndices] = useState([]);

  // Speech Recognition (Voice Answer)
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Gamified elements & timer tracking
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  // Initialize quiz questions on mount
  useEffect(() => {
    if (!quiz) return;

    // Deduplicate by question text
    const seen = new Set();
    const rawQuestions = quiz.questions && quiz.questions.length > 0
      ? quiz.questions
      : [{ q: `Sample question for ${quiz.title || quiz.name}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], ans: 0, exp: 'Sample explanation' }];

    const uniqueQuestions = rawQuestions.filter((q) => {
      const key = (q.q || '').trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const shuffled = uniqueQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(10, uniqueQuestions.length));

    const questionsWithOptionsShuffled = shuffled.map((q) => {
      const correctOptionText = q.options[q.ans];
      const newOptions = [...q.options].sort(() => 0.5 - Math.random());
      const newAnsIdx = newOptions.indexOf(correctOptionText);
      return {
        ...q,
        options: newOptions,
        ans: newAnsIdx,
      };
    });

    setShuffledQuestions(questionsWithOptionsShuffled);
    setCurrentQIdx(0);
    setScore(0);
    setSpeedBonusTotal(0);
    setLastAwardedXP(null);
    setIsFinished(false);
    setShowExplanation(false);
    setSelected(null);
    setFeedback(null);
    setStreak(0);
    setMaxStreak(0);
    setStartTime(Date.now());
    setTimeLeft(timerDuration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  // Handle quiz completion & persist XP
  useEffect(() => {
    if (!isFinished || shuffledQuestions.length === 0) return;

    const streakBonus = maxStreak >= 2 ? maxStreak * 20 : 0;
    const finalXP = score * 50 + speedBonusTotal + streakBonus;

    playSound('complete');
    setConfettiTrigger({ type: 'complete', id: Date.now() });

    if (currentUser) {
      const newTotal = (currentUser.totalXP || 0) + finalXP;
      const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1;
      updateUser({ totalXP: newTotal, level: newLevel });

      const accuracy = Math.round((score / shuffledQuestions.length) * 100);
      userApi
        .saveHistory({
          quizTitle: quiz?.title || quiz?.name || 'Quiz',
          accuracy,
          xpEarned: finalXP,
          maxStreak,
        })
        .catch((err) => console.error('Failed to log history:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished]);

  // Countdown timer effect
  useEffect(() => {
    if (isFinished || shuffledQuestions.length === 0) return;
    if (timerDuration === 0) return;

    if (timeLeft > 0 && !showExplanation) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showExplanation) {
      playSound('wrong');
      setStreak(0);
      setShowExplanation(true);
      setFeedback({
        isCorrect: false,
        emoji: '⏰',
        message: 'Time is up! Speed matters!',
      });
    }
  }, [timeLeft, showExplanation, isFinished, shuffledQuestions.length, timerDuration]);

  if (!quiz) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Quiz Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          We couldn't find the quiz you're trying to play.
        </p>
        <button className="start-btn" onClick={() => navigate('/')}>
          ← Back to Quizzes
        </button>
      </div>
    );
  }

  const handleSelect = (idx) => {
    if (showExplanation || shuffledQuestions.length === 0) return;
    setSelected(idx);
    const isCorrect = idx === shuffledQuestions[currentQIdx].ans;

    if (isCorrect) {
      setScore((s) => s + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      let currentSpeedBonus = 0;
      if (timerBonusEnabled && timerDuration > 0 && timeLeft >= Math.ceil(timerDuration / 2)) {
        currentSpeedBonus = 50;
        setSpeedBonusTotal((s) => s + 50);
      }

      const currentStreakBonus = nextStreak >= 2 ? nextStreak * 15 : 0;
      const totalQuestionXP = 50 + currentSpeedBonus + currentStreakBonus;
      setLastAwardedXP({
        base: 50,
        speed: currentSpeedBonus,
        streak: currentStreakBonus,
        total: totalQuestionXP,
      });

      if (nextStreak >= 3) {
        playSound('streak');
      } else {
        playSound('correct');
      }
      setConfettiTrigger({ type: 'correct', id: Date.now() });

      const emojis = ['🎉', '😎', '🔥', '🚀', '🥳', '✨', '🧠', '🎯', '🏆', '🌟'];
      const messages = ['Nailed it!', 'Too easy for you!', 'Spot on!', 'Brain size: MEGA', "You're on fire!"];
      let baseMsg = messages[Math.floor(Math.random() * messages.length)];
      if (currentSpeedBonus > 0) {
        baseMsg += ` ⚡ Lightning Speed (+${currentSpeedBonus} XP)!`;
      }
      if (nextStreak >= 3) {
        baseMsg += ` 🔥 Combo Streak x${nextStreak}!`;
      }

      setFeedback({
        isCorrect: true,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        message: baseMsg,
      });
    } else {
      setStreak(0);
      playSound('wrong');
      setLastAwardedXP(null);
      const emojis = ['😅', '🫣', '💪', '💡', '🌱', '🙃', '👀'];
      const messages = ['Oops, almost!', 'Keep going!', 'Learning moment!', 'Not quite, but good guess!', 'Next time for sure!'];
      setFeedback({
        isCorrect: false,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      });
    }

    setShowExplanation(true);
  };

  const handleNext = () => {
    playSound('click');
    if (currentQIdx < shuffledQuestions.length - 1) {
      setCurrentQIdx((q) => q + 1);
      setSelected(null);
      setShowExplanation(false);
      setFeedback(null);
      setLastAwardedXP(null);
      setHiddenOptionIndices([]);
      setTimeLeft(timerDuration);
    } else {
      if (startTime) {
        setTotalElapsedSeconds(Math.round((Date.now() - startTime) / 1000));
      }
      setIsFinished(true);
    }
  };

  // 50-50 Lifeline trigger
  const useFiftyFifty = () => {
    if (fiftyFiftyUsed || showExplanation || shuffledQuestions.length === 0) return;
    const currentQ = shuffledQuestions[currentQIdx];
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.ans);

    // Pick 2 random wrong options to hide
    const toHide = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptionIndices(toHide);
    setFiftyFiftyUsed(true);
    playSound('click');
    addToast('🪄 50-50 Lifeline used! 2 wrong options removed.', 'info');
  };

  // Voice Answer Recognition
  const startVoiceAnswer = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast('Voice recognition is not supported in this browser.', 'error');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListeningVoice(true);
    recognition.onresult = (event) => {
      setIsListeningVoice(false);
      const transcript = event.results[0][0].transcript.toLowerCase();
      addToast(`🎤 Heard: "${transcript}"`, 'info');

      const currentQ = shuffledQuestions[currentQIdx];
      if (!currentQ) return;

      // Check if voice matches option index or option text
      let matchedIdx = -1;
      if (['first', '1', 'one', 'a', 'option a'].some((v) => transcript.includes(v))) matchedIdx = 0;
      else if (['second', '2', 'two', 'b', 'option b'].some((v) => transcript.includes(v))) matchedIdx = 1;
      else if (['third', '3', 'three', 'c', 'option c'].some((v) => transcript.includes(v))) matchedIdx = 2;
      else if (['fourth', '4', 'four', 'd', 'option d'].some((v) => transcript.includes(v))) matchedIdx = 3;

      if (matchedIdx === -1) {
        matchedIdx = currentQ.options.findIndex((opt) =>
          transcript.includes(opt.toLowerCase()) || opt.toLowerCase().includes(transcript)
        );
      }

      if (matchedIdx !== -1) {
        handleSelect(matchedIdx);
      } else {
        addToast("Couldn't match voice to an option. Please try again or click an option.", 'error');
      }
    };
    recognition.onerror = () => {
      setIsListeningVoice(false);
      addToast('Voice recognition canceled or failed.', 'error');
    };
    recognition.start();
  };

  // Results Screen View
  if (isFinished) {
    const streakBonus = maxStreak >= 2 ? maxStreak * 20 : 0;
    const baseScoreXP = score * 50;
    const finalXP = baseScoreXP + speedBonusTotal + streakBonus;
    const accuracy = shuffledQuestions.length > 0 ? Math.round((score / shuffledQuestions.length) * 100) : 0;

    let tierBadge = { title: '🌱 Knowledge Explorer', color: '#10b981', desc: 'Good start! Practice makes perfect.' };
    if (accuracy === 100) {
      tierBadge = { title: '👑 Quiz Legend (Flawless!)', color: '#fbbf24', desc: 'Incredible! 100% perfect accuracy!' };
    } else if (accuracy >= 80) {
      tierBadge = { title: '🌟 Mastermind (Outstanding)', color: '#a855f7', desc: 'Top tier intellect and rapid recall!' };
    } else if (accuracy >= 60) {
      tierBadge = { title: '🎯 Sharp Scholar (Great Job)', color: '#38bdf8', desc: 'Solid performance across the board!' };
    }

    const formatDuration = (secs) => {
      if (secs < 60) return `${secs}s`;
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}m ${s}s`;
    };

    return (
      <div className="quiz-page-wrapper flex-col" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '2rem 1rem' }}>
        <ConfettiCanvas trigger={confettiTrigger} />

        <div style={{ position: 'absolute', top: '1rem', left: '1rem', padding: '1rem' }}>
          <span className="back-link" style={{ cursor: 'pointer' }} onClick={() => { playSound('click'); navigate('/'); }}>
            ← BACK TO GAMES & QUIZZES
          </span>
        </div>

        <div style={{ textAlign: 'center', width: '100%', maxWidth: '640px', background: 'var(--glass-bg)', padding: '2.5rem 2rem', border: '1px solid var(--border-subtle)', borderRadius: '24px', backdropFilter: 'blur(24px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', marginTop: '2rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', animation: 'bounce 1s ease' }}>🏆</div>
          <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontFamily: 'Outfit, sans-serif', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Quiz Complete!
          </h2>

          <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '30px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${tierBadge.color}`, color: tierBadge.color, fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {tierBadge.title}
          </div>

          {/* Grand XP Banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(56,189,248,0.3)', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(14,165,233,0.1)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Score & XP</div>
            <div style={{ fontSize: '2.6rem', color: 'var(--accent-1)', fontWeight: '900', margin: '0.2rem 0' }}>+{finalXP} XP</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              You scored <strong style={{ color: '#fff' }}>{score}</strong> out of <strong style={{ color: '#fff' }}>{shuffledQuestions.length}</strong> questions correct ({accuracy}%)
            </div>
          </div>

          {/* Detailed Score Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', marginBottom: '2rem', textAlign: 'left' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⚡ Base Quiz XP</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>+{baseScoreXP} XP</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>50 XP per correct answer</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ Speed Bonus</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '0.2rem' }}>+{speedBonusTotal} XP</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timerBonusEnabled ? 'Fast answer bonus' : 'Disabled'}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔥 Max Streak Combo</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fbbf24', marginTop: '0.2rem' }}>
                {maxStreak}x ({streakBonus > 0 ? `+${streakBonus} XP` : 'No bonus'})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consecutive correct answers</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏳ Time Elapsed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>{formatDuration(totalElapsedSeconds || 15)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timer: {timerDuration === 0 ? 'Untimed' : `${timerDuration}s/Q`}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-btn" onClick={() => { playSound('click'); navigate('/'); }}>
              Back to Browse
            </button>
            <button
              className="primary-btn"
              style={{ background: 'transparent', border: '1px solid var(--accent-1)' }}
              onClick={() => {
                setIsFinished(false);
                setShowExplanation(false);
                setSelected(null);
                setFeedback(null);
                setStreak(0);
                setMaxStreak(0);
                setScore(0);
                setCurrentQIdx(0);
                setTimeLeft(timerDuration);
                setFiftyFiftyUsed(false);
                setHiddenOptionIndices([]);
              }}
            >
              Retake Quiz 🔄
            </button>
            <button
              className="primary-btn"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }}
              onClick={async () => {
                playSound('click');
                const shareText = `🎓 I scored ${score}/${shuffledQuestions.length} on "${quiz?.title || quiz?.name}" and earned ${finalXP} XP! 🚀 Can you beat me? #QuizNova`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: 'QuizNova Score', text: shareText, url: window.location.href });
                  } else {
                    await navigator.clipboard.writeText(shareText);
                    addToast('Score copied to clipboard!', 'success');
                  }
                } catch {
                  // ignore
                }
              }}
            >
              Share 🔗
            </button>
            <button className="primary-btn" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)' }} onClick={() => { playSound('click'); navigate('/leaderboard'); }}>
              Leaderboard 🏆
            </button>
          </div>

          {/* Rating */}
          {!hasRated ? (
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--text-main)', fontSize: '1rem' }}>How was this quiz? Rate it!</h4>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.8rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    style={{ background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: rating >= star ? '#f59e0b' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  className="primary-btn"
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                  onClick={() => setHasRated(true)}
                >
                  Submit Rating
                </button>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', padding: '0.8rem', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
              ✓ Thank you for your feedback!
            </div>
          )}
        </div>
      </div>
    );
  }

  const question = shuffledQuestions[currentQIdx] || { q: '', options: [], ans: 0 };
  const isTimerLow = timerDuration > 0 && timeLeft <= 4 && !showExplanation;
  const currentLiveXP = score * 50 + speedBonusTotal + (streak >= 2 ? streak * 15 : 0);

  return (
    <div className="quiz-page-wrapper">
      <ConfettiCanvas trigger={confettiTrigger} />

      <div className="quiz-card" style={{ transition: 'all 0.3s ease' }}>
        {/* Header Bar */}
        <div className="quiz-header">
          <div className="quiz-header-title">
            <span
              style={{ cursor: 'pointer', marginRight: '1rem' }}
              onClick={() => { playSound('click'); navigate('/'); }}
            >
              ←
            </span>
            {quiz.title || quiz.name}
          </div>
          <div className="quiz-stats" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* 50-50 Lifeline Button */}
            <button
              onClick={useFiftyFifty}
              disabled={fiftyFiftyUsed || showExplanation}
              title={fiftyFiftyUsed ? '50-50 Already Used' : 'Remove 2 wrong options'}
              style={{
                background: fiftyFiftyUsed ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.3rem 0.6rem',
                color: fiftyFiftyUsed ? 'var(--text-muted)' : '#fff',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: fiftyFiftyUsed ? 'not-allowed' : 'pointer',
                opacity: fiftyFiftyUsed ? 0.4 : 1,
              }}
            >
              🪄 50:50
            </button>

            {/* Voice Answer Button */}
            <button
              onClick={startVoiceAnswer}
              disabled={showExplanation || isListeningVoice}
              title="Speak your answer"
              style={{
                background: isListeningVoice ? '#ef4444' : 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: '8px',
                padding: '0.3rem 0.6rem',
                color: isListeningVoice ? '#fff' : 'var(--accent-1)',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                animation: isListeningVoice ? 'pulse 1s infinite alternate' : 'none'
              }}
            >
              🎤 {isListeningVoice ? 'Listening...' : 'Voice'}
            </button>

            {/* Question Counter */}
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              Q{currentQIdx + 1}/{shuffledQuestions.length}
            </div>

            {/* Timer HUD */}
            {timerDuration > 0 ? (
              <div
                className={`timer-circle ${isTimerLow ? 'timer-pulsing' : ''}`}
                style={{
                  background: isTimerLow ? '#ef4444' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontWeight: '900',
                  border: `2px solid ${isTimerLow ? '#f87171' : 'var(--accent-1)'}`,
                  boxShadow: isTimerLow ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
                  transform: isTimerLow ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s',
                }}
                title={`${timeLeft}s remaining for this question`}
              >
                {timeLeft}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.3rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--accent-1)', fontWeight: 'bold' }}>
                ♾️ Untimed
              </div>
            )}

            {/* Live Score & Streak HUD */}
            <div className="score-badge" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.35rem 0.85rem' }}>
              <span style={{ fontWeight: 'bold' }}>🎯 {score}/{shuffledQuestions.length}</span>
              <span style={{ color: 'var(--accent-1)', fontWeight: '800' }}>✨ {currentLiveXP} XP</span>
              {streak >= 2 && (
                <span style={{ background: '#f59e0b', color: '#000', padding: '2px 7px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900' }}>
                  🔥 {streak}x
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="quiz-body">
          <div className="quiz-question-row">
            {question.image && (
              <div className="quiz-image-container" style={{ background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={question.image} alt="Question Context" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            )}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <div className="question-box" style={{ margin: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {question.q}
              </div>
            </div>
          </div>

          <div className="options-grid">
            {question.options.map((opt, i) => {
              if (hiddenOptionIndices.includes(i)) {
                return (
                  <div
                    key={i}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px dashed rgba(255,255,255,0.1)',
                      opacity: 0.3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    ❌ Option Eliminated
                  </div>
                );
              }

              let btnClass = 'option-pill';
              if (!showExplanation && selected === i) btnClass += ' selected';
              if (showExplanation) {
                if (i === question.ans) btnClass += ' correct';
                else if (selected === i) btnClass += ' wrong';
              }
              return (
                <button key={i} className={btnClass} onClick={() => handleSelect(i)} disabled={showExplanation}>
                  {opt}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div style={{ marginTop: '0.5rem', width: '100%', maxWidth: '700px', animation: 'popIn 0.4s ease-out' }}>
              {feedback && (
                <div className="feedback-banner" style={{ borderLeft: feedback.isCorrect ? '4px solid #10b981' : '4px solid #ef4444' }}>
                  <div className="feedback-emoji">{feedback.emoji}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <div className="feedback-title" style={{ color: feedback.isCorrect ? '#10b981' : '#ef4444' }}>
                      {feedback.isCorrect ? (
                        <span>
                          Correct! {lastAwardedXP ? <strong style={{ color: '#38bdf8', fontSize: '0.9rem', marginLeft: '0.5rem' }}>+{lastAwardedXP.total} XP Earned</strong> : null}
                        </span>
                      ) : (
                        'Incorrect'
                      )}
                    </div>
                    <div className="feedback-msg">{feedback.message}</div>
                  </div>
                </div>
              )}

              <div className="explanation-box">
                <p className="explanation-text">{question.exp || 'Great job answering this question!'}</p>
              </div>

              <button className="primary-btn next-btn" onClick={handleNext}>
                {currentQIdx < shuffledQuestions.length - 1 ? 'Next Question ▶' : 'View Results 🏆'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
