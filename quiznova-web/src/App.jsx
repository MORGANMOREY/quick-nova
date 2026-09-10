import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QuizProvider, useQuiz } from './context/QuizContext';

import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import LoginModal from './components/modals/LoginModal';

// Direct import for the primary landing page (instant first paint)
import BrowsePage from './pages/BrowsePage';

// Lazy-loaded pages for optimal bundle splitting and performance
const QuizLandingPage = lazy(() => import('./pages/QuizLandingPage'));
const QuizPlayPage = lazy(() => import('./pages/QuizPlayPage'));
const SnakeGamePage = lazy(() => import('./pages/SnakeGamePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Aesthetic Page Loading Fallback
function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '3px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: 'var(--accent-1)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500' }}>
        Loading QuizNova...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const { userRole, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <PageLoader />;
  if (userRole !== 'admin' && userRole !== 'sub_admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const location = useLocation();
  const { isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const { newQuizzes, games } = useQuiz();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  const latestQuiz = newQuizzes[0] || games[0];
  const isPlayPage =
    location.pathname.startsWith('/play/') || location.pathname.startsWith('/snake/');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {!isPlayPage && (
        <Navbar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          latestQuiz={latestQuiz}
          showBanner={showBanner}
          setShowBanner={setShowBanner}
        />
      )}

      <main style={{ flexGrow: 1 }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={<BrowsePage isAllQuizzesView={false} searchQuery={searchQuery} />}
            />
            <Route
              path="/browse"
              element={<BrowsePage isAllQuizzesView={true} searchQuery={searchQuery} />}
            />
            <Route path="/quiz/:id" element={<QuizLandingPage />} />
            <Route path="/play/:id" element={<QuizPlayPage />} />
            <Route path="/snake/:id" element={<SnakeGamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/account" element={<ProfilePage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPage />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <div
        className="scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to top"
      >
        ↑
      </div>

      {!isPlayPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <QuizProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
