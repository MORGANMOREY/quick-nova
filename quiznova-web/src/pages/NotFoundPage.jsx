import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="main-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪐</div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
        The quiz universe page you are looking for does not exist or has moved.
      </p>
      <button className="primary-btn" onClick={() => navigate('/')} style={{ padding: '0.8rem 2rem', fontSize: '1rem' }}>
        Return to Home 🚀
      </button>
    </div>
  );
}
