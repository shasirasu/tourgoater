import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public", "images", "listings");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const catalogPath = path.join(root, "src", "data", "travel-images.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const hotelCatalogPath = path.join(root, "src", "data", "hotel-images.json");
let hotelCatalog = {};
try { hotelCatalog = JSON.parse(await readFile(hotelCatalogPath, "utf8")); } catch {}
await mkdir(output, { recursive: true });

const pathUsage = new Map();
for (const state of catalog.state) for (const place of state?.tourist || []) {
  const source = Array.isArray(place.images) ? place.images[0] : place.images;
  if (source) pathUsage.set(source, (pathUsage.get(source) || 0) + 1);
}
const usedUrls = new Set();
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const legacyHotelNames = {
  "1": ["Port Blair Comfort Inn", "Island Breeze Resort"], "2": ["Amritsar Heritage Stay", "Golden City Hotel"],
  "3": ["Pink City Haveli", "Desert Courtyard Hotel"], "5": ["Konkan Coast Stay", "Mumbai Central Hotel"],
  "6": ["Rishikesh River Stay", "Himalayan View Hotel"], "7": ["Manali Pine Lodge", "Valley Snow Resort"],
  "8": ["Ahmedabad City Stay", "Heritage Courtyard Hotel"], "9": ["Temple Route Residency", "Southern Pilgrim Comfort"],
};

async function commonsImage(query, filename, pick = 0) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6", gsrlimit: "15", prop: "imageinfo", iiprop: "url", iiurlwidth: "1280", format: "json", origin: "*" });
  const options = { headers: { "User-Agent": "Tourgoater travel planner/1.0" }, signal: AbortSignal.timeout(30000) };
  const response = await fetch(api, options);
  if (!response.ok) throw new Error(`search ${response.status}`);
  const data = await response.json();
  const choices = Object.values(data.query?.pages || {}).filter((page) => page.imageinfo?.[0]?.thumburl && !/map|logo|icon|flag|seal|diagram/i.test(page.title));
  let choice = choices.find((page, index) => index >= pick && !usedUrls.has(page.imageinfo[0].thumburl)) || choices.find((page) => !usedUrls.has(page.imageinfo[0].thumburl));
  if (!choice) throw new Error("no unique image result");
  const url = choice.imageinfo[0].thumburl;
  usedUrls.add(url);
  const image = await fetch(url, options);
  if (!image.ok) throw new Error(`image ${image.status}`);
  const relative = `/images/listings/${filename}.jpg`;
  await writeFile(path.join(output, `${filename}.jpg`), new Uint8Array(await image.arrayBuffer()));
  return relative;
}

for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const place = state.tourist[placeIndex];
    const current = catalog.state[stateIndex]?.tourist?.[placeIndex]?.images;
    const source = Array.isArray(current) ? current[0] : current;
    if ((pathUsage.get(source) || 0) <= 1) continue;
    try {
      const local = await commonsImage(`${place.name} ${place.city || ""} ${state.name} India`, `place-${slug(state.name)}-${slug(place.name)}`);
      catalog.state[stateIndex].tourist[placeIndex] = { images: [local] };
      console.log(`Place: ${state.name} / ${place.name}`);
    } catch (error) { console.warn(`Place fallback: ${place.name}: ${error.message}`); }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const defaultHotels = [
    { name: `${state.capital} Value Stay`, query: `hotel ${state.capital} India` },
    { name: `${state.name} Comfort Hotel`, query: `resort hotel ${state.name} India` },
  ];
  const namedHotels = (legacyHotelNames[state.id] || []).map((name, index) => ({ name, query: `${index ? "resort" : "hotel"} ${name} ${state.name} India` }));
  if (!namedHotels.length) namedHotels.push(...defaultHotels);
  hotelCatalog[state.id] ||= {};
  for (let hotelIndex = 0; hotelIndex < namedHotels.length; hotelIndex += 1) {
    const hotel = namedHotels[hotelIndex];
    try {
      hotelCatalog[state.id][hotel.name] = await commonsImage(hotel.query, `hotel-${slug(state.name)}-${hotelIndex + 1}`, hotelIndex);
      console.log(`Hotel: ${state.name} / ${hotel.name}`);
    } catch (error) { console.warn(`Hotel fallback: ${hotel.name}: ${error.message}`); }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(hotelCatalogPath, `${JSON.stringify(hotelCatalog, null, 2)}\n`);
console.log("Individual listing image cache complete.");
