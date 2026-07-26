import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Compass, IndianRupee, MapPinned, Search, Sparkles, WalletCards } from "lucide-react";
import travelData from "../data/travelData.js";
import DestinationCard from "../components/DestinationCard.jsx";
import FlowArt, { FlowSection } from "../components/FlowArt.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { buildTripEstimate } from "../data/tripPlanning.js";
import { getAuthToken } from "../data/authStorage.js";

export default function BrowsePage({ user, onLogout }) {
  const [budget, setBudget] = useState(() => localStorage.getItem("tripBudget") ?? "");
  const [days, setDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const [savedBudget, setSavedBudget] = useState(() => localStorage.getItem("tripBudget") ?? "");
  const [savedDays, setSavedDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const [searchQuery, setSearchQuery] = useState("");
  const dailyBudget = useMemo(() => {
    const total = Number(savedBudget);
    const tripDays = Number(savedDays);
    return total > 0 && tripDays > 0 ? Math.round(total / tripDays) : 0;
  }, [savedBudget, savedDays]);

  useEffect(() => {
    if (!user) return;
    const token = getAuthToken();
    fetch("/api/preferences", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(({ preferences }) => {
        if (!preferences.trip_budget) return;
        const serverBudget = String(preferences.trip_budget);
        const serverDays = String(preferences.trip_days);
        setBudget(serverBudget); setDays(serverDays); setSavedBudget(serverBudget); setSavedDays(serverDays);
        localStorage.setItem("tripBudget", serverBudget); localStorage.setItem("tripDays", serverDays);
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
      .sort((first, second) => second.estimatedTripCost - first.estimatedTripCost);
  }, [savedBudget, savedDays]);

  const visibleDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchingDestinations;
    return matchingDestinations.filter((destination) =>
      [destination.name, destination.capital, destination.about].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [matchingDestinations, searchQuery]);

  async function handleBudgetSubmit(event) {
    event.preventDefault();
    const normalizedBudget = String(Math.max(0, Number(budget) || 0));
    const normalizedDays = String(Math.max(1, Number(days) || 1));
    if (Number(normalizedBudget) < 1000) return;
    setBudget(normalizedBudget); setDays(normalizedDays); setSavedBudget(normalizedBudget); setSavedDays(normalizedDays);
    localStorage.setItem("tripBudget", normalizedBudget); localStorage.setItem("tripDays", normalizedDays);
    if (user) {
      const token = getAuthToken();
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
        <FlowArt>
          <FlowSection className="browse-flow-intro" ariaLabel="Explore incredible India">
            <div className="shell">
              <p className="flow-chapter">01 — Choose the feeling</p>
              <header className="browse-header">
                <div className="browse-header-copy">
                  <p className="eyebrow"><Sparkles size={15} /> Explore incredible India</p>
                  <h1>Go farther.<br /><em>Spend smarter.</em></h1>
                  <p>Explore every Indian state, compare realistic trip costs, and find the places that fit the way you want to travel.</p>
                </div>
                <div className="browse-stats" aria-label="Tourgoater destination summary">
                  <div><MapPinned size={21} /><strong>28</strong><span>Indian states</span></div>
                  <div><Compass size={21} /><strong>190</strong><span>places to see</span></div>
                  <div><WalletCards size={21} /><strong>1</strong><span>budget-first plan</span></div>
                </div>
              </header>
              <p className="flow-scroll-note">Scroll to shape your trip <span>↓</span></p>
            </div>
          </FlowSection>

          <FlowSection className="browse-flow-budget" ariaLabel="Set your travel budget">
            <div className="shell">
              <p className="flow-chapter">02 — Set the limits</p>
              <section className="budget-planner" aria-labelledby="budget-title">
                <div className="budget-copy"><p className="eyebrow"><WalletCards size={15} /> Plan within your limits</p><h2 id="budget-title">What is your trip budget?</h2><p>Tell us your total budget and trip length. We’ll turn it into a simple daily target.</p></div>
                <form className="budget-form" onSubmit={handleBudgetSubmit}>
                  <label><span>Total budget</span><span className="budget-input-wrap"><IndianRupee size={17} /><input type="number" min="1000" step="500" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="25,000" required /></span></label>
                  <label><span>Trip length</span><span className="budget-input-wrap"><CalendarDays size={17} /><input type="number" min="1" max="30" value={days} onChange={(event) => setDays(event.target.value)} required /><b>days</b></span></label>
                  <button className="button" type="submit"><Sparkles size={17} /> Match trips</button>
                </form>
                {dailyBudget > 0 && <div className="budget-result" role="status"><span>Your daily target</span><strong>₹{dailyBudget.toLocaleString("en-IN")} <small>per day</small></strong><p>For a {savedDays}-day trip with ₹{Number(savedBudget).toLocaleString("en-IN")} total.</p></div>}
              </section>
            </div>
          </FlowSection>

          <FlowSection className="browse-flow-results" ariaLabel="Browse matching destinations">
            <div className="shell">
              <p className="flow-chapter">03 — Find your place</p>
              <div className="trip-results-heading">
                <div><p className="eyebrow">{savedBudget ? "Matched to your budget" : "Explore India"}</p><h2>{savedBudget ? `${matchingDestinations.length} trips you can afford` : "Choose your next destination"}</h2></div>
                <label className="destination-search"><Search size={18} /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search state or capital" aria-label="Search state or capital" /></label>
              </div>
              {savedBudget && <p className="results-note">Estimates include a comfortable stay, food, and local travel for {savedDays} days.</p>}
              {visibleDestinations.length > 0 ? (
                <section className="destination-grid" aria-label={savedBudget ? "Trips within your budget" : "Destinations"}>{visibleDestinations.map((destination) => <DestinationCard key={destination.id} destination={destination} estimate={destination} budget={Number(savedBudget)} />)}</section>
              ) : (
                <div className="budget-empty" role="status"><Search size={30} /><h2>{searchQuery ? "No destinations match your search" : "No trips fit this budget yet"}</h2><p>{searchQuery ? "Try another state, capital, or clear the search." : "Increase your budget or shorten the trip length to see hotel-inclusive plans."}</p></div>
              )}
            </div>
          </FlowSection>
        </FlowArt>
      </main>
      <SiteFooter />
    </>
  );
}
