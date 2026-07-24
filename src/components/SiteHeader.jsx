import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function SiteHeader({ user, onLogout }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="nav shell">
          <Brand />
          <nav className="nav-links" aria-label="Main navigation">
            <Link to="/browse">Destinations</Link>
            {user ? (
              <>
                <Link to="/saved">Saved plan</Link>
                {user.role === "admin" && <Link to="/admin">Admin</Link>}
                <button className="nav-text-button" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link className="button button-small" to="/signup">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
