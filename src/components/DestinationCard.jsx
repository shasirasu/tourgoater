import { ArrowUpRight, Hotel, Landmark, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage.jsx";

export default function DestinationCard({ destination, estimate, budget }) {
  const placeCount = destination.tourist?.length ?? 0;

  return (
    <Link className="destination-card" to={`/destination/${destination.id}`}>
      <div className="destination-image-wrap">
        <SafeImage className="destination-image" sources={destination.img} alt={`Scenic view of ${destination.name}`} fallbackLabel={destination.name} loading="lazy" sizes="(max-width: 680px) 100vw, (max-width: 980px) 50vw, 34vw" width="640" height="420" />
        <span className="destination-place-badge"><Landmark size={14} /> {placeCount} places</span>
        <span className="destination-card-arrow"><ArrowUpRight size={20} /></span>
      </div>
      <div className="destination-content">
        <div className="destination-meta"><span>Explore India</span><span>{destination.regionType === "Union Territory" ? "Union Territory" : "State guide"}</span></div>
        <h2>{destination.name}</h2>
        <p className="destination-capital"><MapPin size={15} /> Capital · {destination.capital}</p>
        <p className="destination-description">{destination.about}</p>
        {estimate?.estimatedTripCost && (
          <div className="trip-estimate">
            <span><Hotel size={14} /> {estimate.hotel.name}</span>
            <strong>₹{estimate.estimatedTripCost.toLocaleString("en-IN")}</strong>
            <small>Hotel ₹{estimate.hotelCost.toLocaleString("en-IN")} for {estimate.nights} {estimate.nights === 1 ? "night" : "nights"} · ₹{(budget - estimate.estimatedTripCost).toLocaleString("en-IN")} left</small>
          </div>
        )}
      </div>
    </Link>
  );
}
