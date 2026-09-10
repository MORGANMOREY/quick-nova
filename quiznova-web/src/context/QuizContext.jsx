import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  GAMES_DATA,
  FEATURED_QUIZZES,
  NEW_QUIZZES,
  EDITORS_PICKS_DATA,
  POPULAR_DATA,
  EDITORS_PICKS_QUESTIONS,
  POPULAR_QUESTIONS
} from '../data/defaultQuizzes';
import { quizApi } from '../services/api';
import { useToast } from './ToastContext';

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  const { addToast } = useToast();

  const [games, setGames] = useState(() => {
    try {
      const saved = localStorage.getItem('quiznova_games');
      return saved ? JSON.parse(saved) : GAMES_DATA;
    } catch {
      return GAMES_DATA;
    }
  });

  const [featuredQuizzes, setFeaturedQuizzes] = useState(() => {
    try {
      const saved = localStorage.getItem('quiznova_featured_quizzes');
      return saved ? JSON.parse(saved) : FEATURED_QUIZZES;
    } catch {
      return FEATURED_QUIZZES;
    }
  });

  const [newQuizzes, setNewQuizzes] = useState(() => {
    try {
      const saved = localStorage.getItem('quiznova_new_quizzes');
      return saved ? JSON.parse(saved) : NEW_QUIZZES;
    } catch {
      return NEW_QUIZZES;
    }
  });

  const [editorsPicksTitle, setEditorsPicksTitle] = useState(() => {
    return localStorage.getItem('quiznova_editors_picks_title') || "Editor's Picks";
  });

  const [popularTitle, setPopularTitle] = useState(() => {
    return localStorage.getItem('quiznova_popular_title') || 'Popular Right Now';
  });

  const [showFeaturedGames, setShowFeaturedGames] = useState(() => {
    return localStorage.getItem('quiznova_show_featured_games') !== 'false';
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('quiznova_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('quiznova_featured_quizzes', JSON.stringify(featuredQuizzes));
  }, [featuredQuizzes]);

  useEffect(() => {
    localStorage.setItem('quiznova_new_quizzes', JSON.stringify(newQuizzes));
  }, [newQuizzes]);

  useEffect(() => {
    localStorage.setItem('quiznova_editors_picks_title', editorsPicksTitle);
  }, [editorsPicksTitle]);

  useEffect(() => {
    localStorage.setItem('quiznova_popular_title', popularTitle);
  }, [popularTitle]);

  useEffect(() => {
    localStorage.setItem('quiznova_show_featured_games', String(showFeaturedGames));
  }, [showFeaturedGames]);

  // Fetch quizzes from backend and merge safely
  const loadBackendQuizzes = useCallback(async () => {
    try {
      const data = await quizApi.getQuizzes();
      if (Array.isArray(data) && data.length > 0) {
        const featuredFromBackend = data.filter((q) => q.isFeatured);
        const latestFromBackend = data.filter(
          (q) => q.isNewQuiz || (!q.isFeatured && !q.isEditorsPick && !q.isPopular)
        );

        if (featuredFromBackend.length > 0) {
          setFeaturedQuizzes((prev) => {
            const map = new Map();
            featuredFromBackend.forEach((q) => {
              const key = (q.title || '').trim().toLowerCase();
              if (key) map.set(key, q);
            });
            prev.forEach((q) => {
              const key = (q.title || '').trim().toLowerCase();
              if (key) {
                const backendItem = map.get(key);
                if (backendItem) {
                  map.set(key, {
                    ...backendItem,
                    ...q,
                    questions:
                      q.questions && q.questions.length > 0 ? q.questions : backendItem.questions,
                  });
                } else {
                  map.set(key, q);
                }
              }
            });
            return Array.from(map.values());
          });
        }

        if (latestFromBackend.length > 0) {
          setNewQuizzes((prev) => {
            const map = new Map();
            latestFromBackend.forEach((q) => {
              const key = (q.title || '').trim().toLowerCase();
              if (key) map.set(key, q);
            });
            prev.forEach((q) => {
              const key = (q.title || '').trim().toLowerCase();
              if (key) {
                const backendItem = map.get(key);
                if (backendItem) {
                  map.set(key, {
                    ...backendItem,
                    ...q,
                    questions:
                      q.questions && q.questions.length > 0 ? q.questions : backendItem.questions,
                  });
                } else {
                  map.set(key, q);
                }
              }
            });
            return Array.from(map.values());
          });
        }

        // Sync question bank into games state
        setGames((prevGames) => {
          return prevGames.map((g) => {
            const match = data.find(
              (q) =>
                (q.title || '').trim().toLowerCase() ===
                (g.name || g.title || '').trim().toLowerCase()
            );
            if (
              match &&
              Array.isArray(match.questions) &&
              match.questions.length > 0 &&
              (!g.questions || g.questions.length === 0)
            ) {
              return {
                ...g,
                questions: match.questions,
                timerSeconds:
                  match.timerSeconds !== undefined ? match.timerSeconds : g.timerSeconds,
              };
            }
            return g;
          });
        });
      }
    } catch (err) {
      console.warn('Error fetching backend quizzes, using local cached seeds:', err.message);
    }
  }, []);

  useEffect(() => {
    loadBackendQuizzes();
  }, [loadBackendQuizzes]);

  // Handler for adding a new quiz
  const handleQuizAdded = async (newQuizObj) => {
    const formattedQuestions = Array.isArray(newQuizObj.questions) ? newQuizObj.questions : [];
    newQuizObj.questions = formattedQuestions;

    if (newQuizObj.isFeatured) {
      setFeaturedQuizzes((prev) => {
        const filtered = prev.filter(
          (item) =>
            item.id !== newQuizObj.id &&
            item._id !== newQuizObj._id &&
            (item.title || '').toLowerCase() !== (newQuizObj.title || '').toLowerCase()
        );
        return [newQuizObj, ...filtered];
      });
    } else {
      setNewQuizzes((prev) => {
        const filtered = prev.filter(
          (item) =>
            item.id !== newQuizObj.id &&
            item._id !== newQuizObj._id &&
            (item.title || '').toLowerCase() !== (newQuizObj.title || '').toLowerCase()
        );
        return [newQuizObj, ...filtered];
      });
    }

    try {
      const savedQuiz = await quizApi.createQuiz(newQuizObj);
      if (savedQuiz) {
        setNewQuizzes((prev) => {
          const filtered = prev.filter(
            (item) =>
              item.id !== newQuizObj.id &&
              item._id !== savedQuiz._id &&
              (item.title || '').toLowerCase() !== (savedQuiz.title || '').toLowerCase()
          );
          return [savedQuiz, ...filtered];
        });
        setGames((prev) =>
          prev.map((g) =>
            (g.name || g.title || '').toLowerCase() === (savedQuiz.title || '').toLowerCase()
              ? { ...g, _id: savedQuiz._id, id: savedQuiz._id, questions: savedQuiz.questions }
              : g
          )
        );
        addToast(`Saved "${savedQuiz.title}" to database!`, 'success');
        return;
      }
    } catch (err) {
      console.error('Failed to sync new quiz to server database:', err);
    }

    addToast(`Saved "${newQuizObj.title}" locally`, 'success');
  };

  // Handler for updating a quiz
  const handleQuizUpdated = async (updatedQuiz) => {
    const formattedQuestions = Array.isArray(updatedQuiz.questions) ? updatedQuiz.questions : [];
    const normalized = {
      ...updatedQuiz,
      questions: formattedQuestions,
    };

    setNewQuizzes((prev) =>
      prev.map((q) =>
        q.id === normalized.id ||
        q._id === normalized._id ||
        (q.title || '').toLowerCase() === (normalized.title || '').toLowerCase()
          ? { ...q, ...normalized }
          : q
      )
    );
    setFeaturedQuizzes((prev) =>
      prev.map((q) =>
        q.id === normalized.id ||
        q._id === normalized._id ||
        (q.title || '').toLowerCase() === (normalized.title || '').toLowerCase()
          ? { ...q, ...normalized }
          : q
      )
    );
    setGames((prev) =>
      prev.map((g) =>
        g.id === normalized.id ||
        g._id === normalized._id ||
        (g.name || g.title || '').toLowerCase() === (normalized.title || '').toLowerCase()
          ? { ...g, ...normalized, name: normalized.title || g.name }
          : g
      )
    );

    const dbId = normalized._id || normalized.id;
    if (typeof dbId === 'string' && dbId.length > 10 && !dbId.startsWith('mock_')) {
      try {
        await quizApi.updateQuiz(dbId, normalized);
        addToast(`Synced "${normalized.title}" edits to database!`, 'success');
        return;
      } catch (err) {
        console.error('Failed to update quiz on server database:', err);
      }
    } else {
      try {
        const saved = await quizApi.createQuiz(normalized);
        if (saved) {
          setNewQuizzes((prev) =>
            prev.map((q) =>
              (q.title || '').toLowerCase() === (saved.title || '').toLowerCase() ? saved : q
            )
          );
          addToast(`Synced "${normalized.title}" to database!`, 'success');
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    addToast(`Updated "${normalized.title}" locally!`, 'success');
  };

  // Handler for deleting a quiz
  const handleQuizDeleted = async (id) => {
    setNewQuizzes((prev) => prev.filter((q) => q.id !== id && q._id !== id));
    setFeaturedQuizzes((prev) => prev.filter((q) => q.id !== id && q._id !== id));

    if (typeof id === 'string' && id.length > 10 && !id.startsWith('mock_')) {
      try {
        await quizApi.deleteQuiz(id);
        addToast('Quiz deleted from database.', 'error');
      } catch (err) {
        console.error('Failed to delete quiz on server:', err);
      }
    }
  };

  const handleRestoreFeaturedQuizzes = () => {
    setFeaturedQuizzes(FEATURED_QUIZZES);
    localStorage.removeItem('quiznova_featured_quizzes');
    addToast('Restored default featured quizzes!', 'success');
  };

  // Find a quiz by ID or Title across all collections
  const findQuizByIdOrTitle = useCallback(
    (identifier) => {
      if (!identifier) return null;
      const idStr = String(identifier).toLowerCase();

      // Check featured
      const foundInFeatured = featuredQuizzes.find(
        (q) =>
          String(q.id).toLowerCase() === idStr ||
          String(q._id).toLowerCase() === idStr ||
          (q.title || '').toLowerCase() === idStr ||
          (q.name || '').toLowerCase() === idStr
      );
      if (foundInFeatured) return foundInFeatured;

      // Check newQuizzes
      const foundInNew = newQuizzes.find(
        (q) =>
          String(q.id).toLowerCase() === idStr ||
          String(q._id).toLowerCase() === idStr ||
          (q.title || '').toLowerCase() === idStr ||
          (q.name || '').toLowerCase() === idStr
      );
      if (foundInNew) return foundInNew;

      // Check games
      const foundInGames = games.find(
        (g) =>
          String(g.id).toLowerCase() === idStr ||
          String(g._id).toLowerCase() === idStr ||
          (g.name || '').toLowerCase() === idStr ||
          (g.title || '').toLowerCase() === idStr
      );
      if (foundInGames) return foundInGames;

      // Check editors picks
      const foundInEditors = EDITORS_PICKS_DATA.find(
        (e) => String(e.id).toLowerCase() === idStr || (e.title || '').toLowerCase() === idStr
      );
      if (foundInEditors) {
        const questions = EDITORS_PICKS_QUESTIONS[foundInEditors.id] || [];
        return { ...foundInEditors, questions };
      }

      // Check popular
      const foundInPopular = POPULAR_DATA.find(
        (p) => String(p.id).toLowerCase() === idStr || (p.title || '').toLowerCase() === idStr
      );
      if (foundInPopular) {
        const questions = POPULAR_QUESTIONS[foundInPopular.id] || [];
        return { ...foundInPopular, questions };
      }

      return null;
    },
    [featuredQuizzes, newQuizzes, games]
  );

  return (
    <QuizContext.Provider
      value={{
        games,
        setGames,
        featuredQuizzes,
        setFeaturedQuizzes,
        newQuizzes,
        setNewQuizzes,
        editorsPicksTitle,
        setEditorsPicksTitle,
        popularTitle,
        setPopularTitle,
        showFeaturedGames,
        setShowFeaturedGames,
        handleQuizAdded,
        handleQuizUpdated,
        handleQuizDeleted,
        handleRestoreFeaturedQuizzes,
        findQuizByIdOrTitle,
        refreshQuizzes: loadBackendQuizzes,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
