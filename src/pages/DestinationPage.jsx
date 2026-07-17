import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import travelData from "../../db.json";
import PlaceShowcase from "../components/PlaceShowcase.jsx";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DestinationPage({ user, onLogout }) {
  const { id } = useParams();
  const destination = travelData.state.find((state) => state.id === id);
  const [savedPlaceNames, setSavedPlaceNames] = useState(new Set());
  const [savingPlaceName, setSavingPlaceName] = useState("");
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (!user || !destination) {
      setSavedPlaceNames(new Set());
      return;
    }

    const token = localStorage.getItem("token");
    fetch(`/api/plans?destinationKey=${encodeURIComponent(destination.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not check your saved places");
        return response.json();
      })
      .then((data) => setSavedPlaceNames(new Set(data.plans.map((plan) => plan.place_name))))
      .catch(() => setSaveError({ placeName: "", message: "Could not load saved places." }));
  }, [destination, user]);

  async function handleSavePlace(place) {
    const token = localStorage.getItem("token");
    setSavingPlaceName(place.name);
    setSaveError(null);

    try {
      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destinationKey: destination.id,
          destinationName: destination.name,
          placeName: place.name,
          placeLocation: place.location,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save this place");

      setSavedPlaceNames((currentNames) => new Set([...currentNames, place.name]));
    } catch (error) {
      setSaveError({ placeName: place.name, message: error.message });
    } finally {
      setSavingPlaceName("");
    }
  }

  if (!destination) {
    return (
      <>
        <SiteHeader user={user} onLogout={onLogout} />
        <main className="not-found-page shell" id="main-content">
          <p className="eyebrow">Destination not found</p>
          <h1>We could not find that place.</h1>
          <Link className="button" to="/browse">Back to destinations</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const touristPlaces = destination.tourist ?? [];
  const accommodations = destination.accommodations ?? [];

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="destination-page" id="main-content">
        <section className="destination-hero shell">
          <div className="destination-hero-copy">
            <Link className="back-link" to="/browse">
              <span aria-hidden="true">←</span> All destinations
            </Link>
            <p className="eyebrow">Explore {destination.name}</p>
            <h1>{destination.name}</h1>
            <p className="destination-lead">{destination.about}</p>
            <div className="destination-facts" aria-label={`${destination.name} information`}>
              <div><span>Capital</span><strong>{destination.capital}</strong></div>
              <div><span>Places listed</span><strong>{touristPlaces.length}</strong></div>
              <div><span>Best for</span><strong>Exploring</strong></div>
            </div>
          </div>
          <div className="destination-hero-image">
            <SafeImage
              className="detail-cover"
              sources={destination.img}
              alt={`Scenic view of ${destination.name}`}
              fallbackLabel={destination.name}
              width="760"
              height="760"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="stays-section">
          <div className="shell">
            <header className="places-heading">
              <div>
                <p className="eyebrow">Sample accommodation</p>
                <h2>Hotels and resorts in {destination.name}.</h2>
              </div>
              <p>Prices and room counts are example data for your Week 9 MVP, not live booking information.</p>
            </header>

            {accommodations.length > 0 ? (
              <div className="stay-grid">
                {accommodations.map((stay) => {
                  const isAvailable = stay.roomsAvailable > 0;

                  return (
                    <article className="stay-card" key={stay.id}>
                      <div className="stay-image-wrap">
                        <SafeImage
                          className="stay-image"
                          sources={[stay.image, ...destination.img]}
                          alt={`${stay.name} sample accommodation`}
                          fallbackLabel={stay.name}
                          loading="lazy"
                          width="640"
                          height="420"
                        />
                        <span className={`availability-badge ${isAvailable ? "available" : "unavailable"}`}>
                          {isAvailable ? `${stay.roomsAvailable} rooms available` : "Currently unavailable"}
                        </span>
                      </div>
                      <div className="stay-content">
                        <div className="stay-meta"><span>{stay.type}</span><span>{stay.rating} / 5</span></div>
                        <h3>{stay.name}</h3>
                        <p>{stay.area}</p>
                        <div className="stay-price">
                          <strong>{currencyFormatter.format(stay.pricePerNight)}</strong>
                          <span>per night</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Accommodation data is coming next</h3>
                <p>Kerala currently contains the first sample hotel and resort records.</p>
              </div>
            )}
          </div>
        </section>

        <section className="places-section">
          <div className="shell">
            <header className="places-heading">
              <div>
                <p className="eyebrow">Places to discover</p>
                <h2>Make time for these stops.</h2>
              </div>
              <p>These places come directly from the tourist information saved in `db.json`.</p>
            </header>

            {saveError?.placeName === "" && (
              <p className="error place-load-error" role="alert">{saveError.message}</p>
            )}

            {touristPlaces.length > 0 ? (
              <PlaceShowcase
                places={touristPlaces}
                user={user}
                savedPlaceNames={savedPlaceNames}
                savingPlaceName={savingPlaceName}
                saveError={saveError}
                onSave={handleSavePlace}
              />
            ) : (
              <div className="empty-state">
                <h3>No tourist places added yet</h3>
                <p>Add a `tourist` array for this state in `db.json`.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
