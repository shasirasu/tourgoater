import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function AuthForm({ mode, onAuth, theme, onThemeChange }) {
  const isSignup = mode === "signup";
  const canvasRef = useRef(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [otpChallenge, setOtpChallenge] = useState(null);
  const [otp, setOtp] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetChallenge, setResetChallenge] = useState(null);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const isDarkMode = theme === "dark";

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
      if (otpChallenge) {
        const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: otpChallenge.challengeId, code: otp }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "OTP verification failed");
        onAuth(data, rememberMe);
        return;
      }
      const normalizedEmail = form.email.trim().includes("@") ? form.email.trim() : `${form.email.trim()}@gmail.com`;
      const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Something went wrong");
      if (data.otpRequired) {
        setOtpChallenge(data);
        if (data.debugOtp) setOtp(data.debugOtp);
        return;
      }
      onAuth(data, isSignup || rememberMe);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch"
        ? "The login server could not be reached. Please try again."
        : requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    setError(""); setSubmitting(true);
    try {
      if (!resetChallenge) {
        const normalizedEmail = form.email.trim().includes("@") ? form.email.trim() : `${form.email.trim()}@gmail.com`;
        const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: normalizedEmail }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not send reset OTP");
        setResetChallenge(data); if (data.debugOtp) setResetOtp(data.debugOtp);
      } else {
        const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ challengeId: resetChallenge.challengeId, code: resetOtp, password: newPassword }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Could not reset password");
        setForgotMode(false); setResetChallenge(null); setResetOtp(""); setNewPassword(""); setNotice(data.message);
      }
    } catch (requestError) { setError(requestError.message); }
    finally { setSubmitting(false); }
  }

  return (
    <main className={`animated-auth ${isDarkMode ? "is-dark" : "is-light"}`}>
      <canvas ref={canvasRef} className="auth-particles" aria-hidden="true" />
      <Link className="animated-auth-back" to="/"><ArrowLeft size={17} /> Back home</Link>
      <button className="auth-theme-toggle" type="button" onClick={() => onThemeChange(isDarkMode ? "light" : "dark")} aria-label={`Use ${isDarkMode ? "light" : "dark"} mode`} aria-pressed={isDarkMode}>
        {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
      </button>

      <section className="animated-auth-card" aria-labelledby="auth-title">
        <div className="animated-auth-glow" aria-hidden="true" />
        <div className="animated-auth-inner">
          <Brand />
          <header className="animated-auth-header">
            <p>{forgotMode ? "Account recovery" : otpChallenge ? "Email verification" : isSignup ? "Start your journey" : "Welcome back"}</p>
            <h1 id="auth-title">{forgotMode ? "Reset your password" : otpChallenge ? "Enter your email OTP" : isSignup ? "Create your account" : "Sign in to continue"}</h1>
            <span>{forgotMode ? resetChallenge ? `Enter the code sent to ${resetChallenge.emailHint} and choose a new password.` : "We will email a verification code to your account." : otpChallenge ? `We sent a six-digit code to ${otpChallenge.emailHint}.` : isSignup ? "Plan memorable trips around a budget that works for you." : "Your saved places and trip plans are waiting."}</span>
          </header>

          {forgotMode ? <form className="animated-auth-form" onSubmit={handlePasswordReset}>
            {!resetChallenge ? <div className={`animated-field ${form.email ? "has-value" : ""}`}><input id="reset-email" type="text" inputMode="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required placeholder=" " /><label htmlFor="reset-email">Email or Gmail username</label></div> : <><div className={`animated-field ${resetOtp ? "has-value" : ""}`}><input id="reset-otp" inputMode="numeric" value={resetOtp} onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" required placeholder=" " /><label htmlFor="reset-otp">Password reset OTP</label></div><div className={`animated-field ${newPassword ? "has-value" : ""}`}><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength="8" autoComplete="new-password" required placeholder=" " /><label htmlFor="new-password">New password</label></div>{resetChallenge.debugOtp && <p className="auth-otp-hint">Local development code: <strong>{resetChallenge.debugOtp}</strong></p>}</>}
            {error && <p className="animated-auth-error" role="alert">{error}</p>}
            <button className="animated-auth-submit" disabled={submitting} type="submit">{submitting ? "Please wait..." : resetChallenge ? "Verify OTP & reset" : "Send reset OTP"}</button>
            <button className="auth-recovery-back" type="button" onClick={() => { setForgotMode(false); setResetChallenge(null); setError(""); }}>Back to login</button>
          </form> : <form className="animated-auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className={`animated-field ${form.name ? "has-value" : ""}`}>
                <input id="auth-name" name="name" value={form.name} onChange={handleChange} minLength="2" autoComplete="name" required placeholder=" " />
                <label htmlFor="auth-name">Your name</label>
              </div>
            )}
            <div className={`animated-field ${form.email ? "has-value" : ""}`}>
              <input id="auth-email" name="email" type="text" inputMode="email" value={form.email} onChange={handleChange} autoComplete="email" required placeholder=" " aria-invalid={Boolean(error)} />
              <label htmlFor="auth-email">Email or Gmail username</label>
            </div>
            <p className="auth-email-hint">Example: <strong>admin</strong> becomes <strong>admin@gmail.com</strong>.</p>
            <div className={`animated-field has-action ${form.password ? "has-value" : ""}`}>
              <input id="auth-password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} minLength="8" autoComplete={isSignup ? "new-password" : "current-password"} required placeholder=" " aria-invalid={Boolean(error)} />
              <label htmlFor="auth-password">Password</label>
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {otpChallenge && <><div className={`animated-field ${otp ? "has-value" : ""}`}><input id="auth-otp" inputMode="numeric" value={otp} onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }} pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" required placeholder=" " /><label htmlFor="auth-otp">Six-digit email OTP</label></div><p className="auth-otp-hint">Code sent to {otpChallenge.emailHint}.{otpChallenge.debugOtp && <> Local development code: <strong>{otpChallenge.debugOtp}</strong></>}</p></>}

            {!isSignup && (
              <div className="animated-auth-options">
                <label><input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((current) => !current)} /><span /> Remember me</label>
                <button className="auth-forgot-button" type="button" onClick={() => { setForgotMode(true); setError(""); setNotice(""); }}>Forgot password?</button>
              </div>
            )}
            {isSignup && <p className="auth-password-hint">Use at least 8 characters.</p>}
            {error && <div className="auth-login-error"><p className="animated-auth-error" role="alert">{error}</p>{!isSignup && error.includes("Please sign up first") && <Link className="auth-signup-prompt" to="/signup">Sign up now</Link>}</div>}
            <button className="animated-auth-submit" disabled={submitting} type="submit">
              {submitting && <span className="button-spinner" aria-hidden="true" />}
              {submitting ? "Please wait..." : otpChallenge ? "Verify OTP" : isSignup ? "Create account" : "Login In"}
            </button>
          </form>}

          {notice && !forgotMode && <p className="auth-success-notice" role="status">{notice}</p>}
          {!forgotMode && <p className="animated-auth-switch">
            {isSignup ? "Already have an account?" : "New to Tourgoater?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
          </p>}
          <div className="animated-auth-proof"><span>30 destinations</span><i /> <span>190+ places</span><i /> <span>One clear budget</span></div>
        </div>
      </section>
    </main>
  );
}
