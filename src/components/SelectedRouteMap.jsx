import { useEffect, useMemo, useRef, useState } from "react";
import * as MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Clock3, ExternalLink, MapPinned, Route } from "lucide-react";

function createMapStyle(theme) {
  const tiles = theme === "dark" ? "dark_all" : "light_all";
  return {
    version: 8,
    sources: { carto: { type: "raster", tiles: [`https://a.basemaps.cartocdn.com/${tiles}/{z}/{x}/{y}@2x.png`, `https://b.basemaps.cartocdn.com/${tiles}/{z}/{x}/{y}@2x.png`], tileSize: 256, attribution: "© OpenStreetMap © CARTO" } },
    layers: [{ id: "carto-basemap", type: "raster", source: "carto", minzoom: 0, maxzoom: 20 }],
  };
}

function coordinatesFromMapUrl(url = "") {
  const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return match ? { lat: Number(match[1]), lng: Number(match[2]) } : null;
}

function distanceKm(first, second) {
  const earthRadius = 6371;
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDistance = radians(second.lat - first.lat);
  const longitudeDistance = radians(second.lng - first.lng);
  const value = Math.sin(latitudeDistance / 2) ** 2
    + Math.cos(radians(first.lat)) * Math.cos(radians(second.lat)) * Math.sin(longitudeDistance / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDuration(hours) {
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const hourCount = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hourCount ? `${hourCount} hr ` : ""}${minutes ? `${minutes} min` : ""}`.trim();
}

function buildRouteProgress(coordinates) {
  const segmentDistances = coordinates.slice(1).map((point, index) => distanceKm(
    { lng: coordinates[index][0], lat: coordinates[index][1] },
    { lng: point[0], lat: point[1] },
  ));
  const total = segmentDistances.reduce((sum, distance) => sum + distance, 0) || 1;
  return { segmentDistances, total };
}

function pointAtProgress(coordinates, routeProgress, progress) {
  let remaining = progress * routeProgress.total;
  for (let index = 0; index < routeProgress.segmentDistances.length; index += 1) {
    const segmentDistance = routeProgress.segmentDistances[index];
    if (remaining <= segmentDistance || index === routeProgress.segmentDistances.length - 1) {
      const amount = segmentDistance ? Math.min(1, remaining / segmentDistance) : 0;
      const from = coordinates[index];
      const to = coordinates[index + 1];
      return { point: [from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount], next: to };
    }
    remaining -= segmentDistance;
  }
  return { point: coordinates.at(-1), next: coordinates.at(-1) };
}

function currentTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export default function SelectedRouteMap({ places, destinationName }) {
  const mapElementRef = useRef(null);
  const [theme, setTheme] = useState(currentTheme);
  const [mapError, setMapError] = useState("");
  const [roadRoute, setRoadRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [locatingPlaces, setLocatingPlaces] = useState(false);
  const inputPlaces = useMemo(() => places.map((place) => ({ ...place, coordinates: coordinatesFromMapUrl(place.location) })), [places]);
  const inputPlaceKey = inputPlaces.map((place) => `${place.name}:${place.coordinates ? `${place.coordinates.lng},${place.coordinates.lat}` : "missing"}`).join("|");
  const [routePlaces, setRoutePlaces] = useState(() => inputPlaces.filter((place) => place.coordinates));
  const coordinateKey = routePlaces.map((place) => `${place.name}:${place.coordinates.lng},${place.coordinates.lat}`).join("|");
  const estimatedRouteSummary = useMemo(() => {
    const directDistance = routePlaces.slice(1).reduce((total, place, index) => total + distanceKm(routePlaces[index].coordinates, place.coordinates), 0);
    const estimatedRoadDistance = Math.round(directDistance * 1.35);
    return { distance: estimatedRoadDistance, duration: formatDuration(estimatedRoadDistance / 40) };
  }, [coordinateKey]);
  const routeSummary = roadRoute
    ? { distance: roadRoute.distanceKm, duration: formatDuration(roadRoute.durationMinutes / 60) }
    : estimatedRouteSummary;
  const lineCoordinates = routePlaces.map((place) => [place.coordinates.lng, place.coordinates.lat]);
  const lineCoordinateKey = lineCoordinates.map((point) => point.join(",")).join(";");
  const directionsUrl = useMemo(() => {
    if (inputPlaces.length < 2) return inputPlaces[0]?.location || "";
    const query = new URLSearchParams({ api: "1", origin: `${inputPlaces[0].name}, ${destinationName}`, destination: `${inputPlaces.at(-1).name}, ${destinationName}`, travelmode: "driving" });
    if (inputPlaces.length > 2) query.set("waypoints", inputPlaces.slice(1, -1).map((place) => `${place.name}, ${destinationName}`).join("|"));
    return `https://www.google.com/maps/dir/?${query}`;
  }, [destinationName, inputPlaceKey]);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const knownPlaces = inputPlaces.filter((place) => place.coordinates);
    if (knownPlaces.length === inputPlaces.length) { setRoutePlaces(inputPlaces); return undefined; }
    const controller = new AbortController();
    setRoutePlaces(knownPlaces);
    setLocatingPlaces(true);
    fetch("/api/route-map/coordinates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ places: inputPlaces.map((place) => ({ name: place.name, destination: destinationName, lat: place.coordinates?.lat, lng: place.coordinates?.lng })) }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not locate every place");
        const coordinatesByName = new Map(data.places.map((place) => [place.name, { lat: place.lat, lng: place.lng }]));
        setRoutePlaces(inputPlaces.map((place) => ({ ...place, coordinates: place.coordinates || coordinatesByName.get(place.name) })).filter((place) => place.coordinates));
      })
      .catch((error) => { if (error.name !== "AbortError") setMapError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLocatingPlaces(false); });
    return () => controller.abort();
  }, [destinationName, inputPlaceKey]);

  useEffect(() => {
    if (routePlaces.length < 2) { setRoadRoute(null); return undefined; }
    const controller = new AbortController();
    setRoadRoute(null);
    setRouteLoading(true);
    fetch("/api/route-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: routePlaces.map((place) => place.coordinates) }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Road route unavailable");
        setRoadRoute(data);
      })
      .catch((error) => { if (error.name !== "AbortError") setRoadRoute(null); })
      .finally(() => { if (!controller.signal.aborted) setRouteLoading(false); });
    return () => controller.abort();
  }, [coordinateKey]);

  useEffect(() => {
    if (!mapElementRef.current || !routePlaces.length || mapError) return undefined;
    const first = routePlaces[0].coordinates;
    let map;
    try {
      map = new MapLibreGL.Map({ container: mapElementRef.current, style: createMapStyle(theme), center: [first.lng, first.lat], zoom: 9, pitch: routePlaces.length > 1 ? 28 : 0, attributionControl: false });
    } catch (error) {
      setMapError(error?.message || "This browser could not start the interactive map.");
      return undefined;
    }
    map.addControl(new MapLibreGL.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new MapLibreGL.FullscreenControl(), "top-right");
    map.addControl(new MapLibreGL.AttributionControl({ compact: true }), "bottom-right");

    const markers = routePlaces.map((place, index) => {
      const markerButton = document.createElement("button");
      markerButton.type = "button";
      markerButton.className = "maplibre-route-marker";
      markerButton.textContent = String(index + 1);
      markerButton.setAttribute("aria-label", `Stop ${index + 1}: ${place.name}`);
      const popup = new MapLibreGL.Popup({ offset: 22, closeButton: false }).setHTML(`<strong>Day ${index + 1}</strong><span>${place.name}</span>`);
      return new MapLibreGL.Marker({ element: markerButton, anchor: "center" }).setLngLat([place.coordinates.lng, place.coordinates.lat]).setPopup(popup).addTo(map);
    });
    let carMarker = null;
    let animationFrame = null;

    const handleMapError = (event) => {
      if (!map.isStyleLoaded()) setMapError(event?.error?.message || "The map tiles could not be loaded.");
    };
    map.on("error", handleMapError);
    map.on("load", () => {
      if (routePlaces.length > 1) {
        map.addSource("selected-trip-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: lineCoordinates } } });
        const routeLineLayout = { "line-cap": "round", "line-join": "round" };
        map.addLayer({ id: "selected-trip-route-shadow", type: "line", source: "selected-trip-route", layout: routeLineLayout, paint: { "line-color": "#020617", "line-width": 26, "line-opacity": .62, "line-blur": 3 } });
        map.addLayer({ id: "selected-trip-route-border", type: "line", source: "selected-trip-route", layout: routeLineLayout, paint: { "line-color": "#ffffff", "line-width": 20, "line-opacity": 1 } });
        map.addLayer({ id: "selected-trip-route-line", type: "line", source: "selected-trip-route", layout: routeLineLayout, paint: { "line-color": "#082f66", "line-width": 13, "line-opacity": 1 } });
        const bounds = routePlaces.reduce((box, place) => box.extend([place.coordinates.lng, place.coordinates.lat]), new MapLibreGL.LngLatBounds());
        map.fitBounds(bounds, { padding: 58, maxZoom: 11, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 800 });

        const carElement = document.createElement("div");
        carElement.className = "route-moving-car";
        carElement.setAttribute("aria-hidden", "true");
        carElement.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17H5v-5l2-5h10l2 5v5Z"/><path d="M5 12h14"/><path d="M7 17v2"/><path d="M17 17v2"/><circle cx="7.5" cy="14.5" r="1" fill="currentColor"/><circle cx="16.5" cy="14.5" r="1" fill="currentColor"/></svg></span>';
        carMarker = new MapLibreGL.Marker({ element: carElement, anchor: "center" }).setLngLat(lineCoordinates[0]).addTo(map);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const progressData = buildRouteProgress(lineCoordinates);
          const animationDuration = Math.max(9000, Math.min(24000, progressData.total * 65));
          let startedAt = null;
          const animateCar = (timestamp) => {
            if (startedAt === null) startedAt = timestamp;
            const progress = ((timestamp - startedAt) % animationDuration) / animationDuration;
            const { point, next } = pointAtProgress(lineCoordinates, progressData, progress);
            carMarker.setLngLat(point);
            const currentPixel = map.project(point);
            const nextPixel = map.project(next);
            const angle = Math.atan2(nextPixel.y - currentPixel.y, nextPixel.x - currentPixel.x) * 180 / Math.PI;
            carElement.querySelector("span").style.transform = `rotate(${angle}deg)`;
            animationFrame = requestAnimationFrame(animateCar);
          };
          animationFrame = requestAnimationFrame(animateCar);
        }
      }
    });
    return () => { if (animationFrame) cancelAnimationFrame(animationFrame); carMarker?.remove(); map.off("error", handleMapError); markers.forEach((marker) => marker.remove()); map.remove(); };
  }, [coordinateKey, lineCoordinateKey, mapError, theme]);

  useEffect(() => setMapError(""), [inputPlaceKey, theme]);

  if (!inputPlaces.length) return null;

  return (
    <section className="selected-route-map" aria-labelledby="selected-route-title">
      <header><div><span><MapPinned size={20} /></span><div><p>Your selected route</p><h3 id="selected-route-title">See how far your stops are</h3></div></div>{routePlaces.length > 1 && <dl aria-busy={routeLoading || locatingPlaces}><div><dt><Route size={16} /> {roadRoute ? "Road distance" : "Estimated distance"}</dt><dd>{routeLoading || locatingPlaces ? "Calculating..." : `${roadRoute ? "" : "~"}${routeSummary.distance} km`}</dd></div><div><dt><Clock3 size={16} /> {roadRoute ? "Road driving" : "Estimated driving"}</dt><dd>{routeLoading || locatingPlaces ? "Calculating..." : `${roadRoute ? "" : "~"}${routeSummary.duration}`}</dd></div></dl>}</header>
      <div className="selected-route-layout">{mapError ? <div className="route-map-fallback" role="alert"><MapPinned size={30} /><strong>Map preview unavailable</strong><p>{mapError}</p><a href={directionsUrl} target="_blank" rel="noopener noreferrer">View this route in Google Maps <ExternalLink size={15} /></a></div> : locatingPlaces && !routePlaces.length ? <div className="route-map-fallback" role="status"><MapPinned size={30} /><strong>Locating your selected places...</strong><p>Adding a map marker for every selected card.</p></div> : <div className="route-map-canvas" ref={mapElementRef} role="img" aria-label={`Interactive map showing ${routePlaces.map((place) => place.name).join(", ")}`} />}<ol>{inputPlaces.map((place, index) => <li key={place.name}><span>{index + 1}</span><div><small>Day {index + 1}</small><strong>{place.name}</strong></div></li>)}</ol></div>
      <footer><p>Distance and time are planning estimates. Mountain roads, traffic, weather and the exact route can change them.</p><a href={directionsUrl} target="_blank" rel="noopener noreferrer">Open exact directions <ExternalLink size={15} /></a></footer>
    </section>
  );
}
