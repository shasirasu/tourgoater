import { useState } from "react";
import { Link } from "react-router-dom";
import travelData from "../data/travelData.js";
import InkReveal from "./InkReveal.jsx";
import SafeImage from "./SafeImage.jsx";

const INK_MASK = [15, 23, 42];

const MOODS = [
  {
    id: "peaceful",
    label: "Peaceful",
    title: "Slow down somewhere quiet.",
    description: "Choose calm backwaters, soft beaches, and cool mountain air when your trip needs more breathing room.",
    tags: ["Backwaters", "Mountains", "Beach"],
    destinationIds: ["4", "7"],
  },
  {
    id: "adventure",
    label: "Adventure",
    title: "Trade routine for the outdoors.",
    description: "Explore high trails, dramatic valleys, and active days shaped around movement and discovery.",
    tags: ["Trekking", "Hills", "Nature"],
    destinationIds: ["6", "7"],
  },
  {
    id: "culture",
    label: "Culture",
    title: "Travel through stories and heritage.",
    description: "Find forts, colourful streets, local food, crafts, and traditions with a strong sense of place.",
    tags: ["Heritage", "Food", "Architecture"],
    destinationIds: ["3", "2", "8"],
  },
  {
    id: "coastal",
    label: "Coastal",
    title: "Follow the trip toward the sea.",
    description: "Pick island horizons, palm-lined shores, and lively coastal cities for an easy waterside escape.",
    tags: ["Islands", "Sea", "Sunsets"],
    destinationIds: ["1", "4", "5"],
  },
];

export default function MoodExplorer() {
  const [selectedMoodId, setSelectedMoodId] = useState(MOODS[0].id);
  const selectedMood = MOODS.find((mood) => mood.id === selectedMoodId) ?? MOODS[0];
  const recommendations = selectedMood.destinationIds
    .map((destinationId) => travelData.state.find((state) => state.id === destinationId))
    .filter(Boolean);
  const leadDestination = recommendations[0];

  return (
    <section className="mood-section" aria-labelledby="mood-heading">
      <div className="shell">
        <div className="mood-heading">
          <div>
            <p className="eyebrow">Travel by feeling</p>
            <h2 id="mood-heading">What kind of escape do you need?</h2>
          </div>
          <p>Choose your mood and reveal a place that matches it.</p>
        </div>

        <div className="mood-selector" role="group" aria-label="Choose a travel mood">
          {MOODS.map((mood) => (
            <button
              className="mood-button"
              type="button"
              key={mood.id}
              aria-pressed={selectedMood.id === mood.id}
              onClick={() => setSelectedMoodId(mood.id)}
            >
              {mood.label}
            </button>
          ))}
        </div>

        <article className="mood-stage" aria-live="polite">
          <SafeImage
            className="mood-background"
            sources={leadDestination?.img}
            alt={`${selectedMood.label} trip recommendation in ${leadDestination?.name}`}
            fallbackLabel={leadDestination?.name}
            loading="lazy"
            sizes="(max-width: 1160px) 100vw, 1160px"
            width="1200"
            height="680"
          />
          <InkReveal
            key={selectedMood.id}
            className="mood-ink"
            maskColor={INK_MASK}
            brushSize={170}
            lifetime={850}
          />

          <div className="mood-overlay">
            <p className="mood-overline">Your {selectedMood.label.toLowerCase()} mood</p>
            <h3>{selectedMood.title}</h3>
            <p>{selectedMood.description}</p>

            <div className="mood-tags" aria-label="Recommended place types">
              {selectedMood.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            <div className="mood-recommendations">
              <span>Recommended:</span>
              {recommendations.map((destination) => (
                <Link key={destination.id} to={`/destination/${destination.id}`}>
                  {destination.name}
                </Link>
              ))}
            </div>
          </div>

          <p className="mood-hint">Move your mouse over the background to reveal the place.</p>
        </article>
      </div>
    </section>
  );
}
