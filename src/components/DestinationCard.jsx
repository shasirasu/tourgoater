import { ArrowUpRight, Hotel, Landmark, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import SafeImage from "./SafeImage.jsx";

const MotionLink = motion.create(Link);

export default function DestinationCard({ destination, estimate, budget, tripDays = 3, travelers = 1 }) {
  const placeCount = destination.tourist?.length ?? 0;
  const reduceMotion = useReducedMotion();
  const destinationImages = Array.isArray(destination.img) ? destination.img : [destination.img].filter(Boolean);
  const relatedPlaceImages = destination.tourist?.flatMap((place) => place.images || []) || [];
  const frontSources = [...destinationImages, ...relatedPlaceImages];
  const backSources = [...relatedPlaceImages.slice(1), ...destinationImages.slice(1), ...frontSources];

  return (
    <MotionLink
      className="destination-card"
      to={`/destination/${destination.id}`}
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
      whileHover={reduceMotion ? undefined : "hover"}
    >
      <div className="destination-image-wrap">
        <div className="destination-card-grid" aria-hidden="true" />
        <motion.div className="destination-photo-card destination-photo-back" variants={{ hover: { y: -9, rotate: -8, x: 9 } }} transition={{ duration: .28, ease: "easeOut" }}>
          <SafeImage sources={backSources} alt={`A place to visit in ${destination.name}`} fallbackLabel={destination.name} loading="lazy" sizes="(max-width: 680px) 72vw, 24vw" width="560" height="420" />
        </motion.div>
        <motion.div className="destination-photo-card destination-photo-front" variants={{ hover: { y: -11, rotate: 7, x: -8 } }} transition={{ duration: .28, ease: "easeOut" }}>
          <SafeImage sources={frontSources} alt={`Scenic view of ${destination.name}`} fallbackLabel={destination.name} loading="lazy" sizes="(max-width: 680px) 72vw, 24vw" width="560" height="420" />
        </motion.div>
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
            <small>{budget > 0
              ? `Hotel ₹${estimate.hotelCost.toLocaleString("en-IN")} for ${estimate.nights} ${estimate.nights === 1 ? "night" : "nights"} · ₹${(budget - estimate.estimatedTripCost).toLocaleString("en-IN")} left`
              : `Estimated total for ${tripDays} ${Number(tripDays) === 1 ? "day" : "days"} and ${travelers} ${Number(travelers) === 1 ? "traveller" : "travellers"}`}
            </small>
          </div>
        )}
      </div>
    </MotionLink>
  );
}
