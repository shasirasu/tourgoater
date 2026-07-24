import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const databasePath = path.join(projectRoot, "db.json");
const catalogPath = path.join(projectRoot, "src", "data", "travel-images.json");
const imageKeys = new Set(["img", "images", "image"]);
const travelData = JSON.parse(await readFile(databasePath, "utf8"));

function extractImages(value) {
  if (Array.isArray(value)) return value.map(extractImages);
  if (!value || typeof value !== "object") return undefined;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (imageKeys.has(key)) result[key] = item;
    else if (item && typeof item === "object") result[key] = extractImages(item);
  }
  return result;
}

function removeImages(value) {
  if (Array.isArray(value)) return value.map(removeImages);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !imageKeys.has(key))
    .map(([key, item]) => [key, removeImages(item)]));
}

const imageCatalog = { state: extractImages(travelData.state) };
await writeFile(catalogPath, `${JSON.stringify(imageCatalog, null, 2)}\n`, "utf8");
await writeFile(databasePath, `${JSON.stringify(removeImages(travelData), null, 2)}\n`, "utf8");
console.log(`Moved image paths from db.json to ${path.relative(projectRoot, catalogPath)}.`);
