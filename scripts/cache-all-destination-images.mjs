import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public", "images", "listings", "manual");
const travelPath = path.join(root, "src", "data", "travel-images.json");
const hotelPath = path.join(root, "src", "data", "hotel-images.json");
const creditPath = path.join(output, "sources.json");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const travel = JSON.parse(await readFile(travelPath, "utf8"));
const hotels = JSON.parse(await readFile(hotelPath, "utf8"));
let credits = {};
try { credits = JSON.parse(await readFile(creditPath, "utf8")); } catch {}
await mkdir(output, { recursive: true });

const legacyHotelNames = {
  "1": ["Port Blair Comfort Inn", "Island Breeze Resort"], "2": ["Amritsar Heritage Stay", "Golden City Hotel"],
  "3": ["Pink City Haveli", "Desert Courtyard Hotel"], "5": ["Konkan Coast Stay", "Mumbai Central Hotel"],
  "6": ["Rishikesh River Stay", "Himalayan View Hotel"], "7": ["Manali Pine Lodge", "Valley Snow Resort"],
  "8": ["Ahmedabad City Stay", "Heritage Courtyard Hotel"], "9": ["Temple Route Residency", "Southern Pilgrim Comfort"],
};
const usedUrls = new Set(Object.values(credits).map((credit) => credit.imageUrl));
const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const headers = { "User-Agent": "Tourgoater educational travel planner/1.0 (local image cache)" };

async function fetchWithBackoff(url, attempts = 2) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(45000) });
    if (response.ok) return response;
    if (response.status !== 429 && response.status < 500) throw new Error(`HTTP ${response.status}`);
    await pause(6000 * (attempt + 1));
  }
  throw new Error("rate limit persisted");
}

async function findAndDownload(queries, filename) {
  let lastError;
  for (const query of queries) {
    try {
      const api = new URL("https://en.wikipedia.org/w/api.php");
      api.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: query, gsrnamespace: "0", gsrlimit: "10", prop: "pageimages", piprop: "thumbnail|original", pithumbsize: "1600", format: "json", origin: "*" });
      const response = await fetchWithBackoff(api);
      const data = await response.json();
      const choices = Object.values(data.query?.pages || {}).filter((page) => page.thumbnail?.source && !usedUrls.has(page.thumbnail.source) && !/list of|district|state of/i.test(page.title));
      const page = choices[0];
      if (!page) throw new Error("no unique result");
      await pause(900);
      const imageResponse = await fetchWithBackoff(page.thumbnail.source);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      await sharp(buffer).rotate().resize(1600, 1000, { fit: "cover", position: "attention" }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(output, `${filename}.jpg`));
      usedUrls.add(page.thumbnail.source);
      credits[filename] = { query, title: page.title, sourcePage: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`, imageUrl: page.thumbnail.source };
      return `/images/listings/manual/${filename}.jpg`;
    } catch (error) { lastError = error; await pause(2500); }
  }
  throw lastError;
}

async function saveCheckpoint() {
  for (const [target, value] of [[travelPath, travel], [hotelPath, hotels], [creditPath, credits]]) {
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
    await rename(temporary, target);
  }
}

let completed = 0;
let failed = 0;
for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  if (state.id === "15") continue;
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const place = state.tourist[placeIndex];
    const sources = travel.state[stateIndex].tourist[placeIndex]?.images || [];
    const alreadyManual = sources.find((source) => source.includes("/manual/"));
    const priorRealDownload = sources.find((source) => /\/images\/listings\/place-[^/]+\.jpg$/.test(source));
    if (alreadyManual) continue;
    if (priorRealDownload) {
      travel.state[stateIndex].tourist[placeIndex].images = [priorRealDownload, ...sources.filter((source) => source !== priorRealDownload)];
      completed += 1;
      continue;
    }
    const filename = `place-${slug(state.name)}-${slug(place.name)}`;
    try {
      const local = await findAndDownload([`${place.name} ${place.city || ""} ${state.name} India`, `${place.name} ${state.name}`, `${place.city || state.capital} landmark India`], filename);
      travel.state[stateIndex].tourist[placeIndex].images = [local, ...sources.filter((source) => source !== local)];
      completed += 1; console.log(`[${completed}] Place: ${state.name} / ${place.name}`);
    } catch (error) { failed += 1; console.warn(`FAILED place ${place.name}: ${error.message}`); }
    await saveCheckpoint();
    await pause(1400);
  }

  const names = legacyHotelNames[state.id] || [`${state.capital} Value Stay`, `${state.name} Comfort Hotel`];
  hotels[state.id] ||= {};
  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    if (hotels[state.id][name]?.includes("/manual/")) continue;
    const filename = `hotel-${slug(state.name)}-${index + 1}`;
    try {
      hotels[state.id][name] = await findAndDownload([`${index ? "resort" : "hotel"} ${state.capital} ${state.name} India`, `${index ? "beach resort" : "hotel room"} ${state.name} India`, `Indian ${index ? "resort" : "hotel"}`], filename);
      completed += 1; console.log(`[${completed}] Hotel: ${state.name} / ${name}`);
    } catch (error) { failed += 1; console.warn(`FAILED hotel ${name}: ${error.message}`); }
    await saveCheckpoint();
    await pause(1400);
  }
}

await saveCheckpoint();
console.log(`Manual cache pass complete: ${completed} updated, ${failed} failed.`);
