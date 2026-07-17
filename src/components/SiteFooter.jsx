import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-intro">
          <Brand />
          <p>Thoughtful trip planning for travellers who want every experience—and every rupee—to count.</p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <p>Explore</p>
          <Link to="/">Home</Link>
          <Link to="/browse">Destinations</Link>
        </nav>
        <nav className="footer-links" aria-label="Account navigation">
          <p>Account</p>
          <Link to="/signup">Sign up</Link>
          <Link to="/login">Log in</Link>
        </nav>
      </div>
      <div className="shell footer-bottom">
        <span>Tourgoater · Week 9 capstone</span>
        <span>Plan clearly. Travel confidently.</span>
      </div>
    </footer>
  );
}
