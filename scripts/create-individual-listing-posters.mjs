import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public", "images", "listings", "posters");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const catalogPath = path.join(root, "src", "data", "travel-images.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const hotelPath = path.join(root, "src", "data", "hotel-images.json");
const hotelCatalog = JSON.parse(await readFile(hotelPath, "utf8"));
await mkdir(output, { recursive: true });

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const xml = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
const legacyHotelNames = {
  "1": ["Port Blair Comfort Inn", "Island Breeze Resort"], "2": ["Amritsar Heritage Stay", "Golden City Hotel"],
  "3": ["Pink City Haveli", "Desert Courtyard Hotel"], "5": ["Konkan Coast Stay", "Mumbai Central Hotel"],
  "6": ["Rishikesh River Stay", "Himalayan View Hotel"], "7": ["Manali Pine Lodge", "Valley Snow Resort"],
  "8": ["Ahmedabad City Stay", "Heritage Courtyard Hotel"], "9": ["Temple Route Residency", "Southern Pilgrim Comfort"],
};

async function poster(filename, photo, title, subtitle, accent = "#f97316") {
  const safeTitle = title.length > 30 ? `${title.slice(0, 29)}…` : title;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <image href="${xml(photo)}" width="1280" height="800" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1280" height="800" fill="url(#shade)"/><defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" stop-color="#020617" stop-opacity=".08"/><stop offset="1" stop-color="#020617" stop-opacity=".94"/></linearGradient></defs>
  <rect x="72" y="584" width="62" height="7" rx="3.5" fill="${accent}"/>
  <text x="72" y="658" fill="white" font-family="Arial,Helvetica,sans-serif" font-size="58" font-weight="800">${xml(safeTitle)}</text>
  <text x="74" y="714" fill="#e2e8f0" font-family="Arial,Helvetica,sans-serif" font-size="25" font-weight="600" letter-spacing="2">${xml(subtitle.toUpperCase())}</text>
  </svg>`;
  await writeFile(path.join(output, filename), svg);
  return `/images/listings/posters/${filename}`;
}

for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  const statePhoto = Array.isArray(catalog.state[stateIndex]?.img) ? catalog.state[stateIndex].img[0] : catalog.state[stateIndex]?.img;
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const place = state.tourist[placeIndex];
    const current = catalog.state[stateIndex]?.tourist?.[placeIndex]?.images;
    const photo = (Array.isArray(current) ? current[0] : current) || statePhoto;
    const local = await poster(`place-${slug(state.name)}-${slug(place.name)}.svg`, photo, place.name, `${place.city || state.capital} · ${state.name}`);
    catalog.state[stateIndex].tourist[placeIndex] = { images: [local, photo].filter(Boolean) };
  }
  const names = legacyHotelNames[state.id] || [`${state.capital} Value Stay`, `${state.name} Comfort Hotel`];
  hotelCatalog[state.id] ||= {};
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const photo = hotelCatalog[state.id][name] || statePhoto;
    hotelCatalog[state.id][name] = await poster(`hotel-${slug(state.name)}-${index + 1}.svg`, photo, name, `Stay in ${index ? state.name : state.capital}`, "#22d3ee");
  }
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(hotelPath, `${JSON.stringify(hotelCatalog, null, 2)}\n`);
console.log("Created 190 individual place posters and 58 individual hotel posters.");
