import { useEffect, useMemo, useState } from "react";
import travelData from "../data/travelData.js";
import DestinationCard from "../components/DestinationCard.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { buildTripEstimate } from "../data/tripPlanning.js";

export default function BrowsePage({ user, onLogout }) {
  const [budget, setBudget] = useState(() => localStorage.getItem("tripBudget") ?? "");
  const [days, setDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const [savedBudget, setSavedBudget] = useState(() => localStorage.getItem("tripBudget") ?? "");
  const [savedDays, setSavedDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const dailyBudget = useMemo(() => {
    const total = Number(savedBudget);
    const tripDays = Number(savedDays);
    return total > 0 && tripDays > 0 ? Math.round(total / tripDays) : 0;
  }, [savedBudget, savedDays]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    fetch("/api/preferences", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ preferences }) => {
        if (!preferences.trip_budget) return;
        const serverBudget = String(preferences.trip_budget);
        const serverDays = String(preferences.trip_days);
        setBudget(serverBudget);
        setDays(serverDays);
        setSavedBudget(serverBudget);
        setSavedDays(serverDays);
        localStorage.setItem("tripBudget", serverBudget);
        localStorage.setItem("tripDays", serverDays);
      })
      .catch(() => {});
  }, [user]);
  const matchingDestinations = useMemo(() => {
    if (!Number(savedBudget)) return travelData.state;
    return travelData.state
      .map((destination) => {
        const estimate = buildTripEstimate(destination, savedDays, Number(savedBudget));
        return estimate ? { ...destination, ...estimate } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.estimatedTripCost - a.estimatedTripCost);
  }, [savedBudget, savedDays]);

  async function handleBudgetSubmit(event) {
    event.preventDefault();
    const normalizedBudget = String(Math.max(0, Number(budget) || 0));
    const normalizedDays = String(Math.max(1, Number(days) || 1));
    if (Number(normalizedBudget) < 1000) return;
    setBudget(normalizedBudget);
    setDays(normalizedDays);
    setSavedBudget(normalizedBudget);
    setSavedDays(normalizedDays);
    localStorage.setItem("tripBudget", normalizedBudget);
    localStorage.setItem("tripDays", normalizedDays);
    if (user) {
      const token = localStorage.getItem("token");
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripBudget: Number(normalizedBudget), tripDays: Number(normalizedDays) }),
      }).catch(() => {});
    }
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="browse-page" id="main-content">
        <div className="shell">
          <header className="browse-header">
            <p className="eyebrow">Explore destinations</p>
            <h1>Find a place that fits your kind of trip.</h1>
            <p>Discover memorable places across India and start shaping a trip around your budget.</p>
          </header>

          <section className="budget-planner" aria-labelledby="budget-title">
            <div className="budget-copy">
              <p className="eyebrow">Plan within your limits</p>
              <h2 id="budget-title">What is your trip budget?</h2>
              <p>Tell us your total budget and trip length. We’ll turn it into a simple daily target.</p>
            </div>
            <form className="budget-form" onSubmit={handleBudgetSubmit}>
              <label>
                <span>Total budget</span>
                <span className="budget-input-wrap"><b>₹</b><input type="number" min="1000" step="500" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="25,000" required /></span>
              </label>
              <label>
                <span>Trip length</span>
                <span className="budget-input-wrap"><input type="number" min="1" max="30" value={days} onChange={(event) => setDays(event.target.value)} required /><b>days</b></span>
              </label>
              <button className="button" type="submit">Set my budget</button>
            </form>
            {dailyBudget > 0 && (
              <div className="budget-result" role="status">
                <span>Your daily target</span>
                <strong>₹{dailyBudget.toLocaleString("en-IN")} <small>per day</small></strong>
                <p>For a {savedDays}-day trip with ₹{Number(savedBudget).toLocaleString("en-IN")} total.</p>
              </div>
            )}
          </section>

          <div className="trip-results-heading">
            <div>
              <p className="eyebrow">{savedBudget ? "Matched to your budget" : "Explore India"}</p>
              <h2>{savedBudget ? `${matchingDestinations.length} trips you can afford` : "Choose your next destination"}</h2>
            </div>
            {savedBudget && <p>Estimates include a comfortable stay, food, and local travel for {savedDays} days.</p>}
          </div>

          {matchingDestinations.length > 0 ? (
            <section className="destination-grid" aria-label={savedBudget ? "Trips within your budget" : "Destinations"}>
              {matchingDestinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} estimate={destination} budget={Number(savedBudget)} />
              ))}
            </section>
          ) : (
            <div className="budget-empty" role="status">
              <h2>No trips fit this budget yet</h2>
              <p>Increase your budget or shorten the trip length to see hotel-inclusive plans.</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
