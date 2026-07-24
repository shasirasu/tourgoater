import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(projectRoot, "public", "images", "travel");
const catalogPath = path.join(projectRoot, "src", "data", "travel-images.json");
const queries = [
  "Kapaleeshwarar Temple Chennai",
  "Kamakshi Amman Temple Kanchipuram",
  "Ekambareswarar Temple Kanchipuram",
  "Arunachaleswarar Temple Tiruvannamalai",
  "Nataraja Temple Chidambaram",
  "Brihadeeswarar Temple Thanjavur",
  "Ranganathaswamy Temple Srirangam",
  "Meenakshi Amman Temple Madurai",
  "Ramanathaswamy Temple Rameswaram",
  "Kumari Amman Temple Kanyakumari",
];

await mkdir(outputDirectory, { recursive: true });

async function findCommonsImage(query, index) {
  const prefix = `tamil-nadu-${String(index + 1).padStart(2, "0")}.`;
  const existing = (await readdir(outputDirectory)).find((filename) => filename.startsWith(prefix));
  if (existing) return `/images/travel/${existing}`;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6", gsrlimit: "8",
    prop: "imageinfo", iiprop: "url", iiurlwidth: "1920", format: "json", origin: "*",
  });
  const requestOptions = { headers: { "User-Agent": "Tourgoater educational travel planner/1.0" }, signal: AbortSignal.timeout(30000) };
  const searchResponse = await fetch(api, requestOptions);
  if (!searchResponse.ok) throw new Error(`Search failed: ${searchResponse.status}`);
  const searchData = await searchResponse.json();
  const candidates = Object.values(searchData.query?.pages ?? {}).filter((page) => !/logo|map|icon|seal/i.test(page.title));
  const selected = candidates[0]?.imageinfo?.[0];
  if (!selected) throw new Error("No Wikimedia Commons image found");

  let imageResponse = await fetch(selected.thumburl || selected.url, requestOptions);
  if (imageResponse.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    imageResponse = await fetch(selected.thumburl || selected.url, requestOptions);
  }
  if (!imageResponse.ok) throw new Error(`Image failed: ${imageResponse.status}`);
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const filename = `tamil-nadu-${String(index + 1).padStart(2, "0")}.${extension}`;
  await writeFile(path.join(outputDirectory, filename), new Uint8Array(await imageResponse.arrayBuffer()));
  console.log(`Cached ${query}`);
  return `/images/travel/${filename}`;
}

const paths = [];
for (let index = 0; index < queries.length; index += 1) {
  try { paths[index] = await findCommonsImage(queries[index], index); }
  catch (error) { console.error(`Skipped ${queries[index]}: ${error.message}`); }
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

const available = paths.filter(Boolean);
if (!available.length) throw new Error("No Tamil Nadu images could be downloaded");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const tamilNaduImages = {
  img: available.slice(0, 6),
  tourist: queries.map((_query, index) => ({ images: [paths[index] || available[index % available.length]] })),
};

if (catalog.state.length >= 9) catalog.state[8] = tamilNaduImages;
else catalog.state.push(tamilNaduImages);
await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Tamil Nadu image catalog ready with ${available.length} local images.`);
