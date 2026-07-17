import { Link } from "react-router-dom";
import SafeImage from "./SafeImage.jsx";

export default function DestinationCard({ destination }) {
  const placeCount = destination.tourist?.length ?? 0;

  return (
    <Link className="destination-card" to={`/destination/${destination.id}`}>
      <div className="destination-image-wrap">
        <SafeImage
          className="destination-image"
          sources={destination.img}
          alt={`Scenic view of ${destination.name}`}
          fallbackLabel={destination.name}
          loading="lazy"
          width="640"
          height="420"
        />
      </div>
      <div className="destination-content">
        <div className="destination-meta">
          <span>Explore India</span>
          <span>{placeCount} places</span>
        </div>
        <h2>{destination.name}</h2>
        <p className="destination-capital">Capital · {destination.capital}</p>
        <p className="destination-description">{destination.about}</p>
      </div>
    </Link>
  );
}
