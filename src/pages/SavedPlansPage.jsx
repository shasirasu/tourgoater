import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import travelData from "../data/travelData.js";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import { getAuthToken } from "../data/authStorage.js";

export default function SavedPlansPage({ user, onLogout }) {
  const [plans, setPlans] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [pendingTripDelete, setPendingTripDelete] = useState(null);
  const tripDeleteTimer = useRef(null);

  useEffect(() => {
    const token = getAuthToken();
    Promise.all([
      fetch("/api/plans", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/plans/trips", { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([placesResponse, tripsResponse]) => {
        const [placesData, tripsData] = await Promise.all([placesResponse.json(), tripsResponse.json()]);
        if (!placesResponse.ok) throw new Error(placesData.message || "Could not load your saved places");
        if (!tripsResponse.ok) throw new Error(tripsData.message || "Could not load your saved trips");
        setPlans(placesData.plans);
        setTrips(tripsData.trips);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const groupedPlans = useMemo(() => Object.values(plans.reduce((groups, plan) => {
    if (!groups[plan.destination_key]) {
      groups[plan.destination_key] = {
        key: plan.destination_key,
        name: plan.destination_name,
        destination: travelData.state.find((item) => item.id === plan.destination_key),
        places: [],
      };
    }
    groups[plan.destination_key].places.push(plan);
    return groups;
  }, {})), [plans]);

  async function removePlace(plan) {
    setRemovingId(plan.id);
    setError("");
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not remove this place");
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRemovingId(null);
    }
  }

  function scheduleTripDelete(trip) {
    if (tripDeleteTimer.current) clearTimeout(tripDeleteTimer.current);
    const originalIndex = trips.findIndex((item) => item.id === trip.id);
    setTrips((current) => current.filter((item) => item.id !== trip.id));
    setPendingTripDelete({ trip, originalIndex });
    tripDeleteTimer.current = setTimeout(async () => {
      setPendingTripDelete(null);
      try {
        const response = await fetch(`/api/plans/trips/${trip.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuthToken()}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not delete the overall plan");
      } catch (requestError) {
        setTrips((current) => [...current, trip].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        setError(requestError.message);
      }
      tripDeleteTimer.current = null;
    }, 5000);
  }

  function undoTripDelete() {
    if (!pendingTripDelete) return;
    clearTimeout(tripDeleteTimer.current);
    const { trip, originalIndex } = pendingTripDelete;
    setTrips((current) => {
      const restored = [...current];
      restored.splice(Math.min(originalIndex, restored.length), 0, trip);
      return restored;
    });
    setPendingTripDelete(null);
    tripDeleteTimer.current = null;
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="saved-page" id="main-content">
        <div className="shell">
          <header className="saved-header">
            <div><p className="eyebrow">Your collection</p><h1>Your saved plans.</h1></div>
            <p>Complete overall trip plans and individually saved places are organised separately below.</p>
          </header>

          {error && <p className="error saved-error" role="alert">{error}</p>}
          {loading ? (
            <p className="saved-loading" role="status">Loading your saved places...</p>
          ) : (
            <>
              <section className="saved-complete-trips" aria-labelledby="complete-plans-title">
                <div className="saved-trip-heading"><p className="eyebrow">Overall plans</p><h2 id="complete-plans-title">Full trip plans.</h2><p>Saved plans containing your places, live flight, hotel, travelers and overall total.</p></div>
                {trips.length > 0 ? <div className="saved-trip-grid">{trips.map((trip) => {
                  const flight = JSON.parse(trip.flight_json);
                  const hotel = JSON.parse(trip.hotel_json);
                  const places = JSON.parse(trip.places_json);
                  const tripDestination = travelData.state.find((item) => item.id === trip.destination_key);
                  return <article className="saved-trip-card" key={trip.id}>
                    <div className="saved-trip-image"><SafeImage sources={tripDestination?.img} alt={`Scenic view of ${trip.destination_name}`} fallbackLabel={trip.destination_name} loading="lazy" width="720" height="420" /><span>Complete plan</span></div>
                    <div><span>{new Date(trip.departure_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span><h3>{trip.destination_name}</h3><p>{trip.departure_city} → {trip.destination_name} · {trip.travelers} {trip.travelers === 1 ? "traveler" : "travelers"}</p></div>
                    <dl><div><dt>Flight</dt><dd>{flight.airline} · {flight.flightNumber}</dd></div><div><dt>Hotel</dt><dd>{hotel.name}</dd></div><div><dt>Places</dt><dd>{places.map((place) => place.name).join(", ")}</dd></div><div><dt>Stay & activity budget</dt><dd>₹{Number(trip.budget).toLocaleString("en-IN")}</dd></div><div className="saved-travel-addon"><dt>Travel add-on</dt><dd>+₹{(Number(flight.price || 0) * Number(trip.travelers || 1)).toLocaleString("en-IN")}</dd></div><div><dt>Overall total</dt><dd>₹{Number(trip.total_cost).toLocaleString("en-IN")}</dd></div></dl>
                    <p className="saved-budget-disclaimer">Flight travel is an add-on above the stay & activity budget.</p>
                    <div className="saved-trip-actions"><Link to={`/destination/${trip.destination_key}?editTrip=${trip.id}`}>Edit plan →</Link><button type="button" disabled={Boolean(pendingTripDelete)} onClick={() => scheduleTripDelete(trip)}>Delete plan</button></div>
                  </article>;
                })}</div> : <div className="saved-section-empty"><span aria-hidden="true">◎</span><div><h3>No full plans saved yet</h3><p>Complete all four planning steps on a destination page, then select “Save plan”.</p></div><Link className="button" to="/browse">Build a trip</Link></div>}
              </section>

              <section className="saved-places-section" aria-labelledby="saved-places-title">
                <div className="saved-trip-heading"><p className="eyebrow">Saved places</p><h2 id="saved-places-title">Individual places.</h2><p>Places you bookmarked while exploring, grouped by destination.</p></div>
                {groupedPlans.length > 0 ? <div className="saved-destinations">
                  {groupedPlans.map((group) => (
                    <section className="saved-destination" key={group.key}>
                      <div className="saved-cover">
                        <SafeImage sources={group.destination?.img} alt={`View of ${group.name}`} fallbackLabel={group.name} sizes="(max-width: 760px) 100vw, 34vw" width="1280" height="900" />
                        <div><span>{group.places.length} saved {group.places.length === 1 ? "place" : "places"}</span><h2>{group.name}</h2><Link to={`/destination/${group.key}`}>Open destination →</Link></div>
                      </div>
                      <ul className="saved-place-list">
                        {group.places.map((plan, index) => (
                          <li key={plan.id}>
                            <span className="saved-place-number">{String(index + 1).padStart(2, "0")}</span>
                            <div><strong>{plan.place_name}</strong><small>Added {new Date(plan.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></div>
                            <div className="saved-place-actions">
                              {plan.place_location && <a href={plan.place_location} target="_blank" rel="noreferrer">Map ↗</a>}
                              <button type="button" disabled={removingId === plan.id} onClick={() => removePlace(plan)}>{removingId === plan.id ? "Removing..." : "Remove"}</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div> : <div className="saved-section-empty"><span aria-hidden="true">♡</span><div><h3>No individual places saved yet</h3><p>Open a destination and save the places you want to remember.</p></div><Link className="button" to="/browse">Explore places</Link></div>}
              </section>
            </>
          )}
        </div>
        {pendingTripDelete && <div className="undo-delete-toast" role="status" aria-live="polite"><span className="undo-delete-progress" /><div><strong>Overall plan removed</strong><p>It will be permanently deleted in 5 seconds.</p></div><button type="button" onClick={undoTripDelete}>Undo</button></div>}
      </main>
      <SiteFooter />
    </>
  );
}
