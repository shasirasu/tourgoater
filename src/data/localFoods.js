const localFoods = {
  "Andaman & Nicobar": { name: "Grilled island fish", detail: "Fresh local catch grilled with lime, chilli and island spices.", price: "₹250–₹500" },
  Punjab: { name: "Amritsari kulcha", detail: "Crisp stuffed bread served with chole, onion and tangy chutney.", price: "₹100–₹220" },
  Rajasthan: { name: "Dal baati churma", detail: "Baked baati with spiced dal, ghee and sweet crumbled churma.", price: "₹180–₹350" },
  Kerala: { name: "Kerala banana chips", detail: "Thin raw-banana slices fried in coconut oil and lightly salted.", price: "₹80–₹180" },
  Maharashtra: { name: "Vada pav", detail: "Spiced potato fritter in a pav with garlic and green chutneys.", price: "₹20–₹60" },
  Uttarakhand: { name: "Kafuli", detail: "A comforting Garhwali curry made with leafy greens and local spices.", price: "₹140–₹280" },
  "Himachal Pradesh": { name: "Himachali dham", detail: "A festive plate of rice, lentils and yoghurt-based curries.", price: "₹200–₹400" },
  Gujarat: { name: "Khaman dhokla", detail: "Soft steamed gram-flour bites tempered with mustard and curry leaves.", price: "₹60–₹150" },
  "Tamil Nadu": { name: "Kothu parotta", detail: "Chopped flaky parotta tossed on a hot griddle with masala and vegetables or egg.", price: "₹100–₹220" },
  "Andhra Pradesh": { name: "Andhra meals", detail: "Rice with fiery pickles, pappu, vegetables, rasam and curd.", price: "₹150–₹300" },
  "Arunachal Pradesh": { name: "Thukpa", detail: "A warm noodle soup with vegetables, herbs and optional meat.", price: "₹120–₹250" },
  Assam: { name: "Khar", detail: "A distinct Assamese preparation of vegetables or papaya with an alkaline seasoning.", price: "₹150–₹300" },
  Bihar: { name: "Litti chokha", detail: "Roasted wheat balls filled with sattu, served with smoky mashed vegetables.", price: "₹80–₹180" },
  Chhattisgarh: { name: "Faraa", detail: "Steamed rice-flour dumplings seasoned with herbs and spices.", price: "₹60–₹140" },
  Goa: { name: "Goan fish curry rice", detail: "Coconut-based tangy fish curry served with steamed rice.", price: "₹220–₹450" },
  Haryana: { name: "Bajra khichdi", detail: "Pearl millet and lentils slow-cooked into a hearty rustic meal.", price: "₹120–₹250" },
  Jharkhand: { name: "Dhuska", detail: "Crisp rice-and-lentil bread commonly served with potato or chickpea curry.", price: "₹60–₹150" },
  Karnataka: { name: "Mysore masala dosa", detail: "Crisp dosa layered with spicy red chutney and potato filling.", price: "₹90–₹200" },
  "Madhya Pradesh": { name: "Poha jalebi", detail: "Light savoury poha paired with hot, crisp and sweet jalebi.", price: "₹50–₹120" },
  Manipur: { name: "Eromba", detail: "A bold mash of vegetables, fermented fish and chillies.", price: "₹140–₹280" },
  Meghalaya: { name: "Jadoh", detail: "Khasi red rice cooked with aromatic spices and traditionally served with meat.", price: "₹150–₹300" },
  Mizoram: { name: "Bai", detail: "A gentle stew of seasonal vegetables, herbs and optional meat.", price: "₹130–₹260" },
  Nagaland: { name: "Smoked pork with bamboo shoot", detail: "Smoky pork simmered with fermented bamboo shoot and Naga chillies.", price: "₹250–₹450" },
  Odisha: { name: "Dalma", detail: "Lentils cooked with vegetables, coconut and a fragrant roasted-spice mix.", price: "₹120–₹250" },
  Sikkim: { name: "Momos", detail: "Steamed dumplings filled with vegetables or meat and served with chilli chutney.", price: "₹80–₹180" },
  Telangana: { name: "Hyderabadi biryani", detail: "Fragrant basmati rice layered with spiced vegetables or meat and slow-cooked.", price: "₹180–₹400" },
  Tripura: { name: "Chakhwi", detail: "A traditional bamboo-shoot and vegetable dish with gentle local flavours.", price: "₹140–₹280" },
  "Uttar Pradesh": { name: "Kachori sabzi", detail: "Flaky fried kachori served with a deeply spiced potato curry.", price: "₹50–₹140" },
  "West Bengal": { name: "Kathi roll", detail: "Flaky paratha wrapped around spiced vegetables, egg or meat.", price: "₹80–₹220" },
  Puducherry: { name: "Pondicherry fish curry", detail: "A coastal Tamil-French style curry with coconut, tomato and fresh fish.", price: "₹220–₹450" },
};

export function getLocalFood(destinationName) {
  return localFoods[destinationName] ?? null;
}

