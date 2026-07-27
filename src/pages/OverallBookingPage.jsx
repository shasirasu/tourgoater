import { useMemo, useState } from "react";
import { BedDouble, CheckCircle2, MapPin, Plane, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SafeImage from "../components/SafeImage.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function OverallBookingPage({ user, onLogout }) {
  const location = useLocation();
  const booking = useMemo(() => {
    if (location.state?.booking) return location.state.booking;
    try { return JSON.parse(sessionStorage.getItem("pendingOverallBooking") || "null"); } catch { return null; }
  }, [location.state]);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  if (!booking) return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="booking-page shell" id="main-content">
        <div className="booking-empty"><h1>No booking selected.</h1><p>Choose a flight and hotel from a destination plan first.</p><Link className="button" to="/browse">Explore destinations</Link></div>
      </main>
      <SiteFooter />
    </>
  );

  function confirmBooking(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBookingDetails(Object.fromEntries(form.entries()));
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <SiteHeader user={user} onLogout={onLogout} />
      <main className="booking-page" id="main-content">
        <section className="booking-hero shell">
          <div><p className="eyebrow">Tourgoater checkout</p><h1>Review your overall booking.</h1><p>Everything stays inside your application while you review the complete plan.</p></div>
          <SafeImage sources={booking.destinationImage} alt={booking.destinationName} fallbackLabel={booking.destinationName} width="720" height="420" />
        </section>

        <div className="booking-layout shell">
          <div className="booking-details">
            {confirmed && <div className="booking-confirmed" role="status"><CheckCircle2 size={28} /><div><strong>Booking inquiry submitted</strong><p>Your {booking.destinationName} booking request has been recorded for {bookingDetails?.travelerName}. We will use {bookingDetails?.phone} and {bookingDetails?.email} for booking updates.</p></div></div>}
            {confirmed && bookingDetails && <section className="booking-panel booking-inquiry-summary"><header><Users size={21} /><div><p>Traveler details</p><h2>Contact and inquiry</h2></div></header><dl><div><dt>Name</dt><dd>{bookingDetails.travelerName}</dd></div><div><dt>Phone</dt><dd>{bookingDetails.phone}</dd></div><div><dt>Email</dt><dd>{bookingDetails.email}</dd></div><div><dt>Address</dt><dd>{bookingDetails.address}, {bookingDetails.city} - {bookingDetails.postalCode}</dd></div><div><dt>Inquiry</dt><dd>{bookingDetails.inquiry || "No special requests"}</dd></div></dl></section>}
            <section className="booking-panel"><header><Plane size={21} /><div><p>Travel add-on</p><h2>{booking.departureCity} → {booking.destinationName}</h2></div></header><dl><div><dt>Airline</dt><dd>{booking.flight.airline} · {booking.flight.flightNumber}</dd></div><div><dt>Departure</dt><dd>{new Date(booking.flight.departure).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</dd></div><div><dt>Travelers</dt><dd>{booking.travelers}</dd></div><div><dt>Flight total</dt><dd>{money.format(booking.travelAddon)}</dd></div></dl></section>
            <section className="booking-panel"><header><BedDouble size={21} /><div><p>Hotel</p><h2>{booking.hotel.name}</h2></div></header><dl><div><dt>Check in</dt><dd>{new Date(`${booking.checkIn}T12:00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" })}</dd></div><div><dt>Check out</dt><dd>{new Date(`${booking.checkOut}T12:00:00`).toLocaleDateString("en-IN", { dateStyle: "medium" })}</dd></div><div><dt>Guests</dt><dd>{booking.travelers}</dd></div><div><dt>Hotel total</dt><dd>{money.format(booking.hotel.totalPrice || booking.hotel.pricePerNight)}</dd></div></dl></section>
            <section className="booking-panel"><header><MapPin size={21} /><div><p>Itinerary</p><h2>Selected places</h2></div></header><div className="booking-places">{booking.places.map((place) => <span key={place.name}>{place.name}</span>)}</div></section>
          </div>

          <aside className="booking-checkout">
            <p className="eyebrow">Payment summary</p><h2>{booking.destinationName}</h2>
            <dl><div><dt>Stay & activities</dt><dd>{money.format(booking.stayActivityCost)}</dd></div><div className="booking-addon"><dt>Travel add-on</dt><dd>+{money.format(booking.travelAddon)}</dd></div><div className="booking-grand-total"><dt>Overall total</dt><dd>{money.format(booking.overallTotal)}</dd></div></dl>
            <p className="booking-disclaimer"><ShieldCheck size={16} /> Flight travel is an add-on above your stay & activity budget of {money.format(booking.stayActivityBudget)}.</p>
            {!confirmed ? <form onSubmit={confirmBooking}>
              <label><span>Lead traveler name</span><input name="travelerName" defaultValue={user?.name || ""} autoComplete="name" required /></label>
              <label><span>Contact email</span><input name="email" type="email" defaultValue={user?.email || ""} autoComplete="email" required /></label>
              <label><span>Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" pattern="[+0-9 ()-]{8,20}" required /></label>
              <label><span>Full address</span><textarea name="address" autoComplete="street-address" placeholder="House number, street and area" rows="3" required /></label>
              <div className="booking-form-row"><label><span>City</span><input name="city" autoComplete="address-level2" required /></label><label><span>Postal code</span><input name="postalCode" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{6}" placeholder="600001" required /></label></div>
              <label><span>Inquiry or special requests <em>Optional</em></span><textarea name="inquiry" rows="4" placeholder="Airport pickup, accessibility, room preference, meal requests, or questions..." /></label>
              <button className="button" type="submit"><Users size={17} /> Submit booking inquiry</button>
            </form> : <Link className="button" to="/saved">View saved plans</Link>}
            <small>This demo confirms the booking request inside Tourgoater. It does not charge a payment card or issue airline/hotel tickets.</small>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
