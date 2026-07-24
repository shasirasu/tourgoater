import database from "../../db.json";
import imageCatalog from "./travel-images.json";

function mergeImageTree(value, images) {
  if (Array.isArray(value)) return value.map((item, index) => mergeImageTree(item, images?.[index]));
  if (!value || typeof value !== "object") return value;

  const result = { ...value };
  for (const [key, imageValue] of Object.entries(images ?? {})) {
    if (["img", "images", "image"].includes(key)) result[key] = imageValue;
    else if (key in result) result[key] = mergeImageTree(result[key], imageValue);
  }
  return result;
}

const travelData = {
  ...database,
  state: mergeImageTree(database.state, imageCatalog.state),
};

export default travelData;
