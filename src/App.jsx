import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import travelData from "./data/travelData.js";
import AuthForm from "./components/AuthForm.jsx";
import DestinationCard from "./components/DestinationCard.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import MoodExplorer from "./components/MoodExplorer.jsx";
import RouteTransition from "./components/RouteTransition.jsx";
import CinematicHero from "./components/CinematicHero.jsx";
import BrowsePage from "./pages/BrowsePage.jsx";
import DestinationPage from "./pages/DestinationPage.jsx";
import SavedPlansPage from "./pages/SavedPlansPage.jsx";
import CinematicMoments from "./components/CinematicMoments.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import OverallBookingPage from "./pages/OverallBookingPage.jsx";
import { clearAuthToken, getAuthToken, saveAuthToken } from "./data/authStorage.js";

function HomePage({ user, onLogout }) {
  const featuredDestinations = travelData.state.slice(1, 4);

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main id="main-content">
        <CinematicHero destinations={travelData.state} />
        {/* <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">Plan smart · travel happy</p>
            <h1>See more of the world, without losing sight of your budget.</h1>
            <p className="hero-text">Explore remarkable Indian destinations and bring your stay, travel route, and trip costs into one clear plan.</p>
            {user ? (
              <div className="welcome-card">
                <p>Welcome back, <strong>{user.name}</strong>.</p>
                <p>Your account is ready. Destination planning is the next checkpoint.</p>
                <Link className="button" to="/browse">Explore destinations</Link>
              </div>
            ) : (
              <div className="hero-actions">
                <Link className="button" to="/browse">Explore destinations</Link>
                <Link className="secondary-button" to="/signup">Create free account</Link>
              </div>
            )}
            <div className="hero-proof" aria-label="Tourgoater content summary">
              <div><strong>28</strong><span>Indian states</span></div>
              <div><strong>190</strong><span>places to explore</span></div>
              <div><strong>1</strong><span>clear trip budget</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <SafeImage
              className="hero-image"
              sources={heroDestination.img}
              alt="Scenic view of Kerala"
              fallbackLabel="Kerala"
              width="760"
              height="900"
              sizes="(max-width: 980px) 100vw, 50vw"
              fetchPriority="high"
            />
            <div className="hero-float-card">
              <span className="float-label">Featured escape</span>
              <strong>{heroDestination.name}</strong>
              <span>{heroDestination.tourist.length} places to discover</span>
            </div>
          </div>
        </section> */}

        <CinematicMoments />
        <MoodExplorer />

        <section className="how-section">
          <div className="shell">
            <div className="section-heading">
              <p className="eyebrow">A simpler way to plan</p>
              <h2>From “where?” to a trip that works.</h2>
            </div>
            <div className="step-grid">
              <article><span>01</span><h3>Choose a place</h3><p>Browse destinations and discover what makes each one worth visiting.</p></article>
              <article><span>02</span><h3>Shape your trip</h3><p>Select your stay, dates, and preferred way to travel.</p></article>
              <article><span>03</span><h3>Know your budget</h3><p>Bring the estimated costs together before you save your plan.</p></article>
            </div>
          </div>
        </section>

        <section className="featured-section">
          <div className="shell">
            <div className="section-heading-row">
              <div className="section-heading dark-text">
                <p className="eyebrow">Start somewhere beautiful</p>
                <h2>Trips worth planning around.</h2>
              </div>
              <Link className="text-link" to="/browse">View every destination <span aria-hidden="true">→</span></Link>
            </div>
            <div className="featured-grid">
              {featuredDestinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="shell closing-card">
            <div className="closing-copy">
              <p className="eyebrow">Your trip, your limits</p>
              <h2>Dream freely. Plan realistically.</h2>
              <p>Create your Tourgoater account now. Budget planning and saved trips will grow from this Week 9 foundation.</p>
              <Link className="button" to={user ? "/browse" : "/signup"}>
                {user ? "Continue exploring" : "Start your plan"}
              </Link>
            </div>
            <div className="route-art" aria-hidden="true">
              <span className="route-pin pin-start" />
              <svg viewBox="0 0 500 240" fill="none">
                <path d="M28 198C100 58 163 235 247 116c59-84 126 9 220-72" />
              </svg>
              <span className="route-pin pin-end" />
              <div className="route-note"><strong>One clear plan</strong><span>Destination · Stay · Route · Budget</span></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("tourgoaterTheme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("tourgoaterTheme", theme);
  }, [theme]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Session expired");
        return response.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => clearAuthToken())
      .finally(() => setLoading(false));
  }, []);

  function handleAuth(data, remember = true) {
    saveAuthToken(data.token, remember);
    setUser(data.user);
    navigate("/");
  }

  function handleLogout() {
    clearAuthToken();
    setUser(null);
  }

  if (loading) return <p className="status">Checking your account...</p>;

  return (
    <>
      <RouteTransition />
      <Routes>
        <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />
        <Route path="/browse" element={user ? <BrowsePage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/destination/:id" element={<DestinationPage user={user} onLogout={handleLogout} />} />
        <Route path="/booking" element={<OverallBookingPage user={user} onLogout={handleLogout} />} />
        <Route path="/saved" element={user ? <SavedPlansPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user?.role === "admin" ? <AdminPage user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
        <Route
          path="/signup"
          element={user ? <Navigate to="/" /> : <AuthForm mode="signup" onAuth={handleAuth} theme={theme} onThemeChange={setTheme} />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <AuthForm mode="login" onAuth={handleAuth} theme={theme} onThemeChange={setTheme} />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
