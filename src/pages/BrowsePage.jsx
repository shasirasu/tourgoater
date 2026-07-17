import travelData from "../../db.json";
import DestinationCard from "../components/DestinationCard.jsx";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function BrowsePage({ user, onLogout }) {
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

          <section className="destination-grid" aria-label="Destinations">
            {travelData.state.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
