import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import travelData from "../data/travelData.js";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import { getAuthToken } from "../data/authStorage.js";

export default function SavedPlansPage({ user, onLogout }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    fetch("/api/plans", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load your saved plan");
        setPlans(data.plans);
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

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="saved-page" id="main-content">
        <div className="shell">
          <header className="saved-header">
            <div><p className="eyebrow">Your collection</p><h1>Places you saved.</h1></div>
            <p>Everything you add to a plan appears here, organised by destination.</p>
          </header>

          {error && <p className="error saved-error" role="alert">{error}</p>}
          {loading ? (
            <p className="saved-loading" role="status">Loading your saved places...</p>
          ) : groupedPlans.length ? (
            <div className="saved-destinations">
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
            </div>
          ) : (
            <div className="saved-empty">
              <span aria-hidden="true">♡</span><h2>Your plan is ready for its first place.</h2><p>Explore a destination and select “Save this place” to build your collection.</p><Link className="button" to="/browse">Explore destinations</Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
