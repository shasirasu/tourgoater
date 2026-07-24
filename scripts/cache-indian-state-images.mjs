import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public", "images", "travel");
const catalogPath = path.join(root, "src", "data", "travel-images.json");
const database = JSON.parse(await readFile(path.join(root, "db.json"), "utf8"));
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const existingFiles = await readdir(output);
await mkdir(output, { recursive: true });

const stateQueries = new Map([
  ["Andhra Pradesh", "Tirupati Venkateswara Temple Andhra Pradesh"], ["Arunachal Pradesh", "Tawang Monastery Arunachal Pradesh"],
  ["Assam", "Kaziranga National Park Assam"], ["Bihar", "Mahabodhi Temple Bodh Gaya Bihar"],
  ["Chhattisgarh", "Chitrakote Falls Chhattisgarh"], ["Goa", "Basilica Bom Jesus Goa"],
  ["Haryana", "Brahma Sarovar Kurukshetra Haryana"], ["Jharkhand", "Baidyanath Temple Deoghar Jharkhand"],
  ["Karnataka", "Hampi Karnataka"], ["Madhya Pradesh", "Khajuraho Temple Madhya Pradesh"],
  ["Manipur", "Loktak Lake Manipur"], ["Meghalaya", "Living Root Bridge Meghalaya"],
  ["Mizoram", "Reiek Mizoram landscape"], ["Nagaland", "Kisama Heritage Village Nagaland"],
  ["Odisha", "Konark Sun Temple Odisha"], ["Sikkim", "Tsomgo Lake Sikkim"],
  ["Telangana", "Charminar Hyderabad Telangana"], ["Tripura", "Ujjayanta Palace Tripura"],
  ["Uttar Pradesh", "Taj Mahal Agra Uttar Pradesh"], ["West Bengal", "Victoria Memorial Kolkata West Bengal"],
]);

// If Commons has no searchable result, keep the experience fully local with a
// geographically related landscape until a state-specific photograph is added.
const localFallbacks = new Map([
  ["Meghalaya", "/images/travel/state-assam.jpg"],
  ["Mizoram", "/images/travel/state-manipur.jpg"],
  ["Nagaland", "/images/travel/state-manipur.jpg"],
  ["Sikkim", "/images/travel/state-arunachal-pradesh.jpg"],
  ["Telangana", "/images/travel/state-karnataka.jpg"],
  ["Tripura", "/images/travel/state-assam.jpg"],
]);

function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

async function downloadStateImage(stateName, query) {
  const prefix = `state-${slug(stateName)}.`;
  const cached = existingFiles.find((file) => file.startsWith(prefix));
  if (cached) return `/images/travel/${cached}`;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6", gsrlimit: "6", prop: "imageinfo", iiprop: "url", iiurlwidth: "1920", format: "json", origin: "*" });
  const options = { headers: { "User-Agent": "Tourgoater educational travel planner/1.0" }, signal: AbortSignal.timeout(30000) };
  const search = await fetch(api, options);
  if (!search.ok) throw new Error(`search ${search.status}`);
  const data = await search.json();
  const page = Object.values(data.query?.pages ?? {}).find((item) => item.imageinfo?.[0] && !/map|logo|icon|flag|seal/i.test(item.title));
  if (!page?.imageinfo?.[0]) throw new Error("no image result");
  let response = await fetch(page.imageinfo[0].thumburl || page.imageinfo[0].url, options);
  if (response.status === 429) { await new Promise((resolve) => setTimeout(resolve, 5000)); response = await fetch(page.imageinfo[0].thumburl || page.imageinfo[0].url, options); }
  if (!response.ok) throw new Error(`image ${response.status}`);
  const type = response.headers.get("content-type") || "image/jpeg";
  const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const filename = `${prefix}${extension}`;
  await writeFile(path.join(output, filename), new Uint8Array(await response.arrayBuffer()));
  return `/images/travel/${filename}`;
}

for (const [stateName, query] of stateQueries) {
  const stateIndex = database.state.findIndex((state) => state.name === stateName);
  if (stateIndex < 0) continue;
  try {
    const image = await downloadStateImage(stateName, query);
    catalog.state[stateIndex] = { img: [image], tourist: database.state[stateIndex].tourist.map(() => ({ images: [image] })) };
    console.log(`Cached ${stateName}`);
  } catch (error) {
    const fallback = localFallbacks.get(stateName);
    if (fallback) {
      catalog.state[stateIndex] = { img: [fallback], tourist: database.state[stateIndex].tourist.map(() => ({ images: [fallback] })) };
      console.warn(`Used local regional fallback for ${stateName}: ${error.message}`);
    } else {
      console.error(`Skipped ${stateName}: ${error.message}`);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 900));
}

await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(`Image catalog now covers ${catalog.state.filter((state) => state?.img?.length).length} destinations.`);
