import { useEffect, useMemo, useState } from "react";
import { CalendarDays, IndianRupee, Search, Sparkles, Users, WalletCards } from "lucide-react";
import travelData from "../data/travelData.js";
import DestinationCard from "../components/DestinationCard.jsx";
import ScrollMorphHero from "../components/ScrollMorphHero.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import { buildTripEstimate } from "../data/tripPlanning.js";
import { getAuthToken } from "../data/authStorage.js";

export default function BrowsePage({ user, onLogout, theme, onThemeChange }) {
  const [budget, setBudget] = useState(() => localStorage.getItem("tripBudgetPerPerson") ?? "00000");
  const [days, setDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const [travelers, setTravelers] = useState(() => localStorage.getItem("tripTravelers") ?? "1");
  const [savedBudget, setSavedBudget] = useState(() => localStorage.getItem("tripBudget") ?? "");
  const [savedDays, setSavedDays] = useState(() => localStorage.getItem("tripDays") ?? "3");
  const [savedTravelers, setSavedTravelers] = useState(() => localStorage.getItem("tripTravelers") ?? "1");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return undefined;
    const token = getAuthToken();
    if (!token) return undefined;
    const controller = new AbortController();

    async function loadSavedPreferences() {
      try {
        const response = await fetch("/api/preferences", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.preferences) return;

        const groupBudget = Math.max(0, Number(data.preferences.trip_budget) || 0);
        const savedTripDays = String(Math.max(1, Number(data.preferences.trip_days) || 3));
        const travelerCount = String(Math.min(20, Math.max(1, Number(localStorage.getItem("tripTravelers")) || 1)));
        const perPersonBudget = groupBudget > 0 ? String(Math.round(groupBudget / Number(travelerCount))) : "00000";

        setBudget(perPersonBudget);
        setDays(savedTripDays);
        setTravelers(travelerCount);
        setSavedBudget(groupBudget > 0 ? String(groupBudget) : "");
        setSavedDays(savedTripDays);
        setSavedTravelers(travelerCount);
        localStorage.setItem("tripBudgetPerPerson", perPersonBudget);
        localStorage.setItem("tripBudget", groupBudget > 0 ? String(groupBudget) : "");
        localStorage.setItem("tripDays", savedTripDays);
      } catch (error) {
        if (error.name !== "AbortError") console.warn("Could not load saved trip preferences", error);
      }
    }

    loadSavedPreferences();
    return () => controller.abort();
  }, [user]);
  const dailyBudget = useMemo(() => {
    const total = Number(savedBudget);
    const tripDays = Number(savedDays);
    return total > 0 && tripDays > 0 ? Math.round(total / tripDays) : 0;
  }, [savedBudget, savedDays]);

  const matchingDestinations = useMemo(() => {
    return travelData.state
      .map((destination) => {
        const estimate = buildTripEstimate(destination, savedDays, Number(savedBudget) || Infinity, savedTravelers);
        return estimate ? { ...destination, ...estimate } : null;
      })
      .filter(Boolean)
      .sort((first, second) => Number(savedBudget) ? second.estimatedTripCost - first.estimatedTripCost : 0);
  }, [savedBudget, savedDays, savedTravelers]);

  const visibleDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchingDestinations;
    return matchingDestinations.filter((destination) =>
      [destination.name, destination.capital, destination.about].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [matchingDestinations, searchQuery]);

  async function handleBudgetSubmit(event) {
    event.preventDefault();
    const normalizedPerPersonBudget = String(Math.max(0, Number(budget) || 0));
    const normalizedDays = String(Math.max(1, Number(days) || 1));
    const normalizedTravelers = String(Math.min(20, Math.max(1, Number(travelers) || 1)));
    const groupBudget = String(Number(normalizedPerPersonBudget) * Number(normalizedTravelers));
    if (Number(normalizedPerPersonBudget) < 1000) return;
    setBudget(normalizedPerPersonBudget); setDays(normalizedDays); setTravelers(normalizedTravelers); setSavedBudget(groupBudget); setSavedDays(normalizedDays); setSavedTravelers(normalizedTravelers);
    localStorage.setItem("tripBudgetPerPerson", normalizedPerPersonBudget); localStorage.setItem("tripBudget", groupBudget); localStorage.setItem("tripDays", normalizedDays); localStorage.setItem("tripTravelers", normalizedTravelers); localStorage.setItem("hotelAdults", normalizedTravelers);
    window.setTimeout(() => {
      const resultsSection = document.querySelector(".browse-results-section");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultsSection?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }, 120);
    if (user) {
      const token = getAuthToken();
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tripBudget: Number(groupBudget), tripDays: Number(normalizedDays) }),
      }).catch(() => {});
    }
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} theme={theme} onThemeChange={onThemeChange} />
      <main className="browse-page" id="main-content">
        <ScrollMorphHero destinations={travelData.state} />
        <div className="browse-planning-area">
          <div className="shell">
            <section className="budget-planner" aria-labelledby="budget-title">
              <div className="budget-copy"><p className="eyebrow"><WalletCards size={15} /> Plan within your limits</p><h2 id="budget-title">What is your trip budget?</h2><p>Enter a per-person budget, trip length, and group size. We will calculate the complete group budget.</p></div>
              <form className="budget-form" onSubmit={handleBudgetSubmit}>
                <label><span>Budget per person</span><span className="budget-input-wrap"><IndianRupee size={17} /><input type="number" min="1000" step="500" value={budget} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setBudget(event.target.value)} placeholder="00000" required /></span></label>
                <label><span>Trip length</span><span className="budget-input-wrap"><CalendarDays size={17} /><input type="number" min="1" max="30" value={days} onChange={(event) => setDays(event.target.value)} required /><b>days</b></span></label>
                <label><span>Travellers</span><span className="budget-input-wrap"><Users size={17} /><input type="number" min="1" max="20" value={travelers} onChange={(event) => setTravelers(event.target.value)} required /><b>people</b></span></label>
                <button className="button" type="submit"><Sparkles size={17} /> Match trips</button>
              </form>
              {dailyBudget > 0 && <div className="budget-result" role="status"><span>Your group budget</span><strong>₹{Number(savedBudget).toLocaleString("en-IN")} <small>for {savedTravelers} {Number(savedTravelers) === 1 ? "traveller" : "travellers"}</small></strong><p>₹{dailyBudget.toLocaleString("en-IN")} per day for the full group.</p></div>}
            </section>

            <section className="browse-results-section">
              <div className="trip-results-heading">
                <div><p className="eyebrow">{savedBudget ? "Matched to your budget" : "Explore India"}</p><h2>{savedBudget ? `${matchingDestinations.length} trips you can afford` : "Choose your next destination"}</h2></div>
                <label className="destination-search"><Search size={18} /><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search state or capital" aria-label="Search state or capital" /></label>
              </div>
              {savedBudget && <p className="results-note">Estimates include a comfortable stay, food, and local travel for {savedTravelers} {Number(savedTravelers) === 1 ? "traveller" : "travellers"} over {savedDays} days.</p>}
              {visibleDestinations.length > 0 ? (
                <section className="destination-grid" aria-label={savedBudget ? "Trips within your budget" : "Destinations"}>{visibleDestinations.map((destination) => <DestinationCard key={destination.id} destination={destination} estimate={destination} budget={Number(savedBudget)} tripDays={savedDays} travelers={savedTravelers} />)}</section>
              ) : (
                <div className="budget-empty" role="status"><Search size={30} /><h2>{searchQuery ? "No destinations match your search" : "No trips fit this budget yet"}</h2><p>{searchQuery ? "Try another state, capital, or clear the search." : "Increase your budget or shorten the trip length to see hotel-inclusive plans."}</p></div>
              )}
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
