import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import {
  EDITORS_PICKS_DATA,
  POPULAR_DATA,
  EDITORS_PICKS_QUESTIONS,
  POPULAR_QUESTIONS
} from '../data/defaultQuizzes';

export default function BrowsePage({ isAllQuizzesView = false, searchQuery: externalSearchQuery = '' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || externalSearchQuery;

  const {
    games,
    newQuizzes,
    featuredQuizzes,
    editorsPicksTitle,
    popularTitle,
    showFeaturedGames
  } = useQuiz();

  const [viewMode, setViewMode] = useState('grid');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [difficultyFilter, setDifficultyFilter] = useState('All Levels');

  const CATEGORIES = [
    'All Categories',
    'Entertainment',
    'Geography',
    'Science',
    'History',
    'Animals',
    'General',
    'Technology',
    'Sports',
    'Music',
    'Mythology'
  ];
  const DIFFICULTIES = ['All Levels', 'Low', 'Medium', 'High'];

  const getDifficulty = (quiz) => {
    if (quiz.difficulty) return quiz.difficulty;
    const count = (quiz.questions || []).length;
    if (count <= 3) return 'Low';
    if (count <= 7) return 'Medium';
    return 'High';
  };

  const allQuizzes = [];
  const seenTitles = new Set();
  [
    ...newQuizzes,
    ...featuredQuizzes,
    ...EDITORS_PICKS_DATA,
    ...POPULAR_DATA,
    ...games.filter((g) => !g.isHidden).map((g) => ({ ...g, title: g.name || g.title, id: g.name || g.id }))
  ].forEach((q) => {
    const title = q.title || q.name || '';
    const key = title.trim().toLowerCase();
    if (key && !seenTitles.has(key)) {
      seenTitles.add(key);
      allQuizzes.push(q);
    }
  });

  const filteredQuizzes = allQuizzes.filter((quiz) => {
    const matchSearch = (quiz.title || quiz.name || '')
      .toLowerCase()
      .includes((queryParam || '').toLowerCase());
    const matchCategory =
      categoryFilter === 'All Categories' ||
      (quiz.category || '').toLowerCase() === categoryFilter.toLowerCase();
    const matchDifficulty =
      difficultyFilter === 'All Levels' ||
      getDifficulty(quiz).toLowerCase() === difficultyFilter.toLowerCase();
    return matchSearch && matchCategory && matchDifficulty;
  });

  const goToQuiz = (quiz) => {
    const id = quiz._id || quiz.id || quiz.title || quiz.name;
    navigate(`/quiz/${encodeURIComponent(id)}`);
  };

  const isFilteredOrSearch = isAllQuizzesView || !!queryParam || categoryFilter !== 'All Categories' || difficultyFilter !== 'All Levels';

  return (
    <div className="main-container">
      {isAllQuizzesView && (
        <span
          className="back-link"
          style={{ cursor: 'pointer', display: 'inline-block', marginBottom: '1.25rem' }}
          onClick={() => navigate('/')}
        >
          ← BACK TO HOME & GAMES
        </span>
      )}

      <div className="header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>
          {queryParam
            ? `Search Results for "${queryParam}"`
            : isAllQuizzesView
            ? 'All Quizzes & Games'
            : 'Quizzes'}
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="category-dropdown"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{ background: 'var(--glass-bg)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '0.4rem 0.8rem', background: viewMode === 'grid' ? 'var(--accent-1)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '0.4rem 0.8rem', background: viewMode === 'list' ? 'var(--accent-1)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
            >
              📄 List
            </button>
          </div>
        </div>
      </div>

      {isFilteredOrSearch ? (
        <>
          {filteredQuizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--border-subtle)', marginTop: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No quizzes found</h3>
              <p>Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'games-grid' : ''} style={{ display: viewMode === 'list' ? 'flex' : '', flexDirection: viewMode === 'list' ? 'column' : '', gap: '1rem', marginTop: '1rem' }}>
              {filteredQuizzes.map((quiz, i) => {
                return (
                  <div
                    key={quiz._id || quiz.id || i}
                    className={viewMode === 'grid' ? 'game-square' : 'list-card'}
                    onClick={() => goToQuiz(quiz)}
                    style={
                      viewMode === 'list'
                        ? { background: 'var(--glass-bg)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'background 0.2s', minHeight: '90px' }
                        : { position: 'relative' }
                    }
                  >
                    <img
                      src={quiz.image}
                      alt={quiz.title || quiz.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';
                      }}
                      style={viewMode === 'list' ? { width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 } : {}}
                    />
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontSize: viewMode === 'list' ? '1.1rem' : 'inherit' }}>
                        {quiz.title || quiz.name}
                      </h3>
                      {quiz.desc && <p style={{ margin: '0 0 0.3rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{quiz.desc}</p>}
                      {quiz.category && (
                        <span style={{ fontSize: '0.72rem', background: 'rgba(56,189,248,0.1)', color: 'var(--accent-1)', padding: '2px 8px', borderRadius: '99px', border: '1px solid rgba(56,189,248,0.2)' }}>
                          {quiz.category}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="top-grid">
            {/* Left Side: Featured Quizzes */}
            <div className="featured-quizzes">
              {featuredQuizzes.map((quiz, idx) => (
                <div key={quiz._id || quiz.id || `featured-${idx}`} className="featured-card" onClick={() => goToQuiz(quiz)}>
                  <img src={quiz.image} className="f-card-img" alt={quiz.title} loading="lazy" decoding="async" />
                  <div className="f-card-body">
                    <h3>{quiz.title}</h3>
                    <p>{quiz.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: New Quizzes List */}
            <div className="new-quizzes">
              <h2>New Quizzes</h2>
              {newQuizzes.slice(0, 8).map((quiz, idx) => (
                <div
                  key={quiz._id || quiz.id || `new-${idx}-${quiz.title}`}
                  className="list-card"
                  onClick={() => goToQuiz(quiz)}
                  style={{ cursor: 'pointer', transition: 'background 0.2s', borderRadius: '10px', overflow: 'hidden', minHeight: '90px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--glass-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <img
                    src={quiz.image}
                    className="list-card-img"
                    alt={quiz.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80';
                    }}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', flexShrink: 0, borderRadius: '8px' }}
                  />
                  <div className="list-card-info" style={{ flex: 1, padding: '0.5rem 0.75rem', position: 'relative' }}>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                      {quiz.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quiz.desc}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {quiz.category && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(56,189,248,0.1)', color: 'var(--accent-1)', padding: '1px 6px', borderRadius: '99px', display: 'inline-block' }}>
                          {quiz.category}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: quiz.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : quiz.difficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: quiz.difficulty === 'Hard' ? '#ef4444' : quiz.difficulty === 'Medium' ? '#f59e0b' : '#10b981',
                          padding: '1px 6px',
                          borderRadius: '99px',
                          display: 'inline-block'
                        }}
                      >
                        {quiz.difficulty || 'Easy'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {newQuizzes.length === 0 && (
                <div style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                  No new quizzes yet. Check back soon!
                </div>
              )}
              <button
                className="see-all-btn"
                onClick={() => navigate('/browse')}
                style={{ background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', borderRadius: '8px', padding: '0.5rem 1rem', color: 'var(--accent-1)', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.5rem', width: '100%', transition: 'background 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56,189,248,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                See All Quizzes →
              </button>
            </div>
          </div>

          {/* Editors' Picks Section */}
          <section className="editors-picks-section">
            <h2>{editorsPicksTitle || "Editors' Picks"}</h2>
            <div className="ep-grid">
              {EDITORS_PICKS_DATA.map((quiz, idx) => {
                const questions = EDITORS_PICKS_QUESTIONS[quiz.id] || [{ q: `Question about ${quiz.title}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], ans: 0, exp: `Answer explanation for ${quiz.title}` }];
                return (
                  <div key={`ep-${quiz.id || idx}`} className="ep-card" onClick={() => goToQuiz({ ...quiz, questions })}>
                    <div className="ep-img-container">
                      <img
                        src={quiz.image}
                        alt={quiz.title}
                        className="ep-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      {quiz.isImageQuiz && <div className="ep-badge">🖼️</div>}
                    </div>
                    <div className="ep-info">
                      <div className="ep-title">{quiz.title}</div>
                      <div className="ep-desc">{quiz.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Popular Section */}
          <section className="editors-picks-section">
            <h2>{popularTitle || 'Popular'}</h2>
            <div className="ep-grid">
              {POPULAR_DATA.map((quiz, idx) => {
                const questions = POPULAR_QUESTIONS[quiz.id] || [{ q: `Question about ${quiz.title}`, options: ['Option A', 'Option B', 'Option C', 'Option D'], ans: 0, exp: `Answer explanation for ${quiz.title}` }];
                return (
                  <div key={`pop-${quiz.id || idx}`} className="ep-card" onClick={() => goToQuiz({ ...quiz, questions })}>
                    <div className="ep-img-container">
                      <img
                        src={quiz.image}
                        alt={quiz.title}
                        className="ep-img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>
                    <div className="ep-info">
                      <div className="ep-title">{quiz.title}</div>
                      <div className="ep-desc">{quiz.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Featured Games Grid (Bottom) */}
          <section className="featured-games" style={{ display: showFeaturedGames ? 'block' : 'none' }}>
            <div className="main-container" style={{ padding: '0', minHeight: 'auto', background: 'transparent' }}>
              <h2>Featured Games</h2>
              <div className="games-grid">
                {games.filter((g) => !g.isHidden).map((game) => (
                  <div
                    key={game._id || game.id || game.name}
                    className="game-square"
                    style={{ position: 'relative' }}
                    onClick={() => goToQuiz({
                      ...game,
                      title: game.name || game.title,
                      image: game.image,
                      questions: game.questions || [{ q: "Did you know this game doesn't have custom questions yet?", options: ['Yes', 'No'], ans: 0, exp: "We're adding them soon!" }]
                    })}
                  >
                    <img src={game.image} alt={game.name} loading="lazy" decoding="async" />
                    {game.questions && game.questions.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          background: 'var(--accent-gradient)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          boxShadow: '0 4px 10px rgba(56, 189, 248, 0.3)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(4px)',
                          zIndex: 2
                        }}
                      >
                        ✨ {game.questions.length} Qs
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
