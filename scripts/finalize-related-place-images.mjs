import { access, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const catalogPath = path.join(root, "src", "data", "travel-images.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const verifiedDirectory = path.join(root, "public", "images", "listings", "verified");
const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let exact = 0;
let relatedFallback = 0;
for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  const stateEntry = catalog.state[stateIndex];
  const exactImages = [];
  for (const place of state.tourist) {
    const name = `${slug(state.name)}-${slug(place.name)}.jpg`;
    try {
      await access(path.join(verifiedDirectory, name));
      exactImages.push(`/images/listings/verified/${name}`);
    } catch { /* Exact image was not downloaded. */ }
  }
  const stateFallbacks = [...new Set([...exactImages, ...(stateEntry.img || [])])];
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const place = state.tourist[placeIndex];
    const name = `${slug(state.name)}-${slug(place.name)}.jpg`;
    const verified = `/images/listings/verified/${name}`;
    let primary = verified;
    try {
      await access(path.join(verifiedDirectory, name));
      exact += 1;
    } catch {
      primary = stateFallbacks[placeIndex % stateFallbacks.length];
      relatedFallback += 1;
    }
    stateEntry.tourist[placeIndex].images = [primary];
  }
}

const temporaryPath = `${catalogPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(catalog, null, 2)}\n`);
await rename(temporaryPath, catalogPath);
console.log(`Assigned ${exact} exact-place photos and ${relatedFallback} state-related fallbacks. Removed unrelated secondary images.`);
