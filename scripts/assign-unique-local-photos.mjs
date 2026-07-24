import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const travelPath = path.join(root, "src", "data", "travel-images.json");
const hotelPath = path.join(root, "src", "data", "hotel-images.json");
const travel = JSON.parse(await readFile(travelPath, "utf8"));
const hotels = JSON.parse(await readFile(hotelPath, "utf8"));
const extensions = new Set([".jpg", ".jpeg", ".webp", ".png"]);
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function walk(directory) {
  const found = [];
  for (const entry of await readdir(directory)) {
    const absolute = path.join(directory, entry);
    if ((await stat(absolute)).isDirectory()) {
      if (entry !== "posters") found.push(...await walk(absolute));
    } else if (extensions.has(path.extname(entry).toLowerCase())) found.push(absolute);
  }
  return found;
}

const files = [...new Set(await walk(path.join(root, "public", "images")))]
  .filter((file) => !file.includes(`${path.sep}branding${path.sep}`))
  .map((file) => `/${path.relative(path.join(root, "public"), file).replaceAll("\\", "/")}`);
const used = new Set();
const isReal = (source) => source && !source.includes("/posters/");

// Preserve exact/manual matches first.
for (const state of travel.state) for (const place of state.tourist || []) {
  const real = (place.images || []).find(isReal);
  if (real && !used.has(real)) used.add(real);
}
for (const value of Object.values(hotels).flatMap(Object.values)) if (isReal(value) && !used.has(value)) used.add(value);

function takePhoto(stateName) {
  const stateSlug = slug(stateName);
  const available = files.filter((file) => !used.has(file));
  const selected = available.find((file) => file.includes(stateSlug)) || available[0];
  if (!selected) throw new Error("Not enough local photos for unique assignment");
  used.add(selected);
  return selected;
}

// Rebuild assignments while retaining a real primary only when no other listing uses it.
used.clear();
for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const entry = travel.state[stateIndex].tourist[placeIndex];
    const exact = (entry.images || []).find((source) => isReal(source) && !used.has(source));
    const primary = exact || takePhoto(state.name);
    used.add(primary);
    entry.images = [primary, ...(entry.images || []).filter((source) => source !== primary)];
  }
  hotels[state.id] ||= {};
  for (const [name, current] of Object.entries(hotels[state.id])) {
    const primary = isReal(current) && !used.has(current) ? current : takePhoto(state.name);
    used.add(primary);
    hotels[state.id][name] = primary;
  }
}

await writeFile(travelPath, `${JSON.stringify(travel, null, 2)}\n`);
await writeFile(hotelPath, `${JSON.stringify(hotels, null, 2)}\n`);
console.log(`Assigned ${used.size} different real local photos across all place and hotel listings.`);
