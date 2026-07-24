import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const databasePath = path.join(root, "db.json");
const database = JSON.parse(await readFile(databasePath, "utf8"));

const states = [
  ["10", "Andhra Pradesh", "Amaravati", [["Sri Venkateswara Temple", "Tirupati"], ["RK Beach", "Visakhapatnam"], ["Araku Valley", "Araku"], ["Amaravati Stupa", "Amaravati"]]],
  ["11", "Arunachal Pradesh", "Itanagar", [["Tawang Monastery", "Tawang"], ["Ziro Valley", "Ziro"], ["Namdapha National Park", "Changlang"], ["Sela Pass", "Tawang"]]],
  ["12", "Assam", "Dispur", [["Kaziranga National Park", "Golaghat"], ["Kamakhya Temple", "Guwahati"], ["Majuli Island", "Majuli"], ["Sivasagar Sivadol", "Sivasagar"]]],
  ["13", "Bihar", "Patna", [["Mahabodhi Temple", "Bodh Gaya"], ["Nalanda Mahavihara", "Nalanda"], ["Vishwa Shanti Stupa", "Rajgir"], ["Takht Sri Patna Sahib", "Patna"]]],
  ["14", "Chhattisgarh", "Raipur", [["Chitrakote Falls", "Bastar"], ["Tirathgarh Falls", "Bastar"], ["Kanger Valley National Park", "Jagdalpur"], ["Sirpur Heritage Site", "Mahasamund"]]],
  ["15", "Goa", "Panaji", [["Basilica of Bom Jesus", "Old Goa"], ["Fontainhas", "Panaji"], ["Palolem Beach", "Canacona"], ["Dudhsagar Falls", "Sanguem"]]],
  ["16", "Haryana", "Chandigarh", [["Brahma Sarovar", "Kurukshetra"], ["Sultanpur National Park", "Gurugram"], ["Yadavindra Gardens", "Pinjore"], ["Morni Hills", "Panchkula"]]],
  ["17", "Jharkhand", "Ranchi", [["Baidyanath Dham", "Deoghar"], ["Betla National Park", "Latehar"], ["Hundru Falls", "Ranchi"], ["Dassam Falls", "Ranchi"]]],
  ["18", "Karnataka", "Bengaluru", [["Hampi", "Vijayanagara"], ["Mysore Palace", "Mysuru"], ["Abbey Falls", "Kodagu"], ["Badami Cave Temples", "Badami"]]],
  ["19", "Madhya Pradesh", "Bhopal", [["Khajuraho Temples", "Khajuraho"], ["Sanchi Stupa", "Sanchi"], ["Mahakaleshwar Temple", "Ujjain"], ["Kanha National Park", "Mandla"]]],
  ["20", "Manipur", "Imphal", [["Loktak Lake", "Moirang"], ["Kangla Fort", "Imphal"], ["INA Memorial", "Moirang"], ["Shirui Hills", "Ukhrul"]]],
  ["21", "Meghalaya", "Shillong", [["Living Root Bridges", "Nongriat"], ["Umiam Lake", "Shillong"], ["Umngot River", "Dawki"], ["Nohkalikai Falls", "Cherrapunji"]]],
  ["22", "Mizoram", "Aizawl", [["Reiek Tlang", "Reiek"], ["Vantawng Falls", "Serchhip"], ["Solomon's Temple", "Aizawl"], ["Phawngpui Peak", "Lawngtlai"]]],
  ["23", "Nagaland", "Kohima", [["Kisama Heritage Village", "Kohima"], ["Dzukou Valley", "Kohima"], ["Kohima War Cemetery", "Kohima"], ["Longwa Village", "Mon"]]],
  ["24", "Odisha", "Bhubaneswar", [["Jagannath Temple", "Puri"], ["Sun Temple", "Konark"], ["Chilika Lake", "Satapada"], ["Udayagiri and Khandagiri Caves", "Bhubaneswar"]]],
  ["25", "Sikkim", "Gangtok", [["Tsomgo Lake", "Gangtok"], ["Rumtek Monastery", "Gangtok"], ["Pemayangtse Monastery", "Pelling"], ["Gurudongmar Lake", "Mangan"]]],
  ["26", "Telangana", "Hyderabad", [["Charminar", "Hyderabad"], ["Golconda Fort", "Hyderabad"], ["Ramappa Temple", "Palampet"], ["Nagarjuna Sagar", "Nalgonda"]]],
  ["27", "Tripura", "Agartala", [["Ujjayanta Palace", "Agartala"], ["Neermahal", "Melaghar"], ["Unakoti Rock Carvings", "Unakoti"], ["Tripura Sundari Temple", "Udaipur"]]],
  ["28", "Uttar Pradesh", "Lucknow", [["Taj Mahal", "Agra"], ["Dashashwamedh Ghat", "Varanasi"], ["Ram Mandir", "Ayodhya"], ["Fatehpur Sikri", "Agra"]]],
  ["29", "West Bengal", "Kolkata", [["Victoria Memorial", "Kolkata"], ["Sundarbans National Park", "South 24 Parganas"], ["Tiger Hill", "Darjeeling"], ["Bishnupur Terracotta Temples", "Bankura"]]],
];

for (const [id, name, capital, places] of states) {
  const entry = {
    id, name, capital, bestFor: "Culture and nature",
    about: `${name} brings together distinctive landscapes, heritage, food and living traditions. Use this starter collection to build a practical, budget-aware route through four representative places.`,
    climate: "Conditions vary by region and season. Check local weather before travel and allow extra time during monsoon, winter or festival periods.",
    history: `${name}'s historic sites, sacred places and cultural centres reflect the many communities and dynasties that shaped the region.`,
    time: "Plan around local weather and festival calendars. Confirm attraction hours and access conditions shortly before departure.",
    food: `Explore regional dishes and locally run restaurants across ${name}; food costs are included in the daily planning estimate.`,
    tourist: places.map(([placeName, city]) => ({
      name: placeName, city,
      info: `${placeName} in ${city} is one of ${name}'s representative visitor experiences, selected for its cultural, natural, spiritual or historic significance.`,
      location: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${placeName}, ${city}, ${name}, India`)}`,
    })),
  };
  const index = database.state.findIndex((state) => state.id === id || state.name === name);
  if (index >= 0) database.state[index] = entry;
  else database.state.push(entry);
}

await writeFile(databasePath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
console.log(`Database now contains ${database.state.length} destinations.`);
