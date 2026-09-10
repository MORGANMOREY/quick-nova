import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import { useToast } from '../context/ToastContext';
import ImageUploadInput, { compressImage } from '../components/common/ImageUploadInput';
import { playSound } from '../services/soundEffects';
import {
  FEATURED_QUIZZES,
  EDITORS_PICKS_DATA,
  POPULAR_DATA,
  EDITORS_PICKS_QUESTIONS,
  POPULAR_QUESTIONS
} from '../data/defaultQuizzes';

export default function AdminPage() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { addToast } = useToast();
  const {
    games,
    setGames,
    newQuizzes,
    featuredQuizzes,
    setFeaturedQuizzes,
    editorsPicksTitle,
    setEditorsPicksTitle,
    popularTitle,
    setPopularTitle,
    showFeaturedGames,
    setShowFeaturedGames,
    handleQuizAdded: onQuizAdded,
    handleQuizUpdated: onQuizUpdated,
    handleQuizDeleted: onQuizDeleted,
    handleRestoreFeaturedQuizzes: onRestoreFeaturedQuizzes
  } = useQuiz();

  const onNavigate = (screen) => {
    if (screen === 'home') navigate('/');
    else if (screen === 'browse') navigate('/browse');
    else if (screen === 'leaderboard') navigate('/leaderboard');
    else if (screen === 'profile' || screen === 'account') navigate('/profile');
    else navigate('/');
  };

  const [activeTab, setActiveTab] = useState(userRole === 'sub_admin' ? 'games' : 'dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [formData, setFormData] = useState({ name: '', image: '', questions: [] });

  // Live Simulator preview index
  const [previewQIdx, setPreviewQIdx] = useState(0);
  const [activeQuizQIdx, setActiveQuizQIdx] = useState(0);

  // Quick game add form state for the main admin dashboard
  const [dashboardGameForm, setDashboardGameForm] = useState({ name: '', image: '' });

  // Live Database monitoring states
  const [dbData, setDbData] = useState({ users: [], quizzes: [], history: [], databaseStatus: 'Offline', databaseEngine: 'Mock Engine' });
  const [loadingDb, setLoadingDb] = useState(false);

  const fetchDbData = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/api/debug/db');
      if (res.ok) {
        const data = await res.json();
        setDbData(data);
        addToast('Live data refreshed successfully', 'success');
      } else {
        throw new Error('Database fetch failed');
      }
    } catch (err) {
      console.error('Error fetching database dump in AdminPanel:', err);
      // Fallback for #6 Refresh live data - update with dummy data if backend is offline
      setDbData({
        users: [{ _id: 'u1', username: 'TestUser', email: 'test@example.com', role: 'user', totalXP: 100 }],
        quizzes: quizzesList,
        history: [{ _id: 'h1', userId: 'TestUser', quizTitle: 'Sample Quiz', accuracy: 100, xpEarned: 50, date: new Date() }],
        databaseStatus: 'Offline (Fallback Mode)',
        databaseEngine: 'Local Memory'
      });
      addToast('Backend offline, loaded fallback mock data', 'error');
    } finally {
      setLoadingDb(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Delete this user? (Local debug mode)')) {
      setDbData(prev => ({ ...prev, users: (prev.users || []).filter(u => u._id !== userId && u.email !== userId) }));
      addToast('User deleted successfully', 'error');
    }
  };

  // Moved filter logic below state declarations to prevent ReferenceError
  useEffect(() => {
    if (activeTab === 'users') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDbData();
    }
  }, [activeTab]);

  const handleDashboardQuickAddGame = () => {
    if (!dashboardGameForm.name.trim()) {
      addToast('Please enter a game name', 'error');
      return;
    }
    const finalImage = dashboardGameForm.image.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80';
    const newGame = { name: dashboardGameForm.name.trim(), image: finalImage };
    setGames([...games, newGame]);
    addToast(`Added ${newGame.name} to library!`, 'success');
    setDashboardGameForm({ name: '', image: '' });
  };

  // Quiz Management States - sync with newQuizzes and featuredQuizzes
  const [quizzesList, setQuizzesList] = useState(() => [
    ...newQuizzes.map(q => ({ ...q, id: q.id || q._id, title: q.title, category: q.category || 'New', difficulty: q.difficulty || 'Easy', status: 'ACTIVE', questions: q.questions || [] })),
    ...(featuredQuizzes || FEATURED_QUIZZES).map(q => ({ ...q, id: q.id || q._id, title: q.title, category: q.category || 'Featured', difficulty: q.difficulty || 'Medium', status: 'ACTIVE', questions: q.questions || [] })),
    ...EDITORS_PICKS_DATA.map(q => ({ ...q, id: q.id, title: q.title, category: 'Editors Pick', difficulty: 'Medium', status: 'ACTIVE', questions: [] })),
    ...POPULAR_DATA.map(q => ({ ...q, id: q.id, title: q.title, category: 'Popular', difficulty: 'Hard', status: 'ACTIVE', questions: [] }))
  ]);

  useEffect(() => {
    const list = [
      ...newQuizzes.map(q => ({ ...q, id: q.id || q._id, title: q.title, category: q.category || 'New', difficulty: q.difficulty || 'Easy', status: 'ACTIVE', questions: q.questions || [] })),
      ...(featuredQuizzes || FEATURED_QUIZZES).map(q => ({ ...q, id: q.id || q._id, title: q.title, category: q.category || 'Featured', difficulty: q.difficulty || 'Medium', status: 'ACTIVE', questions: q.questions || [] })),
      ...EDITORS_PICKS_DATA.map(q => ({ ...q, id: q.id, title: q.title, category: 'Editors Pick', difficulty: 'Medium', status: 'ACTIVE', questions: [] })),
      ...POPULAR_DATA.map(q => ({ ...q, id: q.id, title: q.title, category: 'Popular', difficulty: 'Hard', status: 'ACTIVE', questions: [] }))
    ];
    // Deduplicate by title
    const seen = new Set();
    const uniqueList = [];
    list.forEach(item => {
      const key = (item.title || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueList.push(item);
      }
    });
    setQuizzesList(uniqueList);
  }, [newQuizzes, featuredQuizzes]);

  // Filter lists for #1 Admin Dashboard search bar
  const searchLower = adminSearch.toLowerCase();
  const filteredAdminGames = games.filter(g => (g.name || g.title || '').toLowerCase().includes(searchLower));
  const filteredAdminQuizzes = quizzesList.filter(q => (q.title || '').toLowerCase().includes(searchLower));
  const filteredUsers = (dbData.users || []).filter(u => (u.username || u.email || '').toLowerCase().includes(searchLower));
  const filteredHistory = (dbData.history || []).filter(h => (h.userId || h.quizTitle || '').toLowerCase().includes(searchLower));
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const emptyQuiz = { title: '', desc: '', image: '', category: 'General', difficulty: 'Easy', timerSeconds: 15, status: 'ACTIVE', questions: [] };
  const [quizFormData, setQuizFormData] = useState(emptyQuiz);

  const handleOpenQuizModal = (q = null) => {
    if (q) {
      setEditingQuiz(q);
      setQuizFormData({ timerSeconds: 15, ...JSON.parse(JSON.stringify(q)) });
    } else {
      setEditingQuiz(null);
      setQuizFormData(JSON.parse(JSON.stringify(emptyQuiz)));
    }
    setActiveQuizQIdx(0);
    setIsQuizModalOpen(true);
  };

  const handleSaveQuiz = () => {
    if (!quizFormData.title || !quizFormData.title.trim()) {
      addToast('Please enter a quiz title', 'error');
      return;
    }

    const formattedQuestions = Array.isArray(quizFormData.questions) && quizFormData.questions.length > 0
      ? quizFormData.questions.map(q => ({
          q: q.q || 'Question',
          options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          ans: typeof q.ans === 'number' ? q.ans : 0,
          image: q.image || '',
          exp: q.exp || q.explanation || ''
        }))
      : [{
          q: `Sample question for ${quizFormData.title.trim()}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          ans: 0,
          image: '',
          exp: `Sample explanation for ${quizFormData.title.trim()}`
        }];

    const quizToSave = {
      ...quizFormData,
      title: quizFormData.title.trim(),
      desc: quizFormData.desc ? quizFormData.desc.trim() : '',
      image: quizFormData.image && quizFormData.image.trim() ? quizFormData.image.trim() : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
      category: quizFormData.category || 'General',
      difficulty: quizFormData.difficulty || 'Easy',
      timerSeconds: typeof quizFormData.timerSeconds === 'number' ? quizFormData.timerSeconds : 15,
      isNewQuiz: true,
      questions: formattedQuestions
    };

    if (editingQuiz) {
      setQuizzesList(prev => prev.map(q => (q.id === editingQuiz.id || q._id === editingQuiz._id || q.title === editingQuiz.title) ? quizToSave : q));
      if (onQuizUpdated) {
        onQuizUpdated(quizToSave);
      }
      addToast(`Updated "${quizToSave.title}"`, 'success');
    } else {
      const newQ = { ...quizToSave, id: Date.now() };
      setQuizzesList(prev => [newQ, ...prev]);
      if (onQuizAdded) {
        onQuizAdded(newQ);
      }
    }
    setIsQuizModalOpen(false);
  };

  const handleDeleteQuiz = (id) => {
    if (window.confirm('Delete this quiz?')) {
      setQuizzesList(quizzesList.filter(q => q.id !== id && q._id !== id));
      if (onQuizDeleted) {
        onQuizDeleted(id);
      }
      addToast('Quiz deleted', 'error');
    }
  };

  const handleOpenModal = (game = null) => {
    if (game) {
      setEditingGame(game);
      setFormData({ name: game.name, image: game.image, timerSeconds: game.timerSeconds !== undefined ? game.timerSeconds : 15, questions: game.questions || [] });
    } else {
      setEditingGame(null);
      setFormData({ name: '', image: '', timerSeconds: 15, questions: [] });
    }
    setPreviewQIdx(0);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const gameToSave = {
      ...formData,
      title: formData.name,
      timerSeconds: formData.timerSeconds !== undefined ? formData.timerSeconds : 15,
      questions: Array.isArray(formData.questions) ? formData.questions : []
    };
    if (editingGame) {
      setGames(games.map(g => g.name === editingGame.name ? gameToSave : g));
      if (onQuizUpdated) {
        onQuizUpdated({
          id: editingGame.id || editingGame._id || editingGame.name,
          title: gameToSave.name,
          name: gameToSave.name,
          image: gameToSave.image,
          timerSeconds: gameToSave.timerSeconds,
          questions: gameToSave.questions
        });
      }
      addToast(`Updated ${gameToSave.name} successfully`, 'success');
    } else {
      setGames([...games, gameToSave]);
      if (onQuizAdded) {
        onQuizAdded({
          id: Date.now(),
          title: gameToSave.name,
          name: gameToSave.name,
          desc: 'Custom game with questions',
          image: gameToSave.image || 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80',
          timerSeconds: gameToSave.timerSeconds,
          questions: gameToSave.questions
        });
      }
      addToast(`Added ${formData.name} to library`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (name) => {
    if (window.confirm(`Delete ${name}?`)) {
      setGames(games.filter(g => g.name !== name));
      addToast(`Deleted ${name}`, 'error');
    }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2>🛡️ KMS Admin</h2>
        <div className="admin-nav">
          {userRole !== 'sub_admin' && <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>}
          <div className={`admin-nav-item ${activeTab === 'games' ? 'active' : ''}`} onClick={() => setActiveTab('games')}>🎮 Manage Games</div>
          {userRole !== 'sub_admin' && (
            <>
              <div className={`admin-nav-item ${activeTab === 'quizzes' ? 'active' : ''}`} onClick={() => setActiveTab('quizzes')}>❓ Manage Quizzes</div>
              <div className={`admin-nav-item ${activeTab === 'question_bank' ? 'active' : ''}`} onClick={() => setActiveTab('question_bank')}>📚 Question Bank</div>
              <div className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 User Management</div>
              <div className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>📈 Analytics & Reports</div>
              <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</div>
            </>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="admin-nav-item" onClick={() => onNavigate('home')}>🌐 View Site</div>
            <div className="admin-nav-item" style={{ color: '#ef4444' }} onClick={() => { onNavigate('home'); }}>🔙 Back / Log Out</div>
          </div>
        </div>
      </div>

      <div className="admin-main">
        <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ margin: 0 }}>
            {activeTab === 'games' && 'Games Management'}
            {activeTab === 'quizzes' && 'Quizzes Management'}
            {activeTab === 'question_bank' && 'Question Bank'}
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'analytics' && 'Analytics & Reports'}
            {activeTab === 'settings' && 'Settings'}
            {activeTab === 'dashboard' && 'Performance Dashboard'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-end', maxWidth: '400px' }}>
            <div className="search-container" style={{ margin: 0, flex: 1, minWidth: '150px', maxWidth: '250px' }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
            </div>
            <div className="user-profile" style={{ margin: 0 }}>{userRole === 'sub_admin' ? 'Sub Admin 🛡️' : 'Super Admin 🛡️'}</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <div className="admin-stats-grid">
              <div className="stat-card">
                <span className="label">Total Games</span>
                <span className="value">{games.length}</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '65%' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Total Quizzes</span>
                <span className="value">{quizzesList.length}</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '80%', background: '#ffcc00' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Active Users</span>
                <span className="value">1,248</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '45%', background: '#00cc66' }}></div></div>
              </div>
              <div className="stat-card">
                <span className="label">Retention Rate</span>
                <span className="value">92%</span>
                <div className="metric-progress"><div className="metric-fill" style={{ width: '92%', background: '#ff3366' }}></div></div>
              </div>
            </div>

            {/* Quick Manage & Add Games Dashboard Row */}
            <div className="admin-dashboard-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>

              {/* Left Column: Quick Add Game Form */}
              <div className="admin-table-container" style={{ margin: 0 }}>
                <div className="admin-table-header">
                  <h3>⚡ Quick Add Game</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Game Name</label>
                    <input
                      type="text"
                      value={dashboardGameForm.name}
                      onChange={e => setDashboardGameForm({ ...dashboardGameForm, name: e.target.value })}
                      placeholder="e.g. Wordle Extreme"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Thumbnail Image URL</label>
                    <ImageUploadInput
                      value={dashboardGameForm.image}
                      onChange={val => setDashboardGameForm({ ...dashboardGameForm, image: val })}
                      placeholder="https://images.unsplash.com/... or drop image"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    />
                  </div>

                  {/* Preset Background Picker */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>OR SELECT A HIGH-QUALITY PRESET:</label>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {[
                        { name: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80', icon: '🎮' },
                        { name: 'Letters/Cross', url: 'https://images.unsplash.com/photo-1605235548773-455b706c88f1?auto=format&fit=crop&w=400&q=80', icon: '🧩' },
                        { name: 'Pattern', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80', icon: '🎨' },
                        { name: 'Neon Board', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80', icon: '👾' },
                        { name: 'Cards', url: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=400&q=80', icon: '🃏' }
                      ].map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setDashboardGameForm({
                              ...dashboardGameForm,
                              image: preset.url
                            });
                            addToast(`Selected ${preset.name} thumbnail`, 'success');
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            background: dashboardGameForm.image === preset.url ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                            border: dashboardGameForm.image === preset.url ? 'none' : '1px solid var(--border-subtle)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <span>{preset.icon}</span> {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={handleDashboardQuickAddGame}
                    style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
                  >
                    🚀 Add to Game Catalog
                  </button>
                </div>
              </div>

              {/* Right Column: Live Games Grid Preview & Direct Manage */}
              <div className="admin-table-container" style={{ margin: 0 }}>
                <div className="admin-table-header">
                  <h3>🎮 Live Game Dashboard Catalog</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-1)', fontWeight: 'bold' }}>{games.length} Games</span>
                </div>

                <div
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '1rem',
                    paddingRight: '0.5rem'
                  }}
                >
                  {filteredAdminGames.map(game => (
                    <div
                      key={game.name}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '4/3', width: '100%', overflow: 'hidden' }}>
                        <img
                          src={game.image}
                          alt={game.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Status pill overlay */}
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          left: '0.5rem',
                          background: game.isHidden ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
                          color: '#fff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.6rem',
                          fontWeight: '800'
                        }}>
                          {game.isHidden ? 'HIDDEN' : 'ACTIVE'}
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: '#fff',
                          lineHeight: '1.2',
                          marginBottom: '0.5rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {game.name || game.title || 'Unnamed Game'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenModal(game)}
                            style={{
                              flex: 1,
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              padding: '0.3rem',
                              cursor: 'pointer',
                              color: '#fff',
                              fontSize: '0.75rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {userRole !== 'sub_admin' && (
                            <button
                              onClick={() => handleDelete(game.name)}
                              style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                padding: '0.3rem',
                                cursor: 'pointer',
                                color: '#f87171',
                                fontSize: '0.75rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'games' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Live Game Catalog</h3>
              <button className="btn-add" onClick={() => handleOpenModal()}>+ Add New Game</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Game Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.filter(g =>
                  (g.name || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                  (g.questions && g.questions.some(q =>
                    (q.q || '').toLowerCase().includes((adminSearch || '').toLowerCase()) ||
                    (q.options || []).some(o => (o || '').toLowerCase().includes((adminSearch || '').toLowerCase())) ||
                    (q.exp && q.exp.toLowerCase().includes((adminSearch || '').toLowerCase()))
                  ))
                ).map(game => (
                  <tr key={game.name}>
                    <td><img src={game.image} className="admin-img-preview" alt="" /></td>
                    <td><strong>{game.name || game.title || 'Unnamed Game'}</strong></td>
                    <td>
                      <span style={{
                        background: game.isHidden ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: game.isHidden ? '#f87171' : '#4ade80',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        fontSize: '0.75rem',
                        fontWeight: '800'
                      }}>
                        {game.isHidden ? 'HIDDEN' : 'ACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)' }}
                          onClick={() => {
                            const updatedGames = games.map(g => g.name === game.name ? { ...g, isHidden: !g.isHidden } : g);
                            setGames(updatedGames);
                            addToast(`Game ${game.name} is now ${game.isHidden ? 'Visible' : 'Hidden'}`, 'success');
                          }}
                          title={game.isHidden ? "Unhide Game" : "Hide Game"}
                        >
                          {game.isHidden ? '👁️‍🗨️' : '👁️'}
                        </button>
                        <button className="btn-icon btn-edit" onClick={() => handleOpenModal(game)}>✏️</button>
                        {userRole !== 'sub_admin' && <button className="btn-icon btn-delete" onClick={() => handleDelete(game.name)}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Live Quizzes Catalog</h3>
              <button className="btn-add" onClick={() => handleOpenQuizModal()}>+ Create Quiz</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Questions</th>
                  <th>Difficulty</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdminQuizzes.map(quiz => (
                  <tr key={quiz.id}>
                    <td><strong>{quiz.title}</strong><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{quiz.category}</div></td>
                    <td>{quiz.questions.length}</td>
                    <td><span style={{ color: quiz.difficulty === 'Hard' ? '#ef4444' : quiz.difficulty === 'Medium' ? '#3b82f6' : '#10b981', fontWeight: 'bold' }}>{quiz.difficulty}</span></td>
                    <td><span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>ACTIVE</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon btn-edit" onClick={() => handleOpenQuizModal(quiz)}>✏️</button>
                        <button className="btn-icon btn-delete" onClick={() => handleDeleteQuiz(quiz.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>Registered Users</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Quizzes Played</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>AlexGamer</strong></td>
                  <td>alex@example.com</td>
                  <td><span style={{ color: '#3b82f6' }}>User</span></td>
                  <td>24</td>
                  <td><button className="btn-icon btn-delete">🗑️</button></td>
                </tr>
                <tr>
                  <td><strong>Guest_8492</strong></td>
                  <td>-</td>
                  <td><span style={{ color: 'var(--text-muted)' }}>Guest</span></td>
                  <td>{localStorage.getItem('quiznova_guest_count') || 0}</td>
                  <td><button className="btn-icon btn-delete">🗑️</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '1080px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }} onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.4rem', margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit, sans-serif' }}>
                  {editingGame ? '🎮 Edit Game Catalog & Questions' : '🎮 Add New Game with Custom Questions'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  ⚡ All-in-One Live Editor
                </span>
              </div>

              {/* Grid Wrapper: Form Editor on Left, Live Simulator on Right */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* Left Column: Zoomed-out Single-Page Form Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  {/* Compact Game Meta Row with Timer dropdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr 0.9fr', gap: '0.65rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Game Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Wordle"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Game Thumbnail</label>
                      <ImageUploadInput
                        compact={true}
                        value={formData.image}
                        onChange={val => setFormData({ ...formData, image: val })}
                        placeholder="Paste thumbnail URL or drop"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>Timer / Question</label>
                      <select
                        value={formData.timerSeconds !== undefined ? formData.timerSeconds : 15}
                        onChange={e => setFormData({ ...formData, timerSeconds: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white', fontSize: '0.82rem' }}
                      >
                        <option value={10}>⚡ 10s (Fast)</option>
                        <option value={15}>⏱️ 15s (Standard)</option>
                        <option value={30}>🧘 30s (Relaxed)</option>
                        <option value={60}>⏳ 60s (Extended)</option>
                        <option value={0}>♾️ Zen (Untimed)</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Navigator Tab Strip */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        ❓ Questions ({formData.questions ? formData.questions.length : 0})
                      </span>
                      <button
                        className="primary-btn"
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                        onClick={() => {
                          const newQList = [...(formData.questions || []), { q: '', options: ['', '', '', ''], ans: 0, image: '', exp: '' }];
                          setFormData({ ...formData, questions: newQList });
                          setPreviewQIdx(newQList.length - 1);
                        }}
                      >
                        ➕ Add Question
                      </button>
                    </div>

                    {/* Question Tabs Pill Bar */}
                    <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', alignItems: 'center' }}>
                      {formData.questions && formData.questions.map((q, qIdx) => {
                        const isActive = previewQIdx === qIdx;
                        const isFilled = (q.q || '').trim().length > 0;
                        return (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => setPreviewQIdx(qIdx)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '8px',
                              border: isActive ? '1.5px solid var(--accent-1)' : '1px solid var(--border-subtle)',
                              background: isActive ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
                              color: isActive ? '#fff' : (isFilled ? 'var(--text-main)' : 'var(--text-muted)'),
                              fontWeight: 'bold',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>Q{qIdx + 1}</span>
                            {isFilled && <span style={{ fontSize: '0.68rem', color: isActive ? '#fff' : '#10b981' }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Question Editor (Zoomed-out / Ultra Compact) */}
                  {formData.questions && formData.questions.length > 0 && formData.questions[previewQIdx] ? (
                    <div
                      style={{
                        background: 'rgba(56, 189, 248, 0.03)',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem'
                      }}
                    >
                      {/* Active Question Header with Reordering & Delete */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-1)' }}>
                            Editing Question {previewQIdx + 1} of {formData.questions.length}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                            👁️ Live in Preview
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {previewQIdx > 0 && (
                            <button
                              className="btn-icon"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.2rem 0.45rem', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQs = [...formData.questions];
                                [newQs[previewQIdx - 1], newQs[previewQIdx]] = [newQs[previewQIdx], newQs[previewQIdx - 1]];
                                setFormData({ ...formData, questions: newQs });
                                setPreviewQIdx(previewQIdx - 1);
                              }}
                              title="Move Question Up"
                            >⬆️ Up</button>
                          )}
                          {previewQIdx < formData.questions.length - 1 && (
                            <button
                              className="btn-icon"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.2rem 0.45rem', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const newQs = [...formData.questions];
                                [newQs[previewQIdx + 1], newQs[previewQIdx]] = [newQs[previewQIdx], newQs[previewQIdx + 1]];
                                setFormData({ ...formData, questions: newQs });
                                setPreviewQIdx(previewQIdx + 1);
                              }}
                              title="Move Question Down"
                            >⬇️ Down</button>
                          )}
                          <button
                            className="btn-icon btn-delete"
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '6px',
                              padding: '0.2rem 0.5rem',
                              color: '#f87171',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const filtered = formData.questions.filter((_, i) => i !== previewQIdx);
                              setFormData({ ...formData, questions: filtered });
                              setPreviewQIdx(Math.max(0, Math.min(previewQIdx, filtered.length - 1)));
                            }}
                            title="Delete this question"
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>

                      {/* Row 1: Question Text & Optional Image in 2 Columns */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Question Text</label>
                          <input
                            type="text"
                            value={formData.questions[previewQIdx].q}
                            onChange={e => {
                              const newQ = [...formData.questions];
                              newQ[previewQIdx].q = e.target.value;
                              setFormData({ ...formData, questions: newQ });
                            }}
                            placeholder="e.g. When is Independence Day?"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Optional Image (Above question)</label>
                          <ImageUploadInput
                            compact={true}
                            value={formData.questions[previewQIdx].image || ''}
                            onChange={val => {
                              const newQ = [...formData.questions];
                              newQ[previewQIdx].image = val;
                              setFormData({ ...formData, questions: newQ });
                            }}
                            placeholder="Paste image URL or drop..."
                          />
                        </div>
                      </div>

                      {/* Row 2: Options in a Compact 2x2 Grid */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: 0 }}>
                            Answer Options <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Select radio button for correct answer)</span>
                          </label>
                          {formData.questions[previewQIdx].options.length < 6 && (
                            <span
                              style={{ color: 'var(--accent-1)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => {
                                const newQ = [...formData.questions];
                                newQ[previewQIdx].options.push('');
                                setFormData({ ...formData, questions: newQ });
                              }}
                            >
                              + Add Option
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {formData.questions[previewQIdx].options.map((opt, oIdx) => {
                            const isCorrect = formData.questions[previewQIdx].ans === oIdx;
                            return (
                              <div
                                key={oIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                                  border: isCorrect ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-subtle)',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0.45rem'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`game_q_${previewQIdx}_ans`}
                                  checked={isCorrect}
                                  onChange={() => {
                                    const newQ = [...formData.questions];
                                    newQ[previewQIdx].ans = oIdx;
                                    setFormData({ ...formData, questions: newQ });
                                  }}
                                  title="Mark as correct answer"
                                  style={{ cursor: 'pointer', margin: 0 }}
                                />
                                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: isCorrect ? '#4ade80' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  #{oIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const newQ = [...formData.questions];
                                    newQ[previewQIdx].options[oIdx] = e.target.value;
                                    setFormData({ ...formData, questions: newQ });
                                  }}
                                  placeholder={`Option ${oIdx + 1}`}
                                  style={{ flex: 1, padding: '0.25rem 0.45rem', fontSize: '0.78rem', background: 'transparent', border: 'none', color: '#fff' }}
                                />
                                {formData.questions[previewQIdx].options.length > 2 && (
                                  <button
                                    type="button"
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.25rem' }}
                                    onClick={() => {
                                      const newQ = [...formData.questions];
                                      if (newQ[previewQIdx].ans === oIdx) newQ[previewQIdx].ans = 0;
                                      else if (newQ[previewQIdx].ans > oIdx) newQ[previewQIdx].ans -= 1;
                                      newQ[previewQIdx].options = newQ[previewQIdx].options.filter((_, i) => i !== oIdx);
                                      setFormData({ ...formData, questions: newQ });
                                    }}
                                    title="Delete option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Row 3: Explanation */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Explanation (shown to player after answering)</label>
                        <input
                          type="text"
                          value={formData.questions[previewQIdx].exp || ''}
                          onChange={e => {
                            const newQ = [...formData.questions];
                            newQ[previewQIdx].exp = e.target.value;
                            setFormData({ ...formData, questions: newQ });
                          }}
                          placeholder="Why is this answer correct?"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No questions customized yet. Click <strong>"➕ Add Question"</strong> above to start!
                    </div>
                  )}

                </div>

                {/* Right Column: 📱 Live Interactive Simulator Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ marginBottom: '0.5rem', width: '100%', textAlign: 'center' }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }}>📱 Live Game Simulator</h4>
                    <p style={{ margin: '0.1rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Real-time gameplay view</p>
                  </div>

                  {/* Smartphone simulated bezel frame */}
                  <div style={{
                    width: '270px',
                    height: '420px',
                    border: '10px solid #1e293b',
                    borderRadius: '34px',
                    background: '#030712',
                    boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0,0,0,0.8)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    {/* Speaker notch */}
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '90px',
                      height: '14px',
                      background: '#1e293b',
                      borderBottomLeftRadius: '12px',
                      borderBottomRightRadius: '12px',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ width: '30px', height: '2px', background: '#475569', borderRadius: '2px' }}></div>
                    </div>

                    {/* Simulated status bar */}
                    <div style={{
                      height: '28px',
                      padding: '6px 1.2rem 0 1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      zIndex: 5
                    }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        <span>📶</span>
                        <span>🔋</span>
                      </div>
                    </div>

                    {/* Simulated screen body */}
                    <div style={{
                      flex: 1,
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                      background: 'radial-gradient(circle at top, #0f172a, #020617)',
                      position: 'relative'
                    }}>
                      {formData.questions && formData.questions.length > 0 && formData.questions[previewQIdx] ? (
                        <>
                          {/* Top Bar inside simulator */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.35rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🎮 {formData.name || 'Game'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: 'var(--accent-1)' }}>
                              <span style={{ background: 'var(--accent-gradient)', color: '#fff', minWidth: '14px', height: '14px', padding: '0 3px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 'bold' }}>
                                {formData.timerSeconds === 0 ? '♾️' : `${formData.timerSeconds !== undefined ? formData.timerSeconds : 15}s`}
                              </span>
                              <span>{previewQIdx + 1} of {formData.questions.length}</span>
                            </div>
                          </div>

                          {/* Image inside simulator */}
                          {formData.questions[previewQIdx].image ? (
                            <div style={{ width: '100%', height: '85px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <img
                                src={formData.questions[previewQIdx].image}
                                alt="Simulator Context"
                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              />
                            </div>
                          ) : null}

                          {/* Question Text inside simulator */}
                          <div style={{
                            padding: '0.5rem 0.6rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.74rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: '0.5rem',
                            lineHeight: '1.25'
                          }}>
                            {formData.questions[previewQIdx].q || 'Type question text on the left...'}
                          </div>

                          {/* Option Pills inside simulator */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {formData.questions[previewQIdx].options.map((opt, oIdx) => {
                              const isCorrect = formData.questions[previewQIdx].ans === oIdx;
                              return (
                                <div
                                  key={oIdx}
                                  style={{
                                    width: '100%',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '6px',
                                    background: isCorrect ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255,255,255,0.05)'}`,
                                    color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.8)',
                                    fontSize: '0.7rem',
                                    fontWeight: isCorrect ? '700' : '500',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                                    {opt || `Option ${oIdx + 1}`}
                                  </span>
                                  {isCorrect && <span style={{ fontSize: '0.65rem' }}>✓</span>}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation inside simulator */}
                          {formData.questions[previewQIdx].exp && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.05)',
                              border: '1px dashed rgba(56, 189, 248, 0.2)',
                              color: 'rgba(255,255,255,0.7)',
                              fontSize: '0.62rem',
                              lineHeight: '1.2'
                            }}>
                              {formData.questions[previewQIdx].exp}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', padding: '1rem', gap: '0.5rem' }}>
                          <span style={{ fontSize: '2rem' }}>🚀</span>
                          <span>Add questions on the left to see the live simulator!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Simulator Navigation Buttons below Bezel */}
                  {formData.questions && formData.questions.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => setPreviewQIdx(Math.max(0, previewQIdx - 1))}
                        disabled={previewQIdx === 0}
                        style={{
                          padding: '0.25rem 0.65rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          opacity: previewQIdx === 0 ? 0.3 : 1
                        }}
                      >
                        ◀ Prev
                      </button>
                      <button
                        onClick={() => setPreviewQIdx(Math.min(formData.questions.length - 1, previewQIdx + 1))}
                        disabled={previewQIdx === formData.questions.length - 1}
                        style={{
                          padding: '0.25rem 0.65rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          opacity: previewQIdx === formData.questions.length - 1 ? 0.3 : 1
                        }}
                      >
                        Next ▶
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer" style={{ padding: '0.75rem 0 0 0', borderTop: '1px solid var(--border-subtle)', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                <button className="btn-save" onClick={handleSave} style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>Save Game & Close</button>
              </div>
            </div>
          </div>
        )}

        {isQuizModalOpen && (
          <div className="modal-overlay">
            <div className="admin-modal" style={{ maxWidth: '900px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '1.25rem 1.5rem' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.4rem', margin: 0, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Outfit, sans-serif' }}>
                  {editingQuiz ? '📝 Edit Quiz Builder' : '📝 Create New Quiz'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  ⚡ Single Screen Editor
                </span>
              </div>

              {/* Compact Quiz Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Quiz Title</label>
                  <input type="text" value={quizFormData.title} onChange={e => setQuizFormData({ ...quizFormData, title: e.target.value })} placeholder="e.g. Science Trivia" style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Category</label>
                  <select value={quizFormData.category} onChange={e => setQuizFormData({ ...quizFormData, category: e.target.value })} style={{ width: '100%', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white', fontSize: '0.8rem' }}>
                    <option value="General">General</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Geography">Geography</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Animals">Animals</option>
                    <option value="Technology">Technology</option>
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                    <option value="Mythology">Mythology</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Difficulty</label>
                  <select value={quizFormData.difficulty} onChange={e => setQuizFormData({ ...quizFormData, difficulty: e.target.value })} style={{ width: '100%', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white', fontSize: '0.8rem' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Timer / Q</label>
                  <select
                    value={quizFormData.timerSeconds !== undefined ? quizFormData.timerSeconds : 15}
                    onChange={e => setQuizFormData({ ...quizFormData, timerSeconds: Number(e.target.value) })}
                    style={{ width: '100%', padding: '0.35rem 0.55rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-main)', color: 'white', fontSize: '0.8rem' }}
                  >
                    <option value={10}>⚡ 10s (Fast)</option>
                    <option value={15}>⏱️ 15s (Standard)</option>
                    <option value={30}>🧘 30s (Relaxed)</option>
                    <option value={60}>⏳ 60s (Extended)</option>
                    <option value={0}>♾️ Zen (Untimed)</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2', marginBottom: 0, marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Description</label>
                  <input type="text" value={quizFormData.desc || ''} onChange={e => setQuizFormData({ ...quizFormData, desc: e.target.value })} placeholder="e.g. Test your basic science knowledge" style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem' }} />
                </div>
                <div className="form-group" style={{ gridColumn: '3 / span 2', marginBottom: 0, marginTop: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Thumbnail URL</label>
                  <ImageUploadInput compact={true} value={quizFormData.image || ''} onChange={val => setQuizFormData({ ...quizFormData, image: val })} placeholder="https://... or drop" />
                </div>
              </div>

              {/* Question Navigation Tabs Strip */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--accent-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ❓ Quiz Questions ({quizFormData.questions ? quizFormData.questions.length : 0})
                  </span>
                  <button
                    className="primary-btn"
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                    onClick={() => {
                      const newQs = [...quizFormData.questions, { q: '', options: ['', '', '', ''], ans: 0, image: '', explanation: '' }];
                      setQuizFormData({ ...quizFormData, questions: newQs });
                      setActiveQuizQIdx(newQs.length - 1);
                    }}
                  >
                    ➕ Add Question
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.25rem', alignItems: 'center' }}>
                  {quizFormData.questions.map((q, qIdx) => {
                    const isActive = activeQuizQIdx === qIdx;
                    const isFilled = (q.q || '').trim().length > 0;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setActiveQuizQIdx(qIdx)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          border: isActive ? '1.5px solid var(--accent-1)' : '1px solid var(--border-subtle)',
                          background: isActive ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.04)',
                          color: isActive ? '#fff' : (isFilled ? 'var(--text-main)' : 'var(--text-muted)'),
                          fontWeight: 'bold',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>Q{qIdx + 1}</span>
                        {isFilled && <span style={{ fontSize: '0.68rem', color: isActive ? '#fff' : '#10b981' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Quiz Question Card (Zoomed-out / Ultra-compact) */}
              {quizFormData.questions && quizFormData.questions.length > 0 && quizFormData.questions[activeQuizQIdx] ? (
                <div
                  style={{
                    background: 'rgba(56, 189, 248, 0.03)',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: '1.5px solid rgba(56, 189, 248, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-1)' }}>
                      Editing Question {activeQuizQIdx + 1} of {quizFormData.questions.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {activeQuizQIdx > 0 && (
                        <button
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.2rem 0.45rem', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                          onClick={() => {
                            const newQs = [...quizFormData.questions];
                            [newQs[activeQuizQIdx - 1], newQs[activeQuizQIdx]] = [newQs[activeQuizQIdx], newQs[activeQuizQIdx - 1]];
                            setQuizFormData({ ...quizFormData, questions: newQs });
                            setActiveQuizQIdx(activeQuizQIdx - 1);
                          }}
                          title="Move Question Up"
                        >⬆️ Up</button>
                      )}
                      {activeQuizQIdx < quizFormData.questions.length - 1 && (
                        <button
                          className="btn-icon"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.2rem 0.45rem', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                          onClick={() => {
                            const newQs = [...quizFormData.questions];
                            [newQs[activeQuizQIdx + 1], newQs[activeQuizQIdx]] = [newQs[activeQuizQIdx], newQs[activeQuizQIdx + 1]];
                            setQuizFormData({ ...quizFormData, questions: newQs });
                            setActiveQuizQIdx(activeQuizQIdx + 1);
                          }}
                          title="Move Question Down"
                        >⬇️ Down</button>
                      )}
                      <button
                        className="btn-icon btn-delete"
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '6px',
                          padding: '0.2rem 0.5rem',
                          color: '#f87171',
                          fontSize: '0.72rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const filtered = quizFormData.questions.filter((_, i) => i !== activeQuizQIdx);
                          setQuizFormData({ ...quizFormData, questions: filtered });
                          setActiveQuizQIdx(Math.max(0, Math.min(activeQuizQIdx, filtered.length - 1)));
                        }}
                        title="Delete question"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>

                  {/* Row 1: Question Text & Image */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Question Text</label>
                      <input
                        type="text"
                        value={quizFormData.questions[activeQuizQIdx].q}
                        onChange={e => {
                          const newQ = [...quizFormData.questions];
                          newQ[activeQuizQIdx].q = e.target.value;
                          setQuizFormData({ ...quizFormData, questions: newQ });
                        }}
                        placeholder="Enter question..."
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Optional Image (Drop or URL)</label>
                      <ImageUploadInput
                        compact={true}
                        value={quizFormData.questions[activeQuizQIdx].image || ''}
                        onChange={val => {
                          const newQ = [...quizFormData.questions];
                          newQ[activeQuizQIdx].image = val;
                          setQuizFormData({ ...quizFormData, questions: newQ });
                        }}
                        placeholder="https://... or drop image"
                      />
                    </div>
                  </div>

                  {/* Row 2: Options in 2x2 Grid */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: 0 }}>
                        Options <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>(Select radio button for correct answer)</span>
                      </label>
                      {quizFormData.questions[activeQuizQIdx].options.length < 6 && (
                        <span
                          style={{ color: 'var(--accent-1)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                          onClick={() => {
                            const newQ = [...quizFormData.questions];
                            newQ[activeQuizQIdx].options.push('');
                            setQuizFormData({ ...quizFormData, questions: newQ });
                          }}
                        >
                          + Add Option
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {quizFormData.questions[activeQuizQIdx].options.map((opt, oIdx) => {
                        const isCorrect = quizFormData.questions[activeQuizQIdx].ans === oIdx;
                        return (
                          <div
                            key={oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                              border: isCorrect ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '0.25rem 0.45rem'
                            }}
                          >
                            <input
                              type="radio"
                              name={`quiz_q_${activeQuizQIdx}_ans`}
                              checked={isCorrect}
                              onChange={() => {
                                const newQ = [...quizFormData.questions];
                                newQ[activeQuizQIdx].ans = oIdx;
                                setQuizFormData({ ...quizFormData, questions: newQ });
                              }}
                              title="Mark as correct answer"
                              style={{ cursor: 'pointer', margin: 0 }}
                            />
                            <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: isCorrect ? '#4ade80' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              #{oIdx + 1}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const newQ = [...quizFormData.questions];
                                newQ[activeQuizQIdx].options[oIdx] = e.target.value;
                                setQuizFormData({ ...quizFormData, questions: newQ });
                              }}
                              placeholder={`Option ${oIdx + 1}`}
                              style={{ flex: 1, padding: '0.25rem 0.45rem', fontSize: '0.78rem', background: 'transparent', border: 'none', color: '#fff' }}
                            />
                            {quizFormData.questions[activeQuizQIdx].options.length > 2 && (
                              <button
                                type="button"
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.25rem' }}
                                onClick={() => {
                                  const newQ = [...quizFormData.questions];
                                  if (newQ[activeQuizQIdx].ans === oIdx) newQ[activeQuizQIdx].ans = 0;
                                  else if (newQ[activeQuizQIdx].ans > oIdx) newQ[activeQuizQIdx].ans -= 1;
                                  newQ[activeQuizQIdx].options = newQ[activeQuizQIdx].options.filter((_, i) => i !== oIdx);
                                  setQuizFormData({ ...quizFormData, questions: newQ });
                                }}
                                title="Delete option"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3: Explanation */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 'bold' }}>Explanation (shown after answer)</label>
                    <input
                      type="text"
                      value={quizFormData.questions[activeQuizQIdx].explanation || ''}
                      onChange={e => {
                        const newQ = [...quizFormData.questions];
                        newQ[activeQuizQIdx].explanation = e.target.value;
                        setQuizFormData({ ...quizFormData, questions: newQ });
                      }}
                      placeholder="Why is this the correct answer?"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No questions in this quiz yet. Click <strong>"➕ Add Question"</strong> above to start!
                </div>
              )}

              {/* Modal Footer */}
              <div className="modal-footer" style={{ padding: '0.75rem 0 0 0', borderTop: '1px solid var(--border-subtle)', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="btn-cancel" onClick={() => setIsQuizModalOpen(false)} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Cancel</button>
                <button className="btn-save" onClick={handleSaveQuiz} style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}>Save Quiz & Close</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'question_bank' && (() => {
          const allQuestions = [];
          quizzesList.forEach(q => {
            if (q.questions) {
              q.questions.forEach((question, idx) => {
                allQuestions.push({ ...question, source: q.title, sourceId: q.id, type: 'Quiz', idx });
              });
            }
          });
          games.forEach(g => {
            if (g.questions) {
              g.questions.forEach((question, idx) => {
                allQuestions.push({ ...question, source: g.name, type: 'Game', idx });
              });
            }
          });

          return (
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>All Questions Database ({allQuestions.length})</h3>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                  />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Question Text</th>
                      <th>Source</th>
                      <th>Correct Answer</th>
                      <th>Options Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allQuestions
                      .filter(q => (q.q || '').toLowerCase().includes((adminSearch || '').toLowerCase()) || (q.source || '').toLowerCase().includes((adminSearch || '').toLowerCase()))
                      .map((q, i) => (
                        <tr key={i}>
                          <td style={{ maxWidth: '300px' }}>
                            <strong>{q.q || 'Untitled Question'}</strong>
                            {q.image && <div style={{ fontSize: '0.75rem', color: 'var(--accent-1)', marginTop: '0.2rem' }}>🖼️ Has Image Attachment</div>}
                          </td>
                          <td>
                            <span style={{ background: q.type === 'Game' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: q.type === 'Game' ? '#38bdf8' : '#10b981', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>{q.type}</span>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>{q.source}</div>
                          </td>
                          <td>
                            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.3rem 0.6rem', borderRadius: '6px', display: 'inline-block', fontSize: '0.85rem' }}>
                              ✓ {q.options[q.ans]}
                            </div>
                          </td>
                          <td>{q.options.filter(o => o).length} Options</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {allQuestions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No questions found. Add some questions to your games or quizzes first!
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Live Database Mode Card */}
            <div style={{ background: 'var(--glass-bg)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>System Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <span style={{ 
                    display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', 
                    background: dbData.databaseStatus?.includes('Online') ? '#10b981' : '#f59e0b',
                    boxShadow: dbData.databaseStatus?.includes('Online') ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
                  }}></span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {dbData.databaseStatus || 'Offline'} ({dbData.databaseEngine || 'Mock Engine'})
                  </span>
                </div>
              </div>
              <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={fetchDbData} disabled={loadingDb}>
                {loadingDb ? 'Loading...' : '🔄 Refresh Live Data'}
              </button>
            </div>

            {/* Users Table */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Registered Accounts ({dbData.users?.length || 0})</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User / Initials</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Total XP</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, idx) => (
                      <tr key={user._id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', flexShrink: 0 }}>
                              {user.avatar && user.avatar.startsWith('http') ? (
                                <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none'; e.target.parentNode.innerText = user.username ? user.username.substring(0,2).toUpperCase() : 'US'; }} />
                              ) : (
                                user.avatar || (user.username ? user.username.substring(0, 2).toUpperCase() : 'US')
                              )}
                            </div>
                            <strong>{user.username}</strong>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{ 
                            background: user.role === 'admin' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                            color: user.role === 'admin' ? '#10b981' : '#3b82f6', 
                            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' 
                          }}>{(user.role || 'user').toUpperCase()}</span>
                        </td>
                        <td>{user.totalXP !== undefined ? user.totalXP.toLocaleString() : 0} XP</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon btn-delete" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }} onClick={() => handleDeleteUser(user._id || user.email)} title="Delete User">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No user accounts registered. Try registering a user to see them populate here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quiz Play Log History */}
            <div className="admin-table-container">
              <div className="admin-table-header">
                <h3>Live Quiz Completion Logs ({dbData.history?.length || 0})</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID / Account</th>
                    <th>Quiz Title</th>
                    <th>Accuracy</th>
                    <th>XP Gained</th>
                    <th>Max Streak</th>
                    <th>Completed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((log, idx) => (
                      <tr key={log._id || idx}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.userId}</td>
                        <td><strong>{log.quizTitle}</strong></td>
                        <td>{log.accuracy}%</td>
                        <td style={{ color: 'var(--accent-1)', fontWeight: 'bold' }}>+{log.xpEarned} XP</td>
                        <td>{log.maxStreak}x</td>
                        <td>{new Date(log.date || log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No quiz completions recorded yet. Complete a quiz to watch logs sync!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="admin-table-container">
            <h3>Analytics Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
              <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>User Growth (Last 6 Months)</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '10px', marginTop: '1rem' }}>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '40%', borderRadius: '4px 4px 0 0', opacity: 0.7 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '50%', borderRadius: '4px 4px 0 0', opacity: 0.7 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '65%', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '80%', borderRadius: '4px 4px 0 0', opacity: 0.9 }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '95%', borderRadius: '4px 4px 0 0' }}></div>
                  <div style={{ flex: 1, background: 'var(--accent-1)', height: '100%', borderRadius: '4px 4px 0 0', boxShadow: '0 0 10px var(--accent-1)' }}></div>
                </div>
              </div>
              <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Most Popular Categories</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {(() => {
                    // Fix #7: Analytics and reports data is static not dynamic
                    const allQuizzes = dbData.quizzes && dbData.quizzes.length > 0 ? dbData.quizzes : quizzesList;
                    const categoryCounts = allQuizzes.reduce((acc, q) => {
                      acc[q.category] = (acc[q.category] || 0) + 1;
                      return acc;
                    }, {});
                    const total = allQuizzes.length || 1;
                    const sorted = Object.entries(categoryCounts).sort((a,b) => b[1]-a[1]).slice(0,3);
                    const colors = ['#3b82f6', '#10b981', '#f59e0b'];
                    return sorted.map(([cat, count], i) => {
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={cat}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}><span>{cat}</span><span>{pct}%</span></div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}><div style={{ width: `${pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: '4px' }}></div></div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-table-container">
            <h3>Platform Settings</h3>
            <div style={{ maxWidth: '600px', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Platform Name</label>
                <input type="text" defaultValue="KMS Academy" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div className="form-group">
                <label>Support Email</label>
                <input type="email" defaultValue="support@kmsacademy.edu" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Theme Color</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the platform's primary accent color</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    { color1: '#38bdf8', color2: '#818cf8', name: 'Blue' },
                    { color1: '#10b981', color2: '#34d399', name: 'Green' },
                    { color1: '#c084fc', color2: '#f472b6', name: 'Purple' },
                    { color1: '#fb923c', color2: '#facc15', name: 'Orange' },
                    { color1: '#f43f5e', color2: '#fb7185', name: 'Rose' }
                  ].map(theme => (
                    <div
                      key={theme.name}
                      onClick={() => {
                        document.documentElement.style.setProperty('--accent-1', theme.color1);
                        document.documentElement.style.setProperty('--accent-2', theme.color2);
                        localStorage.setItem('quiznova_theme', JSON.stringify({ color1: theme.color1, color2: theme.color2 }));
                        addToast(`Theme changed to ${theme.name}`, 'success');
                      }}
                      title={theme.name}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`,
                        border: '2px solid rgba(255,255,255,0.2)',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    ></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <strong style={{ display: 'block' }}>2nd Title Section</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the title of the Editors' Picks section on the homepage</span>
                </div>
                <input
                  type="text"
                  value={editorsPicksTitle}
                  onChange={e => {
                    setEditorsPicksTitle(e.target.value);
                    localStorage.setItem('quiznova_editors_picks_title', e.target.value);
                  }}
                  style={{ width: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <strong style={{ display: 'block' }}>3rd Title Section</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize the title of the Popular section on the homepage</span>
                </div>
                <input
                  type="text"
                  value={popularTitle}
                  onChange={e => {
                    setPopularTitle(e.target.value);
                    localStorage.setItem('quiznova_popular_title', e.target.value);
                  }}
                  style={{ width: '200px', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Enable Public Registration</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Allow new users to sign up automatically</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked onChange={() => { }} />
                  <span className="slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Show Featured Games (Bottom Grid)</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toggle visibility of the Featured Games grid at the bottom of the homepage</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={showFeaturedGames} onChange={(e) => { setShowFeaturedGames(e.target.checked); localStorage.setItem('quiznova_show_featured', e.target.checked); }} />
                  <span className="slider"></span>
                </label>
              </div>

              {/* NEW: Manage 4 Big Featured Quizzes */}
              <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)', padding: '1rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>🌟 Main Header Quizzes (The 4 Big Cards)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Manage the 4 large featured quizzes that appear at the top of the homepage.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[0, 1, 2, 3].map((index) => {
                    const currentQuiz = (featuredQuizzes || [])[index] || {};
                    return (
                      <div key={index} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--accent-1)' }}>Featured Slot {index + 1}</strong>
                        
                        <select
                          value={currentQuiz.id || currentQuiz._id || currentQuiz.title || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (!selectedId) {
                               const newArr = [...(featuredQuizzes || [])];
                               if (newArr.length > index) newArr.splice(index, 1);
                               setFeaturedQuizzes(newArr);
                               return;
                            }
                            const sourceObj = quizzesList.find(q => (q.id && q.id.toString() === selectedId) || (q._id && q._id === selectedId) || q.title === selectedId) 
                                           || games.find(g => g.name === selectedId || (g.id && g.id.toString() === selectedId));
                            
                            if (sourceObj) {
                               const newArr = [...(featuredQuizzes || [])];
                               while (newArr.length <= index) newArr.push({});
                               newArr[index] = { ...sourceObj, title: sourceObj.title || sourceObj.name, id: sourceObj.id || sourceObj._id || sourceObj.name };
                               setFeaturedQuizzes(newArr);
                            }
                          }}
                          style={{ padding: '0.5rem', borderRadius: '4px', background: 'var(--glass-bg)', color: 'white', border: '1px solid var(--border-subtle)' }}
                        >
                          <option value="">-- Empty Slot --</option>
                          <optgroup label="Quizzes">
                            {quizzesList.map(q => <option key={q._id || q.id || q.title} value={q._id || q.id || q.title}>{q.title}</option>)}
                          </optgroup>
                          <optgroup label="Games">
                            {games.filter(g => !g.isHidden).map(g => <option key={g._id || g.id || g.name} value={g._id || g.id || g.name}>{g.name || g.title}</option>)}
                          </optgroup>
                        </select>

                        {currentQuiz.image && (
                          <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                            <img src={currentQuiz.image} alt={currentQuiz.title} style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '0.5rem', borderRadius: '0 0 4px 4px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentQuiz.title}</span>
                            </div>
                          </div>
                        )}
                        {currentQuiz.title && (
                          <button 
                            onClick={() => {
                              // Auto-navigate to either game or quiz editor based on what it is
                              if (games.some(g => (g.name === currentQuiz.title || g.id === currentQuiz.id))) {
                                const game = games.find(g => (g.name === currentQuiz.title || g.id === currentQuiz.id));
                                handleOpenModal(game);
                              } else {
                                handleOpenQuizModal(currentQuiz);
                              }
                            }}
                            style={{ marginTop: 'auto', padding: '0.4rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.25rem' }}
                          >
                            ⚙️ Open Original Editor
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '2rem' }}>🔄</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Missing a quiz?</strong>
                    <button 
                      onClick={() => {
                        if(window.confirm('Restore default featured quizzes? This will overwrite your current featured ones.')) {
                           if(onRestoreFeaturedQuizzes) onRestoreFeaturedQuizzes();
                           // Also update local admin table state so it doesn't stay out of sync
                           // We can just rely on the parent state trickle down but quizzesList might need a refresh.
                        }
                      }}
                      style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      Restore Defaults
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <strong style={{ display: 'block' }}>Maintenance Mode</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Take the site offline for updates</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" onChange={() => { }} />
                  <span className="slider"></span>
                </label>
              </div>
              <button className="primary-btn" onClick={() => addToast('Settings saved successfully', 'success')} style={{ marginTop: '1rem' }}>Save Settings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
