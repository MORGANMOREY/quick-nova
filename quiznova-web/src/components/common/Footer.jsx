export default function Footer({ onNavigate }) {
  return (
    <footer className="dark-footer">
      <div className="footer-social">
        STAY CONNECTED
        <div className="social-icons">
          <span>▶</span>
          <span>📷</span>
          <span>P</span>
        </div>
      </div>
      <div className="footer-links">
        <a href="#about" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('about'); }}>About Us & Legal Info</a>
        <a href="#advertising" onClick={(e) => { e.preventDefault(); }}>Advertising</a>
        <a href="#contact" onClick={(e) => { e.preventDefault(); }}>Contact Us</a>
        <a href="#privacy" onClick={(e) => { e.preventDefault(); }}>Privacy Policy</a>
        <a href="#terms" onClick={(e) => { e.preventDefault(); }}>Terms of Use</a>
        <a href="#equal" onClick={(e) => { e.preventDefault(); }}>Equal Opportunity</a>
      </div>
      <div className="copyright">
        ©2026 KMS ACADEMY, Inc.
      </div>
    </footer>
  );
}
