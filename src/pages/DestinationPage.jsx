import { useEffect, useState } from "react";
import { Check, ChevronRight, Clock3, Crosshair, ExternalLink, MapPin, Plane, Search, WalletCards } from "lucide-react";
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

  function bookingLinks(stay) {
    const destinationQuery = `${stay.type || "hotel"} in ${stay.area}, ${destination.name}, India`;
    return {
      google: `https://www.google.com/travel/hotels?q=${encodeURIComponent(destinationQuery)}`,
      booking: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${stay.area}, ${destination.name}, India`)}`,
    };
  }
  const [savedPlaceNames, setSavedPlaceNames] = useState(new Set());
  const [savingPlaceName, setSavingPlaceName] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [plannerStep, setPlannerStep] = useState(1);
  const [selectedPlaceNames, setSelectedPlaceNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`tripPlaces:${id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [plannerBudget, setPlannerBudget] = useState(() => localStorage.getItem("tripBudget") || "");
  const [plannerDays, setPlannerDays] = useState(() => localStorage.getItem("tripDays") || "3");
  const [departureCity, setDepartureCity] = useState(() => localStorage.getItem("tripDepartureCity") || "");
  const [departureDate, setDepartureDate] = useState(() => localStorage.getItem("tripDepartureDate") || "");
  const [departureTime, setDepartureTime] = useState(() => localStorage.getItem("tripDepartureTime") || "09:00");
  const [locationStatus, setLocationStatus] = useState("");
  const [flightOffers, setFlightOffers] = useState([]);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState("");
  const [planVersion, setPlanVersion] = useState(0);

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

  function togglePlannerPlace(placeName) {
    setSelectedPlaceNames((current) => current.includes(placeName)
      ? current.filter((name) => name !== placeName)
      : [...current, placeName]);
  }

  function continueToBudget() {
    if (!selectedPlaceNames.length) return;
    localStorage.setItem(`tripPlaces:${id}`, JSON.stringify(selectedPlaceNames));
    setPlannerStep(2);
  }

  async function searchLiveFlights() {
    setFlightLoading(true);
    setFlightError("");
    setFlightOffers([]);
    try {
      const params = new URLSearchParams({ origin: departureCity.trim(), destination: destination.capital, date: departureDate });
      const response = await fetch(`/api/flights?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load flights");
      setFlightOffers(data.offers || []);
      if (!data.offers?.length) setFlightError("No flights were found for this route and date.");
    } catch (error) {
      setFlightError(error.message);
    } finally {
      setFlightLoading(false);
    }
  }

  function buildSelectedPlan(event) {
    event.preventDefault();
    const normalizedBudget = Math.max(1000, Number(plannerBudget) || 0);
    const normalizedDays = Math.min(30, Math.max(1, Number(plannerDays) || 1));
    setPlannerBudget(String(normalizedBudget));
    setPlannerDays(String(normalizedDays));
    localStorage.setItem("tripBudget", String(normalizedBudget));
    localStorage.setItem("tripDays", String(normalizedDays));
    localStorage.setItem("tripDepartureCity", departureCity.trim());
    localStorage.setItem("tripDepartureDate", departureDate);
    localStorage.setItem("tripDepartureTime", departureTime);
    localStorage.setItem(`tripPlaces:${id}`, JSON.stringify(selectedPlaceNames));
    setPlanVersion((version) => version + 1);
    searchLiveFlights();
  }

  function useLiveLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Live location is not supported by this browser.");
      return;
    }

    setLocationStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        if (!response.ok) throw new Error("Location name unavailable");
        const result = await response.json();
        const address = result.address || {};
        const city = address.city || address.town || address.village || address.suburb || address.county || address.state_district;
        if (!city) throw new Error("Could not identify your city");
        setDepartureCity(city);
        localStorage.setItem("tripDepartureCity", city);
        setLocationStatus(`Using your current location: ${city}`);
      } catch {
        setLocationStatus("We found your position but could not identify the city. Please enter it manually.");
      }
    }, (error) => {
      const message = error.code === error.PERMISSION_DENIED
        ? "Location permission was denied. Please allow it or enter your city manually."
        : "Could not get your live location. Please enter your city manually.";
      setLocationStatus(message);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
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
  const selectedPlaces = touristPlaces.filter((place) => selectedPlaceNames.includes(place.name));
  const itineraryPlaces = selectedPlaces.length ? selectedPlaces : touristPlaces;
  const tripEstimate = savedBudget ? buildTripEstimate(destination, savedDays, savedBudget) : null;
  const flightDurationMinutes = 110 + (Number(destination.id) % 5) * 25;
  const departureDateTime = departureDate && departureTime ? new Date(`${departureDate}T${departureTime}:00`) : null;
  const airportArrival = departureDateTime ? new Date(departureDateTime.getTime() - 2 * 60 * 60 * 1000) : null;
  const destinationArrival = departureDateTime ? new Date(departureDateTime.getTime() + flightDurationMinutes * 60 * 1000) : null;
  const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const flightSearchUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${departureCity || "my city"} to ${destination.capital} on ${departureDate || "my travel date"}`)}`;
  const itinerary = Array.from({ length: savedDays }, (_, dayIndex) => ({
    day: dayIndex + 1,
    places: [
      itineraryPlaces[(dayIndex * 2) % itineraryPlaces.length],
      itineraryPlaces[(dayIndex * 2 + 1) % itineraryPlaces.length],
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
            <div className="plan-builder" key={planVersion}>
              <header className="plan-builder-header">
                <div>
                  <p className="eyebrow">Build your route</p>
                  <h2>Choose stops, then set your budget.</h2>
                </div>
                <ol className="plan-steps" aria-label="Trip planning steps">
                  <li className={plannerStep === 1 ? "is-active" : "is-complete"}><span>{plannerStep > 1 ? <Check size={15} /> : "1"}</span> Select places</li>
                  <li className={plannerStep === 2 ? "is-active" : ""}><span>2</span> Set budget</li>
                </ol>
              </header>

              {plannerStep === 1 ? (
                <div className="place-picker-step">
                  <p>Select the particular places you want to visit in {destination.name}.</p>
                  <div className="place-picker-grid">
                    {touristPlaces.map((place) => {
                      const isSelected = selectedPlaceNames.includes(place.name);
                      return (
                        <button className={isSelected ? "is-selected" : ""} type="button" key={place.name} onClick={() => togglePlannerPlace(place.name)} aria-pressed={isSelected}>
                          <SafeImage sources={place.images} alt="" fallbackLabel={place.name} loading="lazy" width="220" height="150" />
                          <span><MapPin size={16} /><strong>{place.name}</strong></span>
                          <i>{isSelected ? <Check size={16} /> : "+"}</i>
                        </button>
                      );
                    })}
                  </div>
                  <div className="planner-action-row">
                    <span>{selectedPlaceNames.length} {selectedPlaceNames.length === 1 ? "place" : "places"} selected</span>
                    <button className="button" type="button" disabled={!selectedPlaceNames.length} onClick={continueToBudget}>Next: set budget <ChevronRight size={17} /></button>
                  </div>
                </div>
              ) : (
                <form className="planner-budget-step" onSubmit={buildSelectedPlan}>
                  <button className="planner-back" type="button" onClick={() => setPlannerStep(1)}>← Change places</button>
                  <div className="selected-stop-summary">
                    <MapPin size={21} />
                    <div><strong>{selectedPlaceNames.length} selected stops</strong><span>{selectedPlaceNames.join(" · ")}</span></div>
                  </div>
                  <label><span>Total trip budget</span><div><b>₹</b><input type="number" min="1000" step="500" value={plannerBudget} onChange={(event) => setPlannerBudget(event.target.value)} placeholder="25000" required /></div></label>
                  <label><span>Number of days</span><div><input type="number" min="1" max="30" value={plannerDays} onChange={(event) => setPlannerDays(event.target.value)} required /><b>days</b></div></label>
                  <label className="departure-location-field"><span>Flying from</span><div><Plane size={17} /><input type="text" value={departureCity} onChange={(event) => setDepartureCity(event.target.value)} placeholder="Chennai" required /><button type="button" onClick={useLiveLocation} title="Use my live location" aria-label="Use my live location"><Crosshair size={17} /></button></div>{locationStatus && <small role="status">{locationStatus}</small>}</label>
                  <label><span>Travel date</span><div><input type="date" min={new Date().toISOString().slice(0, 10)} value={departureDate} onChange={(event) => setDepartureDate(event.target.value)} required /></div></label>
                  <label><span>Flight departure time</span><div><Clock3 size={17} /><input type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} required /></div></label>
                  <button className="button" type="submit"><WalletCards size={17} /> Make my budget plan</button>
                </form>
              )}
            </div>

            <header className="places-heading">
              <div>
                <p className="eyebrow">Your budget plan</p>
                <h2>{savedDays} days in {destination.name}.</h2>
              </div>
              <p>A practical itinerary based on your budget and {selectedPlaces.length ? "the places you selected" : "the places available in this area"}.</p>
            </header>

            {!savedBudget ? (
              <div className="budget-empty">
                <h2>Set your trip budget first</h2>
                <p>Choose a budget and trip length so we can build an affordable plan for {destination.name}.</p>
                <Link className="button" to="/browse">Set my budget</Link>
              </div>
            ) : tripEstimate ? (
              <>
                {destinationArrival && departureCity && (
                  <article className="flight-timeline">
                    <div className="flight-route-heading">
                      <span><Plane size={20} /></span>
                      <div><p>Estimated flight timeline</p><h3>{departureCity} → {destination.capital}</h3></div>
                      <a href={flightSearchUrl} target="_blank" rel="noopener noreferrer">Check live flights <ExternalLink size={15} /></a>
                    </div>
                    <div className="flight-time-points">
                      <div><small>Reach airport</small><strong>{dateTimeFormatter.format(airportArrival)}</strong><span>2 hours before departure</span></div>
                      <i aria-hidden="true"><Plane size={18} /></i>
                      <div><small>Flight departs</small><strong>{dateTimeFormatter.format(departureDateTime)}</strong><span>Selected time</span></div>
                      <i aria-hidden="true"><Clock3 size={18} /></i>
                      <div><small>Arrive in {destination.capital}</small><strong>{dateTimeFormatter.format(destinationArrival)}</strong><span>About {Math.floor(flightDurationMinutes / 60)}h {flightDurationMinutes % 60}m flying</span></div>
                    </div>
                    <p className="flight-disclaimer">Planning estimate only. Actual departure, duration, connections and arrival depend on the flight you book.</p>
                  </article>
                )}
                <section className="live-flight-results" aria-labelledby="live-flights-title">
                  <header>
                    <div><p className="eyebrow">Available flights</p><h3 id="live-flights-title">Live flight offers</h3></div>
                    {!flightLoading && departureDate && <button type="button" onClick={searchLiveFlights}><Search size={16} /> Search again</button>}
                  </header>
                  {flightLoading ? (
                    <div className="flight-loading" role="status"><span /> Searching airlines for the best available flights...</div>
                  ) : flightError ? (
                    <div className="flight-api-message" role="alert"><Plane size={22} /><div><strong>Flights are not available yet</strong><p>{flightError}</p></div></div>
                  ) : flightOffers.length ? (
                    <div className="flight-offer-list">
                      {flightOffers.map((flight) => (
                        <article className="flight-offer" key={flight.id}>
                          <div className="flight-airline"><span><Plane size={18} /></span><div><strong>{flight.airline}</strong><small>{flight.flightNumber}</small></div></div>
                          <div className="flight-schedule">
                            <div><strong>{new Date(flight.departure).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong><span>{flight.origin}{flight.departureTerminal ? ` · T${flight.departureTerminal}` : ""}</span></div>
                            <div className="flight-duration"><small>{flight.duration.startsWith("PT") ? flight.duration.replace("PT", "").toLowerCase() : flight.duration}</small><i /><span>{flight.stops ? `${flight.stops} stop${flight.stops > 1 ? "s" : ""}` : "Non-stop"}</span></div>
                            <div><strong>{new Date(flight.arrival).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong><span>{flight.destination}{flight.arrivalTerminal ? ` · T${flight.arrivalTerminal}` : ""}</span></div>
                          </div>
                          <div className="flight-offer-price"><strong>{currencyFormatter.format(flight.price)}</strong><span>per adult</span>{flight.seats && <small>{flight.seats} seats left</small>}</div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="flight-search-hint">Complete Step 2 to search flights for your selected date.</p>
                  )}
                </section>
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
              </>
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
                  const providers = bookingLinks(stay);

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
                        <div className="booking-options" aria-label={`Booking options for stays near ${stay.area}`}>
                          <span>Check live availability</span>
                          <div>
                            <a href={providers.google} target="_blank" rel="noopener noreferrer"><Search size={16} /> Google Hotels</a>
                            <a href={providers.booking} target="_blank" rel="noopener noreferrer">Booking.com <ExternalLink size={15} /></a>
                          </div>
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
