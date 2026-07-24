import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const databasePath = path.join(projectRoot, "src", "data", "travel-images.json");
const outputDirectory = path.join(projectRoot, "public", "images", "travel");
const travelData = JSON.parse(await readFile(databasePath, "utf8"));
const imageUrls = new Set();

function collectImages(value, parentKey = "") {
  if (Array.isArray(value)) {
    value.forEach((item) => collectImages(item, parentKey));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if ((key === "img" || key === "images" || key === "image") && typeof item === "string" && /^https?:\/\//i.test(item)) imageUrls.add(item);
    else if ((key === "img" || key === "images") && Array.isArray(item)) item.filter((source) => typeof source === "string" && /^https?:\/\//i.test(source)).forEach((source) => imageUrls.add(source));
    else collectImages(item, key);
  }
}

collectImages(travelData);
await mkdir(outputDirectory, { recursive: true });

const replacements = new Map();
const urls = [...imageUrls];
let completed = 0;

async function downloadImage(url) {
  const filename = `${createHash("sha1").update(url).digest("hex").slice(0, 18)}.webp`;
  const localPath = path.join(outputDirectory, filename);
  const optimizedUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1920&output=webp&q=84`;

  try {
    await access(localPath);
    replacements.set(url, `/images/travel/${filename}`);
    completed += 1;
    return;
  } catch {
    // Download sources that are not already cached from an earlier run.
  }

  try {
    const response = await fetch(optimizedUrl, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error(`Unexpected ${contentType}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 1000) throw new Error("Image response was too small");
    await writeFile(localPath, bytes);
    replacements.set(url, `/images/travel/${filename}`);
    completed += 1;
  } catch (error) {
    completed += 1;
    console.error(`Skipped ${url}: ${error.message}`);
  }
}

for (let index = 0; index < urls.length; index += 12) {
  await Promise.all(urls.slice(index, index + 12).map(downloadImage));
}

function replaceImages(value, parentKey = "") {
  if (Array.isArray(value)) return value.map((item) => replaceImages(item, parentKey));
  if (!value || typeof value !== "object") {
    return typeof value === "string" && replacements.has(value) && ["img", "images", "image"].includes(parentKey)
      ? replacements.get(value)
      : value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceImages(item, key)]));
}

function localImagesIn(value) {
  const images = [];
  function visit(item, parentKey = "") {
    if (Array.isArray(item)) return item.forEach((entry) => visit(entry, parentKey));
    if (item && typeof item === "object") return Object.entries(item).forEach(([key, entry]) => visit(entry, key));
    if (typeof item === "string" && ["img", "images", "image"].includes(parentKey) && item.startsWith("/images/travel/")) images.push(item);
  }
  visit(value);
  return [...new Set(images)];
}

function replaceBrokenRemoteImages(value, localFallbacks, parentKey = "") {
  if (Array.isArray(value)) return value.map((item) => replaceBrokenRemoteImages(item, localFallbacks, parentKey));
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && /^https?:\/\//i.test(value) && ["img", "images", "image"].includes(parentKey) && localFallbacks.length) {
      const position = Number.parseInt(createHash("sha1").update(value).digest("hex").slice(0, 8), 16) % localFallbacks.length;
      return localFallbacks[position];
    }
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceBrokenRemoteImages(item, localFallbacks, key)]));
}

const localizedData = replaceImages(travelData);
const allLocalImages = localImagesIn(localizedData);
localizedData.state = localizedData.state.map((state) => replaceBrokenRemoteImages(state, localImagesIn(state).length ? localImagesIn(state) : allLocalImages));
await writeFile(databasePath, `${JSON.stringify(localizedData, null, 2)}\n`, "utf8");
console.log(`\nFinished: ${allLocalImages.length} unique images stored locally; broken remote references replaced with destination-local fallbacks.`);
