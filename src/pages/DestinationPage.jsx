import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import travelData from "../data/travelData.js";
import PlaceShowcase from "../components/PlaceShowcase.jsx";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import { buildTripEstimate, getDestinationHotels } from "../data/tripPlanning.js";
import { getAuthToken } from "../data/authStorage.js";

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

    const token = getAuthToken();
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
    const token = getAuthToken();
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
  const accommodations = getDestinationHotels(destination);
  const savedBudget = Number(localStorage.getItem("tripBudget")) || 0;
  const savedDays = Math.max(1, Number(localStorage.getItem("tripDays")) || 3);
  const tripEstimate = savedBudget ? buildTripEstimate(destination, savedDays, savedBudget) : null;
  const itinerary = Array.from({ length: savedDays }, (_, dayIndex) => ({
    day: dayIndex + 1,
    places: [
      touristPlaces[(dayIndex * 2) % touristPlaces.length],
      touristPlaces[(dayIndex * 2 + 1) % touristPlaces.length],
    ].filter((place, index, places) => place && places.findIndex((item) => item.name === place.name) === index),
  }));

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
              <div><span>Best for</span><strong>{destination.bestFor ?? "Exploring"}</strong></div>
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
              sizes="(max-width: 980px) 100vw, 50vw"
              fetchPriority="high"
            />
          </div>
        </section>

        <section className="trip-plan-section">
          <div className="shell">
            <header className="places-heading">
              <div>
                <p className="eyebrow">Your budget plan</p>
                <h2>{savedDays} days in {destination.name}.</h2>
              </div>
              <p>A practical starting itinerary based on your saved budget and the places available in this area.</p>
            </header>

            {!savedBudget ? (
              <div className="budget-empty">
                <h2>Set your trip budget first</h2>
                <p>Choose a budget and trip length so we can build an affordable plan for {destination.name}.</p>
                <Link className="button" to="/browse">Set my budget</Link>
              </div>
            ) : tripEstimate ? (
              <div className="trip-plan-layout">
                <aside className="plan-summary">
                  <p className="plan-summary-label">Estimated total</p>
                  <strong className="plan-total">{currencyFormatter.format(tripEstimate.estimatedTripCost)}</strong>
                  <p className="plan-budget-note">within your {currencyFormatter.format(savedBudget)} budget</p>
                  <dl className="plan-costs">
                    <div><dt>{tripEstimate.hotel.name}</dt><dd>{currencyFormatter.format(tripEstimate.hotelCost)}</dd></div>
                    <div><dt>{tripEstimate.nights} {tripEstimate.nights === 1 ? "night" : "nights"}</dt><dd>{currencyFormatter.format(tripEstimate.hotel.pricePerNight)}/night</dd></div>
                    <div><dt>Food, activities & local travel</dt><dd>{currencyFormatter.format(tripEstimate.dailyExpenses * savedDays)}</dd></div>
                    <div className="plan-money-left"><dt>Money left</dt><dd>{currencyFormatter.format(savedBudget - tripEstimate.estimatedTripCost)}</dd></div>
                  </dl>
                  <small>Planning estimate only; live prices may vary.</small>
                </aside>

                <div className="day-plan-list">
                  {itinerary.map(({ day, places }) => (
                    <article className="day-plan" key={day}>
                      <div className="day-number"><span>Day</span><strong>{String(day).padStart(2, "0")}</strong></div>
                      <div>
                        <h3>{places.length ? places.map((place) => place.name).join(" & ") : "Explore the local area"}</h3>
                        <p>{day === 1 ? `Check in at ${tripEstimate.hotel.name}, then start exploring.` : "Continue from your hotel and discover more of the area."}</p>
                        <div className="day-stops">
                          {places.map((place) => place.location ? (
                            <a key={place.name} href={place.location} target="_blank" rel="noreferrer">{place.name} <span aria-hidden="true">↗</span></a>
                          ) : <span key={place.name}>{place.name}</span>)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="budget-empty">
                <h2>This trip needs a little more budget</h2>
                <p>No available sample hotel fits {currencyFormatter.format(savedBudget)} for {savedDays} days. Increase the budget or shorten the trip.</p>
                <Link className="button" to="/browse">Change my budget</Link>
              </div>
            )}
          </div>
        </section>

        <section className="stays-section">
          <div className="shell">
            <header className="places-heading">
              <div>
                <p className="eyebrow">Sample accommodation</p>
                <h2>Hotels and resorts in {destination.name}.</h2>
              </div>
              <p>Sample planning estimates only. Prices and availability are not live booking information.</p>
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
                          sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 34vw"
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
                <h3>No accommodation estimates available</h3>
                <p>Hotel options for this destination will be added soon.</p>
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
              <p>These places come directly from the saved tourist information.</p>
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
                <p>Tourist information for this state will be added soon.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
