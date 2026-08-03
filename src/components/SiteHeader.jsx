import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bell, Menu, Moon, Sun, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Brand from "./Brand.jsx";
import { getAuthToken } from "../data/authStorage.js";

export default function SiteHeader({ user, onLogout, theme = "light", onThemeChange }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backButtonFloating, setBackButtonFloating] = useState(false);

  useEffect(() => {
    if (location.pathname === "/") { setBackButtonFloating(false); return undefined; }
    const updateBackButton = () => setBackButtonFloating(window.scrollY > 110);
    updateBackButton();
    window.addEventListener("scroll", updateBackButton, { passive: true });
    return () => window.removeEventListener("scroll", updateBackButton);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || user.role === "admin") { setNotifications([]); return undefined; }
    const loadNotifications = async () => {
      try {
        const response = await fetch("/api/bookings/notifications", { headers: { Authorization: `Bearer ${getAuthToken()}` } });
        const data = await response.json().catch(() => ({}));
        if (response.ok) setNotifications(data.notifications || []);
      } catch { /* A temporary notification failure should not interrupt navigation. */ }
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [user]);

  async function readNotifications() {
    if (!notifications.length) return;
    await fetch("/api/bookings/notifications/read", { method: "PATCH", headers: { Authorization: `Bearer ${getAuthToken()}` } }).catch(() => null);
    setNotifications([]);
  }

  function goBack() {
    if (location.key && location.key !== "default") navigate(-1);
    else navigate("/");
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="nav shell">
          <div className="nav-brand-group">
            {location.pathname !== "/" && !backButtonFloating && <button className="nav-back-button" type="button" onClick={goBack} aria-label="Go back" title="Go back"><ArrowLeft size={20} /></button>}
            <Brand />
          </div>
          <button className="mobile-menu-toggle" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileMenuOpen} aria-controls="main-navigation">
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <nav id="main-navigation" className={`nav-links ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Main navigation">
            <Link to="/browse" onClick={() => setMobileMenuOpen(false)}>Destinations</Link>
            {user ? (
              <>
                <Link to="/saved" onClick={() => setMobileMenuOpen(false)}>Saved plan</Link>
                {user.role !== "admin" && <div className="nav-notifications"><button className="nav-notification-button" type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-label={`${notifications.length} unread booking notifications`}><Bell size={19} />{notifications.length > 0 && <span>{notifications.length > 9 ? "9+" : notifications.length}</span>}</button>{notificationsOpen && <div className="notification-popover"><strong>Booking notifications</strong>{notifications.length ? <>{notifications.map((notification) => <Link key={notification.id} to="/saved" onClick={() => { readNotifications(); setNotificationsOpen(false); }}><b>Admin replied about {notification.destination_name}</b><span>{notification.message}</span><small>{new Date(notification.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></Link>)}<button type="button" onClick={readNotifications}>Mark all as read</button></> : <p>No new replies</p>}</div>}</div>}
                {user.role === "admin" && <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
                <button className="nav-text-button" onClick={() => { setMobileMenuOpen(false); onLogout(); }}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link className="button button-small" to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
              </>
            )}
            <button className="nav-theme-toggle" type="button" onClick={() => onThemeChange?.(theme === "dark" ? "light" : "dark")} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "dark"}>
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </nav>
        </div>
      </header>
      {location.pathname !== "/" && backButtonFloating && createPortal(
        <button className="nav-back-button is-floating" type="button" onClick={goBack} aria-label="Go back" title="Go back"><ArrowLeft size={20} /></button>,
        document.body,
      )}
    </>
  );
}
