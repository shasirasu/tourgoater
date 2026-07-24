import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function AuthForm({ mode, onAuth }) {
  const isSignup = mode === "signup";
  const canvasRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let frame;
    let particles = [];
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(82, Math.floor(window.innerWidth * window.innerHeight / 18000)) }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.1 + .5,
        speedX: (Math.random() - .5) * .24,
        speedY: (Math.random() - .5) * .24,
        alpha: Math.random() * .35 + .08,
      }));
    };
    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.x = (particle.x + particle.speedX + window.innerWidth) % window.innerWidth;
        particle.y = (particle.y + particle.speedY + window.innerHeight) % window.innerHeight;
        context.fillStyle = isDarkMode ? `rgba(251,146,60,${particle.alpha})` : `rgba(15,23,42,${particle.alpha})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
      frame = requestAnimationFrame(draw);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [isDarkMode]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Something went wrong");
      onAuth(data, isSignup || rememberMe);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch"
        ? "The login server could not be reached. Please try again."
        : requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={`animated-auth ${isDarkMode ? "is-dark" : "is-light"}`}>
      <canvas ref={canvasRef} className="auth-particles" aria-hidden="true" />
      <Link className="animated-auth-back" to="/"><ArrowLeft size={17} /> Back home</Link>
      <button className="auth-theme-toggle" type="button" onClick={() => setIsDarkMode((current) => !current)} aria-label={`Use ${isDarkMode ? "light" : "dark"} mode`}>
        {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      <section className="animated-auth-card" aria-labelledby="auth-title">
        <div className="animated-auth-glow" aria-hidden="true" />
        <div className="animated-auth-inner">
          <Brand />
          <header className="animated-auth-header">
            <p>{isSignup ? "Start your journey" : "Welcome back"}</p>
            <h1 id="auth-title">{isSignup ? "Create your account" : "Sign in to continue"}</h1>
            <span>{isSignup ? "Plan memorable trips around a budget that works for you." : "Your saved places and trip plans are waiting."}</span>
          </header>

          <form className="animated-auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className={`animated-field ${form.name ? "has-value" : ""}`}>
                <input id="auth-name" name="name" value={form.name} onChange={handleChange} minLength="2" autoComplete="name" required placeholder=" " />
                <label htmlFor="auth-name">Your name</label>
              </div>
            )}
            <div className={`animated-field ${form.email ? "has-value" : ""}`}>
              <input id="auth-email" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" required placeholder=" " aria-invalid={Boolean(error)} />
              <label htmlFor="auth-email">Email address</label>
            </div>
            <div className={`animated-field has-action ${form.password ? "has-value" : ""}`}>
              <input id="auth-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} minLength="8" autoComplete={isSignup ? "new-password" : "current-password"} required placeholder=" " aria-invalid={Boolean(error)} />
              <label htmlFor="auth-password">Password</label>
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isSignup && (
              <div className="animated-auth-options">
                <label><input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((current) => !current)} /><span /> Remember me</label>
                <span className="auth-help-text">Secure access to your plans</span>
              </div>
            )}
            {isSignup && <p className="auth-password-hint">Use at least 8 characters.</p>}
            {error && <p className="animated-auth-error" role="alert">{error}</p>}
            <button className="animated-auth-submit" disabled={submitting} type="submit">
              {submitting && <span className="button-spinner" aria-hidden="true" />}
              {submitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="animated-auth-switch">
            {isSignup ? "Already have an account?" : "New to Tourgoater?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
          </p>
          <div className="animated-auth-proof"><span>28 states</span><i /> <span>190 places</span><i /> <span>One clear budget</span></div>
        </div>
      </section>
    </main>
  );
}
