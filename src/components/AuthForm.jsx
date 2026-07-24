import { useState } from "react";
import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";

export default function AuthForm({ mode, onAuth }) {
  const isSignup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
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
      onAuth(data);
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch"
        ? "The login server is not running. Start it with npm.cmd run server."
        : requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Tourgoater introduction">
        <Link className="auth-back" to="/">Back to home</Link>
        <div>
          <p className="eyebrow">Travel with clarity</p>
          <h2>One place for destinations, stays, routes, and your budget.</h2>
          <p>Start with a destination. Tourgoater helps you turn it into a trip you can afford.</p>
          <div className="auth-stat-row" aria-label="Tourgoater highlights">
            <div><strong>8</strong><span>destinations</span></div>
            <div><strong>91+</strong><span>places to see</span></div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <Brand />
          <p className="auth-kicker">{isSignup ? "Get started" : "Your account"}</p>
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p>{isSignup ? "Start planning trips within your budget." : "Log in to continue planning."}</p>

          <form onSubmit={handleSubmit}>
            {isSignup && (
              <label>
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  minLength="2"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "auth-error" : undefined}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                minLength="8"
                autoComplete={isSignup ? "new-password" : "current-password"}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "auth-error" : isSignup ? "password-hint" : undefined}
                required
              />
              {isSignup && <span className="field-hint" id="password-hint">Use at least 8 characters.</span>}
            </label>

            {error && <p className="error" id="auth-error" role="alert">{error}</p>}
            <button className="button auth-submit" disabled={submitting} type="submit">
              {submitting && <span className="button-spinner" aria-hidden="true" />}
              {submitting ? "Please wait..." : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="switch-text">
            {isSignup ? "Already have an account?" : "New to Tourgoater?"}{" "}
            <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Sign up"}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
