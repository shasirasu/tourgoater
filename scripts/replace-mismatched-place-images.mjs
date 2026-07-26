import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const db = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const catalogPath = path.join(root, "src", "data", "travel-images.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const outputDirectory = path.join(root, "public", "images", "listings", "verified");
const sourcePath = path.join(outputDirectory, "sources.json");
let sources = {};

await mkdir(outputDirectory, { recursive: true });
try { sources = JSON.parse(await readFile(sourcePath, "utf8")); } catch { sources = {}; }

const slug = (value) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options = {}, attempts = 5) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetch(url, options);
    if (response.status !== 429 || attempt === attempts) return response;
    await delay(attempt * 4000);
  }
}

function scorePage(page, placeName, stateName) {
  const title = page.title.toLowerCase();
  const place = placeName.toLowerCase();
  let score = 0;
  if (title === place) score += 100;
  if (title.includes(place) || place.includes(title)) score += 45;
  if (title.includes(stateName.toLowerCase())) score += 12;
  if (page.original?.source || page.thumbnail?.source) score += 20;
  if (/district|disambiguation|list of|user:|wikiproject/i.test(page.title)) score -= 80;
  return score;
}

async function findArticleImage(placeName, stateName) {
  const exactParameters = new URLSearchParams({
    action: "query", titles: placeName, redirects: "1", prop: "pageimages|info", piprop: "thumbnail",
    pithumbsize: "1600", inprop: "url", format: "json", origin: "*",
  });
  const exactResponse = await fetchWithRetry(`https://en.wikipedia.org/w/api.php?${exactParameters}`, {
    headers: { "User-Agent": "Tourgoater/1.0 destination-image-cache" },
  });
  if (exactResponse.ok) {
    const exactResult = await exactResponse.json();
    const exactPage = Object.values(exactResult.query?.pages || {}).find((page) => page.thumbnail?.source);
    if (exactPage) return { title: exactPage.title, articleUrl: exactPage.fullurl, imageUrl: exactPage.thumbnail.source };
  }
  const parameters = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${placeName} ${stateName} India`,
    gsrnamespace: "0",
    gsrlimit: "6",
    prop: "pageimages|info",
    piprop: "thumbnail",
    pithumbsize: "1600",
    inprop: "url",
    format: "json",
    origin: "*",
  });
  const response = await fetchWithRetry(`https://en.wikipedia.org/w/api.php?${parameters}`, {
    headers: { "User-Agent": "Tourgoater/1.0 destination-image-cache" },
  });
  if (!response.ok) throw new Error(`Wikipedia search returned ${response.status}`);
  const result = await response.json();
  const pages = Object.values(result.query?.pages || {})
    .filter((page) => page.thumbnail?.source)
    .sort((first, second) => scorePage(second, placeName, stateName) - scorePage(first, placeName, stateName));
  const page = pages[0];
  if (!page) throw new Error("No article image found");
  return { title: page.title, articleUrl: page.fullurl, imageUrl: page.thumbnail.source };
}

let replaced = 0;
let failed = 0;
for (let stateIndex = 0; stateIndex < db.state.length; stateIndex += 1) {
  const state = db.state[stateIndex];
  for (let placeIndex = 0; placeIndex < state.tourist.length; placeIndex += 1) {
    const place = state.tourist[placeIndex];
    const key = `${slug(state.name)}-${slug(place.name)}`;
    const outputName = `${key}.jpg`;
    const outputPath = path.join(outputDirectory, outputName);
    try {
      await access(outputPath);
      const entry = catalog.state[stateIndex].tourist[placeIndex];
      entry.images = [`/images/listings/verified/${outputName}`, ...(entry.images || []).filter((image) => image !== `/images/listings/verified/${outputName}`)];
      replaced += 1;
      console.log(`KEEP ${replaced}: ${place.name}`);
      continue;
    } catch {
      // Continue with download when a verified local image does not exist yet.
    }
    try {
      const source = await findArticleImage(place.name, state.name);
      const imageResponse = await fetchWithRetry(source.imageUrl, { headers: { "User-Agent": "Tourgoater/1.0 destination-image-cache" } });
      if (!imageResponse.ok) throw new Error(`Image download returned ${imageResponse.status}`);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      await sharp(buffer).rotate().resize({ width: 1800, height: 1200, fit: "cover", position: "attention" }).jpeg({ quality: 84, progressive: true }).toFile(outputPath);
      const entry = catalog.state[stateIndex].tourist[placeIndex];
      entry.images = [`/images/listings/verified/${outputName}`, ...(entry.images || []).filter((image) => image !== `/images/listings/verified/${outputName}`)];
      sources[key] = { place: place.name, state: state.name, ...source };
      replaced += 1;
      console.log(`OK ${replaced}: ${place.name} -> ${source.title}`);
    } catch (error) {
      failed += 1;
      console.warn(`SKIP ${place.name}, ${state.name}: ${error.message}`);
    }
    await delay(1100);
  }
}

const catalogTemp = `${catalogPath}.tmp`;
const sourcesTemp = `${sourcePath}.tmp`;
await writeFile(catalogTemp, `${JSON.stringify(catalog, null, 2)}\n`);
await writeFile(sourcesTemp, `${JSON.stringify(sources, null, 2)}\n`);
await rename(catalogTemp, catalogPath);
await rename(sourcesTemp, sourcePath);
console.log(`Replaced ${replaced} place images; ${failed} listings kept their previous image.`);
