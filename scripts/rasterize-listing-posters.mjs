import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const posterDirectory = path.join(root, "public", "images", "listings", "posters");
const files = (await readdir(posterDirectory)).filter((file) => file.endsWith(".svg"));

function mimeType(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".webp") return "image/webp";
  if (extension === ".png") return "image/png";
  return "image/jpeg";
}

for (const file of files) {
  const svgPath = path.join(posterDirectory, file);
  let svg = await readFile(svgPath, "utf8");
  const match = svg.match(/<image href="([^"]+)"/);
  if (!match) throw new Error(`Missing embedded photo in ${file}`);
  const photoPath = path.join(root, "public", match[1].replace(/^\//, ""));
  const photo = await readFile(photoPath);
  const embedded = `data:${mimeType(photoPath)};base64,${photo.toString("base64")}`;
  svg = svg.replace(match[1], embedded);
  const outputPath = svgPath.replace(/\.svg$/, ".jpg");
  await sharp(Buffer.from(svg)).jpeg({ quality: 88, mozjpeg: true }).toFile(outputPath);
  await unlink(svgPath);
}

for (const relative of ["src/data/travel-images.json", "src/data/hotel-images.json"]) {
  const filePath = path.join(root, relative);
  const content = (await readFile(filePath, "utf8")).replace(/\/images\/listings\/posters\/([^"\n]+)\.svg/g, "/images/listings/posters/$1.jpg");
  await writeFile(filePath, content);
}

console.log(`Converted ${files.length} listing posters to self-contained JPEG files.`);
