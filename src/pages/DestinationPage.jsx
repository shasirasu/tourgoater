import { useEffect, useState } from "react";
import { BedDouble, BookmarkCheck, Check, ChevronRight, Clock3, Crosshair, ExternalLink, MapPin, Plane, Search, ShoppingCart, WalletCards } from "lucide-react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import travelData from "../data/travelData.js";
import PlaceShowcase from "../components/PlaceShowcase.jsx";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import { buildTripEstimate } from "../data/tripPlanning.js";
import { getAuthToken } from "../data/authStorage.js";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DestinationPage({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingTripId = searchParams.get("editTrip");
  const destination = travelData.state.find((state) => state.id === id);

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
  const [selectedFlightId, setSelectedFlightId] = useState("");
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightError, setFlightError] = useState("");
  const [liveHotels, setLiveHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [hotelsLoading, setHotelsLoading] = useState(false);
  const [hotelsError, setHotelsError] = useState("");
  const [hotelCheckIn, setHotelCheckIn] = useState(() => localStorage.getItem("hotelCheckIn") || "");
  const [hotelCheckOut, setHotelCheckOut] = useState(() => localStorage.getItem("hotelCheckOut") || "");
  const [hotelAdults, setHotelAdults] = useState(() => localStorage.getItem("hotelAdults") || "2");
  const [planVersion, setPlanVersion] = useState(0);
  const [savingTrip, setSavingTrip] = useState(false);
  const [tripSaveStatus, setTripSaveStatus] = useState("");

  useEffect(() => {
    if (!user || !destination || !editingTripId) return;
    fetch("/api/plans/trips", { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load this saved plan");
        const trip = data.trips.find((item) => String(item.id) === editingTripId && item.destination_key === destination.id);
        if (!trip) throw new Error("Saved plan not found");
        const parseSavedJson = (value) => typeof value === "string" ? JSON.parse(value) : value;
        const places = parseSavedJson(trip.places_json) || [];
        const flight = parseSavedJson(trip.flight_json);
        const hotel = parseSavedJson(trip.hotel_json);
        const days = Math.max(1, Math.round((new Date(`${trip.check_out}T12:00:00`) - new Date(`${trip.check_in}T12:00:00`)) / 86400000));
        setSelectedPlaceNames(places.map((place) => place.name));
        setPlannerBudget(String(trip.budget));
        setPlannerDays(String(days));
        setDepartureCity(trip.departure_city);
        setDepartureDate(String(trip.departure_date).slice(0, 10));
        if (flight?.departure) setDepartureTime(new Date(flight.departure).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }));
        setHotelCheckIn(String(trip.check_in).slice(0, 10));
        setHotelCheckOut(String(trip.check_out).slice(0, 10));
        setHotelAdults(String(trip.travelers));
        setFlightOffers(flight ? [flight] : []);
        setSelectedFlightId(flight?.id || "");
        setLiveHotels(hotel ? [hotel] : []);
        setSelectedHotelId(hotel?.id || "");
        setPlannerStep(2);
        setTripSaveStatus("Editing your saved plan. Your changes will update this plan.");
        localStorage.setItem("tripBudget", String(trip.budget));
        localStorage.setItem("tripDays", String(days));
        localStorage.setItem(`tripPlaces:${destination.id}`, JSON.stringify(places.map((place) => place.name)));
      })
      .catch((requestError) => setTripSaveStatus(requestError.message));
  }, [destination, editingTripId, user]);

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
    setSelectedFlightId("");
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

  async function searchLiveHotels(checkIn = hotelCheckIn, checkOut = hotelCheckOut, adults = hotelAdults) {
    if (!checkIn || !checkOut) {
      setHotelsError("Choose check-in and check-out dates first.");
      return;
    }
    setHotelsLoading(true);
    setHotelsError("");
    setLiveHotels([]);
    setSelectedHotelId("");
    try {
      const params = new URLSearchParams({
        destination: destination.name,
        checkIn,
        checkOut,
        adults,
      });
      const response = await fetch(`/api/hotels?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load hotels");
      setLiveHotels(data.hotels || []);
      if (!data.hotels?.length) setHotelsError("No live hotels were found for these dates.");
    } catch (error) {
      setHotelsError(error.message);
    } finally {
      setHotelsLoading(false);
    }
  }

  function handleHotelSearch(event) {
    event.preventDefault();
    localStorage.setItem("hotelCheckIn", hotelCheckIn);
    localStorage.setItem("hotelCheckOut", hotelCheckOut);
    localStorage.setItem("hotelAdults", hotelAdults);
    searchLiveHotels();
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
    const tripCheckOut = new Date(`${departureDate}T12:00:00`);
    tripCheckOut.setDate(tripCheckOut.getDate() + normalizedDays);
    const tripCheckOutValue = tripCheckOut.toISOString().slice(0, 10);
    setHotelCheckIn(departureDate);
    setHotelCheckOut(tripCheckOutValue);
    searchLiveHotels(departureDate, tripCheckOutValue, hotelAdults);
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
  const savedBudget = Number(localStorage.getItem("tripBudget")) || 0;
  const savedDays = Math.max(1, Number(localStorage.getItem("tripDays")) || 3);
  const selectedPlaces = touristPlaces.filter((place) => selectedPlaceNames.includes(place.name));
  const itineraryPlaces = selectedPlaces.length ? selectedPlaces : touristPlaces;
  const tripEstimate = savedBudget ? buildTripEstimate(destination, savedDays, savedBudget) : null;
  const selectedFlight = flightOffers.find((flight) => flight.id === selectedFlightId) || null;
  const selectedHotel = liveHotels.find((hotel) => hotel.id === selectedHotelId) || null;
  const travelerCount = Math.max(1, Number(hotelAdults) || 1);
  const liveHotelNights = hotelCheckIn && hotelCheckOut
    ? Math.max(1, Math.round((new Date(`${hotelCheckOut}T12:00:00`) - new Date(`${hotelCheckIn}T12:00:00`)) / 86400000))
    : Math.max(1, savedDays - 1);
  const selectedFlightCost = selectedFlight ? selectedFlight.price * travelerCount : 0;
  const selectedHotelCost = selectedHotel ? (selectedHotel.totalPrice || selectedHotel.pricePerNight * liveHotelNights) : 0;
  const planningHotelCost = tripEstimate?.hotelCost || 0;
  const activityCost = (tripEstimate?.dailyExpenses || 0) * savedDays;
  const tripBudgetCost = activityCost + (selectedHotel ? selectedHotelCost : planningHotelCost);
  const budgetPlanTotal = tripBudgetCost + selectedFlightCost;
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

  async function saveCompletePlan() {
    if (!user) {
      setTripSaveStatus("Log in to save your complete plan.");
      return;
    }
    if (!selectedPlaces.length || !selectedFlight || !selectedHotel) {
      setTripSaveStatus("Select at least one place, one flight, and one hotel first.");
      return;
    }
    setSavingTrip(true);
    setTripSaveStatus("");
    try {
      const response = await fetch(editingTripId ? `/api/plans/trips/${editingTripId}` : "/api/plans/trips", {
        method: editingTripId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          destinationKey: destination.id,
          destinationName: destination.name,
          places: selectedPlaces.map(({ name, location }) => ({ name, location: location || null })),
          flight: selectedFlight,
          hotel: selectedHotel,
          departureCity: departureCity.trim(),
          departureDate,
          checkIn: hotelCheckIn,
          checkOut: hotelCheckOut,
          travelers: travelerCount,
          budget: savedBudget,
          totalCost: budgetPlanTotal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save this plan");
      setTripSaveStatus(editingTripId ? "Plan updated. Your saved plan now has these changes." : "Plan saved. You can find it in Saved plan.");
    } catch (error) {
      setTripSaveStatus(error.message);
    } finally {
      setSavingTrip(false);
    }
  }

  function openOverallBooking() {
    if (!selectedFlight || !selectedHotel) {
      setTripSaveStatus("Select a flight and hotel before booking.");
      return;
    }
    const booking = {
      destinationId: destination.id,
      destinationName: destination.name,
      destinationImage: destination.img,
      places: selectedPlaces.map(({ name, location }) => ({ name, location })),
      flight: selectedFlight,
      hotel: selectedHotel,
      departureCity: departureCity.trim(),
      departureDate,
      checkIn: hotelCheckIn,
      checkOut: hotelCheckOut,
      travelers: travelerCount,
      stayActivityBudget: savedBudget,
      stayActivityCost: tripBudgetCost,
      travelAddon: selectedFlightCost,
      overallTotal: budgetPlanTotal,
    };
    sessionStorage.setItem("pendingOverallBooking", JSON.stringify(booking));
    navigate("/booking", { state: { booking } });
  }

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
                  <h2>Build your trip in four clear steps.</h2>
                </div>
                <ol className="plan-steps" aria-label="Trip planning steps">
                  <li className={plannerStep === 1 ? "is-active" : "is-complete"}><span>{plannerStep > 1 ? <Check size={15} /> : "1"}</span> Select places</li>
                  <li className={plannerStep === 2 && !flightOffers.length ? "is-active" : flightOffers.length ? "is-complete" : ""}><span>{flightOffers.length ? <Check size={15} /> : "2"}</span> Budget</li>
                  <li className={flightOffers.length && !selectedFlight ? "is-active" : selectedFlight ? "is-complete" : ""}><span>{selectedFlight ? <Check size={15} /> : "3"}</span> Live flights</li>
                  <li className={selectedFlight && !selectedHotel ? "is-active" : selectedHotel ? "is-complete" : ""}><span>{selectedHotel ? <Check size={15} /> : "4"}</span> Hotels</li>
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
                  <label><span>Stay & activity budget</span><div><b>₹</b><input type="number" min="1000" step="500" value={plannerBudget} onChange={(event) => setPlannerBudget(event.target.value)} placeholder="25000" required /></div><small>Live flight travel is calculated separately as an add-on.</small></label>
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
                        <article className={`flight-offer ${selectedFlightId === flight.id ? "is-selected" : ""}`} key={flight.id}>
                          <div className="flight-airline"><span><Plane size={18} /></span><div><strong>{flight.airline}</strong><small>{flight.flightNumber}</small></div></div>
                          <div className="flight-schedule">
                            <div><strong>{new Date(flight.departure).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong><span>{flight.origin}{flight.departureTerminal ? ` · T${flight.departureTerminal}` : ""}</span></div>
                            <div className="flight-duration"><small>{flight.duration.startsWith("PT") ? flight.duration.replace("PT", "").toLowerCase() : flight.duration}</small><i /><span>{flight.stops ? `${flight.stops} stop${flight.stops > 1 ? "s" : ""}` : "Non-stop"}</span></div>
                            <div><strong>{new Date(flight.arrival).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong><span>{flight.destination}{flight.arrivalTerminal ? ` · T${flight.arrivalTerminal}` : ""}</span></div>
                          </div>
                          <div className="flight-offer-price"><strong>{currencyFormatter.format(flight.price)}</strong><span>per adult</span>{flight.seats && <small>{flight.seats} seats left</small>}<button type="button" onClick={() => setSelectedFlightId((current) => current === flight.id ? "" : flight.id)}>{selectedFlightId === flight.id ? <><Check size={15} /> Selected</> : "Select flight"}</button></div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="flight-search-hint">Complete Step 2 to search flights for your selected date.</p>
                  )}
                </section>
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
                <p className="eyebrow">Live accommodation</p>
                <h2>Hotels available in {destination.name}.</h2>
              </div>
              <p>Search Google Hotels using your selected travel dates and compare current nightly prices.</p>
            </header>

            <form className="hotel-search-form" onSubmit={handleHotelSearch}>
              <label><span>Check in</span><input type="date" min={new Date().toISOString().slice(0, 10)} value={hotelCheckIn} onChange={(event) => setHotelCheckIn(event.target.value)} required /></label>
              <label><span>Check out</span><input type="date" min={hotelCheckIn || new Date().toISOString().slice(0, 10)} value={hotelCheckOut} onChange={(event) => setHotelCheckOut(event.target.value)} required /></label>
              <label><span>Guests</span><select value={hotelAdults} onChange={(event) => setHotelAdults(event.target.value)}><option value="1">1 adult</option><option value="2">2 adults</option><option value="3">3 adults</option><option value="4">4 adults</option><option value="5">5 adults</option><option value="6">6 adults</option></select></label>
              <button className="button" type="submit" disabled={hotelsLoading}><Search size={17} /> {hotelsLoading ? "Searching..." : "Search live hotels"}</button>
            </form>

            {hotelsLoading ? (
              <div className="hotel-loading" role="status"><span /> Searching live hotel availability...</div>
            ) : hotelsError ? (
              <div className="hotel-api-message" role="alert"><BedDouble size={23} /><div><strong>Live hotels unavailable</strong><p>{hotelsError}</p></div><button type="button" onClick={searchLiveHotels}>Try again</button></div>
            ) : liveHotels.length > 0 && (
              <div className="live-hotel-grid">
                {liveHotels.map((hotel) => {
                  const hotelSearch = `https://www.google.com/travel/hotels?q=${encodeURIComponent(`${hotel.name}, ${destination.name}`)}`;
                  return (
                    <article className={`live-hotel-card ${selectedHotelId === hotel.id ? "is-selected" : ""}`} key={hotel.id}>
                      <div className="live-hotel-image">
                        <SafeImage sources={[hotel.image, ...destination.img].filter(Boolean)} alt={hotel.name} fallbackLabel={hotel.name} loading="lazy" width="640" height="420" />
                        <span>Live price</span>
                      </div>
                      <div className="live-hotel-content">
                        <div className="live-hotel-meta"><span>{hotel.type}</span>{hotel.rating && <span>★ {hotel.rating} ({hotel.reviews})</span>}</div>
                        <h3>{hotel.name}</h3>
                        {hotel.description && <p>{hotel.description}</p>}
                        {hotel.amenities.length > 0 && <div className="hotel-amenities">{hotel.amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div>}
                        <div className="live-hotel-footer">
                          <div><strong>{hotel.pricePerNight ? currencyFormatter.format(hotel.pricePerNight) : "Check price"}</strong><span>{hotel.pricePerNight ? "per night" : "on Google Hotels"}</span></div>
                          <div className="live-hotel-actions"><button type="button" disabled={!hotel.pricePerNight && !hotel.totalPrice} onClick={() => setSelectedHotelId((current) => current === hotel.id ? "" : hotel.id)}>{selectedHotelId === hotel.id ? <><Check size={15} /> Selected</> : "Select hotel"}</button><a href={hotel.bookingLink || hotelSearch} target="_blank" rel="noopener noreferrer">View <ExternalLink size={15} /></a></div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!hotelsLoading && !hotelsError && liveHotels.length === 0 && (
              <div className="empty-state hotel-search-empty">
                <BedDouble size={30} />
                <h3>Search real hotels for your dates</h3>
                <p>Choose check-in and check-out dates above. Only live API results will appear here.</p>
              </div>
            )}
          </div>
        </section>

        {savedBudget && tripEstimate && selectedFlight && selectedHotel && (
          <section className="overall-total-section" aria-labelledby="overall-total-title">
            <div className="shell">
              <header className="places-heading">
                <div>
                  <p className="eyebrow">Your complete trip</p>
                  <h2 id="overall-total-title">Overall total and itinerary.</h2>
                </div>
                <p>Your final total updates when you select a live flight and hotel.</p>
              </header>
              <div className="trip-plan-layout">
                <aside className="plan-summary">
                  <p className="plan-summary-label">Overall total</p>
                  <strong className="plan-total">{currencyFormatter.format(budgetPlanTotal)}</strong>
                  <p className={`plan-budget-note ${tripBudgetCost > savedBudget ? "is-over" : ""}`}>{tripBudgetCost > savedBudget ? `${currencyFormatter.format(tripBudgetCost - savedBudget)} over` : "within"} your {currencyFormatter.format(savedBudget)} stay & activity budget</p>
                  <dl className="plan-costs">
                    <div><dt>Stay & activity budget</dt><dd>{currencyFormatter.format(savedBudget)}</dd></div>
                    <div><dt>{selectedHotel.name}</dt><dd>{currencyFormatter.format(selectedHotelCost)}</dd></div>
                    <div><dt>{liveHotelNights} {liveHotelNights === 1 ? "night" : "nights"}</dt><dd>{currencyFormatter.format(selectedHotel.pricePerNight)}/night</dd></div>
                    <div><dt>Food, activities & local travel</dt><dd>{currencyFormatter.format(activityCost)}</dd></div>
                    <div className={`plan-money-left ${tripBudgetCost > savedBudget ? "is-over" : ""}`}><dt>{tripBudgetCost > savedBudget ? "Trip budget exceeded" : "Trip budget left"}</dt><dd>{currencyFormatter.format(Math.abs(savedBudget - tripBudgetCost))}</dd></div>
                    <div className="plan-travel-addon"><dt>Travel add-on · {selectedFlight.airline} · {travelerCount} {travelerCount === 1 ? "traveler" : "travelers"}</dt><dd>+{currencyFormatter.format(selectedFlightCost)}</dd></div>
                  </dl>
                  <p className="travel-budget-disclaimer"><strong>Travel add-on:</strong> Flight cost is separate from your stay & activity budget and is added to calculate the overall total. Live prices may change.</p>
                  <div className="complete-plan-actions">
                    <button type="button" onClick={saveCompletePlan} disabled={savingTrip || !selectedPlaces.length || !selectedFlight || !selectedHotel}><BookmarkCheck size={17} /> {savingTrip ? "Saving..." : editingTripId ? "Update plan" : "Save plan"}</button>
                    <button type="button" onClick={openOverallBooking} disabled={!selectedFlight || !selectedHotel}><ShoppingCart size={17} /> Overall booking</button>
                  </div>
                  {tripSaveStatus && <p className="complete-plan-status" role="status">{tripSaveStatus} {tripSaveStatus.startsWith("Plan saved") && <Link to="/saved">View saved plan →</Link>}</p>}
                </aside>
                <div className="day-plan-list">
                  {itinerary.map(({ day, places }) => (
                    <article className="day-plan" key={day}>
                      <div className="day-number"><span>Day</span><strong>{String(day).padStart(2, "0")}</strong></div>
                      <div>
                        <h3>{places.length ? places.map((place) => place.name).join(" & ") : "Explore the local area"}</h3>
                        <p>{day === 1 ? `Check in at ${selectedHotel?.name || tripEstimate.hotel.name}, then start exploring.` : "Continue from your hotel and discover more of the area."}</p>
                        <div className="day-stops">
                          {places.map((place) => place.location ? <a key={place.name} href={place.location} target="_blank" rel="noreferrer">{place.name} <span aria-hidden="true">↗</span></a> : <span key={place.name}>{place.name}</span>)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

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
