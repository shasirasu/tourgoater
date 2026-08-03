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
      <svg className="mood-treasure-map" viewBox="0 0 1600 920" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className="treasure-contours">
          <path d="M-80 180C170 15 350 250 590 112S1050 35 1260 170s315 70 430-20" />
          <path d="M-110 770c245-180 390 45 625-80s410-165 625-40 375 120 560-35" />
          <path d="M1180-70c-95 175 95 270 2 420s35 265 182 360" />
        </g>
        <path className="treasure-route-shadow" d="M-30 690C190 610 175 390 390 420s238 220 468 105 235-315 455-218 182 250 320 180" />
        <path className="treasure-route" d="M-30 690C190 610 175 390 390 420s238 220 468 105 235-315 455-218 182 250 320 180" />
        <g className="treasure-pin" transform="translate(390 420)">
          <path d="M0-35c-24 0-42 18-42 41 0 31 42 72 42 72S42 37 42 6C42-17 24-35 0-35Z" />
          <circle cy="5" r="13" />
          <text y="10">1</text>
        </g>
        <g className="treasure-pin" transform="translate(858 525)">
          <path d="M0-35c-24 0-42 18-42 41 0 31 42 72 42 72S42 37 42 6C42-17 24-35 0-35Z" />
          <circle cy="5" r="13" />
          <text y="10">2</text>
        </g>
        <g className="treasure-compass" transform="translate(1330 178)">
          <circle r="72" /><circle r="54" />
          <path d="M0-52 17-12 0 52-17 12Z" />
          <text y="-86">N</text>
        </g>
        <g className="treasure-finish" transform="translate(1518 488)">
          <path d="M-29-29 29 29M29-29-29 29" />
          <circle r="48" />
        </g>
      </svg>
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
