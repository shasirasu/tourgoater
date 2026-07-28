import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(root, "public", "images", "listings", "puducherry");

const photographs = [
  ["promenade-beach", "Pondicherry Beach, India.jpg"],
  ["auroville-matrimandir", "Auroville - Matrimandir.jpg"],
  ["sri-aurobindo-ashram", "Aurobindo Ashram Pondichery - Outside view.jpg"],
  ["paradise-beach", "Paradise beach.jpg"],
  ["white-town", "Streets of White town, Puducherry.jpg"],
  ["pondy-food-street", "Puducherry-White Town-WUS02344.jpg"],
  ["bharathi-park", "Bharathi Park in Puducherry.JPG"],
  ["serenity-beach", "Serenity beach.jpg"],
  ["sacred-heart-basilica", "Basilica of the Sacred Heart of Jesus.jpg"],
  ["arikamedu", "Arikamedu, Early Historic Site 01.jpg"],
];

await fs.mkdir(outputDirectory, { recursive: true });
const sources = [];
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options, label) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(url, options);
    if (response.ok) return response;
    if (![429, 503].includes(response.status) || attempt === 6) throw new Error(`${label}: ${response.status}`);
    await delay(attempt * 5000);
  }
}

for (const [slug, fileTitle] of photographs) {
  const title = `File:${fileTitle}`;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.search = new URLSearchParams({
    action: "query", format: "json", origin: "*", prop: "imageinfo",
    iiprop: "url|extmetadata", iiurlwidth: "1600", titles: title,
  });
  const metadataResponse = await fetchWithRetry(api, { headers: { "User-Agent": "Tourgoater/1.0 educational travel catalog (contact: local educational project)" } }, `Metadata request failed for ${title}`);
  const metadata = await metadataResponse.json();
  const page = Object.values(metadata.query.pages)[0];
  const image = page.imageinfo?.[0];
  if (!image?.thumburl && !image?.url) throw new Error(`No downloadable image found for ${title}`);

  const imageUrl = image.thumburl || image.url;
  const destination = path.join(outputDirectory, `${slug}.webp`);
  try {
    await fs.access(destination);
    console.log(`Kept existing ${slug}.webp`);
  } catch {
    const imageResponse = await fetchWithRetry(imageUrl, { headers: { "User-Agent": "Tourgoater/1.0 educational travel catalog (contact: local educational project)" } }, `Image download failed for ${title}`);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    await sharp(buffer).rotate().resize(1600, 1000, { fit: "cover", position: "attention" }).webp({ quality: 84 }).toFile(destination);
    console.log(`Saved ${slug}.webp`);
    await delay(4000);
  }

  const ext = image.extmetadata || {};
  sources.push({
    slug,
    title: fileTitle,
    sourcePage: image.descriptionurl,
    imageUrl,
    artist: ext.Artist?.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "See source page",
    license: ext.LicenseShortName?.value || ext.License?.value || "See source page",
    licenseUrl: ext.LicenseUrl?.value || "",
  });
}

await fs.writeFile(path.join(outputDirectory, "sources.json"), `${JSON.stringify(sources, null, 2)}\n`);
