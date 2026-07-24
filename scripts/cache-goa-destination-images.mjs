import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "public", "images", "listings", "goa");
const travelPath = path.join(root, "src", "data", "travel-images.json");
const hotelPath = path.join(root, "src", "data", "hotel-images.json");
const travel = JSON.parse(await readFile(travelPath, "utf8"));
const hotels = JSON.parse(await readFile(hotelPath, "utf8"));
await mkdir(output, { recursive: true });

const items = [
  { key: "basilica", queries: ["Basilica of Bom Jesus Old Goa", "Bom Jesus Basilica Goa"], target: "place", index: 0 },
  { key: "fontainhas", queries: ["Fontainhas Goa", "Panjim Latin Quarter", "Portuguese houses Panjim"], target: "place", index: 1 },
  { key: "palolem", queries: ["Palolem Beach Goa", "Palolem beach India"], target: "place", index: 2 },
  { key: "dudhsagar", queries: ["Dudhsagar Falls", "Dudhsagar waterfall Goa"], target: "place", index: 3 },
  { key: "panaji-hotel", queries: ["Hotel Mandovi Goa", "Panaji hotel Goa", "Panjim hotel"], target: "hotel", name: "Panaji Value Stay" },
  { key: "goa-resort", queries: ["Fort Aguada hotel", "Goa beach resort", "Goa resort India"], target: "hotel", name: "Goa Comfort Hotel" },
];
const used = new Set();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(item) {
  let lastError;
  for (const query of item.queries) {
    try {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({ action: "query", generator: "search", gsrsearch: query, gsrnamespace: "6", gsrlimit: "20", prop: "imageinfo", iiprop: "url", iiurlwidth: "1600", format: "json", origin: "*" });
  const options = { headers: { "User-Agent": "Tourgoater travel planner/1.0" }, signal: AbortSignal.timeout(45000) };
  let response = await fetch(api, options);
  if (response.status === 429) { await pause(15000); response = await fetch(api, options); }
  if (!response.ok) throw new Error(`search ${response.status}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages || {}).find((entry) => entry.imageinfo?.[0]?.thumburl && !used.has(entry.imageinfo[0].thumburl) && !/map|logo|icon|flag|seal|diagram/i.test(entry.title));
  if (!page) throw new Error("no unique result");
  used.add(page.imageinfo[0].thumburl);
  await pause(1200);
  let image = await fetch(page.imageinfo[0].thumburl, options);
  if (image.status === 429) { await pause(15000); image = await fetch(page.imageinfo[0].thumburl, options); }
  if (!image.ok) throw new Error(`image ${image.status}`);
  const relative = `/images/listings/goa/${item.key}.jpg`;
  await writeFile(path.join(output, `${item.key}.jpg`), new Uint8Array(await image.arrayBuffer()));
  return relative;
    } catch (error) {
      lastError = error;
      await pause(3000);
    }
  }
  throw lastError;
}

for (const item of items) {
  const local = await download(item);
  if (item.target === "place") {
    const previous = travel.state[14].tourist[item.index]?.images || [];
    travel.state[14].tourist[item.index] = { images: [local, ...previous.filter((path) => path !== local)] };
  } else {
    hotels["15"] ||= {};
    hotels["15"][item.name] = local;
  }
  console.log(`Downloaded ${item.key}`);
  await pause(2500);
}

await writeFile(travelPath, `${JSON.stringify(travel, null, 2)}\n`);
await writeFile(hotelPath, `${JSON.stringify(hotels, null, 2)}\n`);
console.log("Goa destination now uses six separate local photographs.");
