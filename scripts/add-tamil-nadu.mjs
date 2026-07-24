import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const databasePath = path.join(projectRoot, "db.json");
const database = JSON.parse(await readFile(databasePath, "utf8"));

const places = [
  ["Kapaleeshwarar Temple", "Chennai", "Begin in Mylapore at this landmark Shiva temple, known for its colourful Dravidian gopuram and active devotional atmosphere."],
  ["Kamakshi Amman Temple", "Kanchipuram", "Visit one of Kanchipuram's major sacred sites, dedicated to Goddess Kamakshi and central to the city's Shakti tradition."],
  ["Ekambareswarar Temple", "Kanchipuram", "Continue to this expansive Shiva temple, traditionally associated with the earth element among the Pancha Bhoota shrines."],
  ["Arunachaleswarar Temple", "Tiruvannamalai", "Seek darshan at the foot of Arunachala hill and, when suitable, experience part of the sacred hill circuit."],
  ["Thillai Nataraja Temple", "Chidambaram", "Visit the celebrated temple of Shiva as Nataraja, where devotion, classical arts and Chola-era heritage meet."],
  ["Brihadeeswarar Temple", "Thanjavur", "Explore the monumental Chola temple dedicated to Shiva, admired for its scale, stonework and sacred architecture."],
  ["Sri Ranganathaswamy Temple", "Srirangam", "Enter the vast island temple complex dedicated to Ranganatha, an important centre of Sri Vaishnava worship."],
  ["Meenakshi Amman Temple", "Madurai", "Experience Madurai's defining temple complex, dedicated to Meenakshi and Sundareswarar and crowned by richly sculpted towers."],
  ["Ramanathaswamy Temple", "Rameswaram", "Complete darshan at this revered Shiva temple, one of the twelve Jyotirlinga shrines and a major pilgrimage destination."],
  ["Bhagavathy Amman Temple", "Kanniyakumari", "Conclude at India's southern tip with worship at the coastal shrine of Goddess Kanyakumari."],
];

const tamilNadu = {
  id: "9",
  name: "Tamil Nadu",
  capital: "Chennai",
  bestFor: "Temple pilgrimage",
  planType: "Devotional circuit",
  about: "Tamil Nadu offers one of India's richest temple journeys, linking living centres of Shiva, Shakti, Vishnu and Murugan worship with monumental Dravidian architecture. This devotional circuit follows a practical north-to-south route from Chennai to Kanniyakumari.",
  climate: "Tamil Nadu is generally warm. Temple visits are most comfortable in the early morning and evening; carry water, dress modestly and plan extra time during festivals and auspicious days.",
  history: "The state's sacred landscape was shaped over centuries by Pallava, Chola, Pandya and Nayak patronage. Its temples remain active places of worship as well as major works of architecture, sculpture, music and ritual tradition.",
  time: "November to February usually offers the most comfortable weather for a multi-city temple circuit. Check official temple notices before travel because darshan hours and festival access can change.",
  food: "Temple towns offer vegetarian meals, tiffin, filter coffee and regional dishes. Respect local fasting customs and allow time for prasadam where available.",
  tourist: places.map(([name, city, info]) => ({
    name,
    city,
    info,
    location: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${city}, Tamil Nadu`)}`,
  })),
};

const existingIndex = database.state.findIndex((state) => state.id === tamilNadu.id || state.name === tamilNadu.name);
if (existingIndex >= 0) database.state[existingIndex] = tamilNadu;
else database.state.push(tamilNadu);

await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log("Tamil Nadu devotional destination added to db.json.");
