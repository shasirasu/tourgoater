export const tripPlanning = {
  "1": { dailyExpenses: 2100, hotels: [
    { id: "andaman-budget", name: "Port Blair Comfort Inn", type: "Hotel", area: "Port Blair", pricePerNight: 2800, roomsAvailable: 5, rating: 4.1, isSample: true },
    { id: "andaman-island", name: "Island Breeze Resort", type: "Resort", area: "Havelock Island", pricePerNight: 4800, roomsAvailable: 4, rating: 4.5, isSample: true },
  ]},
  "2": { dailyExpenses: 1500, hotels: [
    { id: "punjab-budget", name: "Amritsar Heritage Stay", type: "Hotel", area: "Amritsar", pricePerNight: 1800, roomsAvailable: 7, rating: 4.2, isSample: true },
    { id: "punjab-premium", name: "Golden City Hotel", type: "Hotel", area: "Amritsar", pricePerNight: 3200, roomsAvailable: 4, rating: 4.5, isSample: true },
  ]},
  "3": { dailyExpenses: 1700, hotels: [
    { id: "rajasthan-budget", name: "Pink City Haveli", type: "Heritage stay", area: "Jaipur", pricePerNight: 2200, roomsAvailable: 6, rating: 4.3, isSample: true },
    { id: "rajasthan-palace", name: "Desert Courtyard Hotel", type: "Hotel", area: "Jaisalmer", pricePerNight: 3900, roomsAvailable: 3, rating: 4.6, isSample: true },
  ]},
  "4": { dailyExpenses: 1800, hotels: [] },
  "5": { dailyExpenses: 1900, hotels: [
    { id: "maharashtra-budget", name: "Konkan Coast Stay", type: "Hotel", area: "Ratnagiri", pricePerNight: 2400, roomsAvailable: 5, rating: 4.2, isSample: true },
    { id: "maharashtra-city", name: "Mumbai Central Hotel", type: "Hotel", area: "Mumbai", pricePerNight: 4200, roomsAvailable: 3, rating: 4.4, isSample: true },
  ]},
  "6": { dailyExpenses: 1600, hotels: [
    { id: "uttarakhand-budget", name: "Rishikesh River Stay", type: "Guest house", area: "Rishikesh", pricePerNight: 1900, roomsAvailable: 6, rating: 4.3, isSample: true },
    { id: "uttarakhand-hills", name: "Himalayan View Hotel", type: "Hotel", area: "Mussoorie", pricePerNight: 3400, roomsAvailable: 4, rating: 4.5, isSample: true },
  ]},
  "7": { dailyExpenses: 1700, hotels: [
    { id: "himachal-budget", name: "Manali Pine Lodge", type: "Lodge", area: "Manali", pricePerNight: 2100, roomsAvailable: 8, rating: 4.3, isSample: true },
    { id: "himachal-valley", name: "Valley Snow Resort", type: "Resort", area: "Shimla", pricePerNight: 3800, roomsAvailable: 3, rating: 4.6, isSample: true },
  ]},
  "8": { dailyExpenses: 1500, hotels: [
    { id: "gujarat-budget", name: "Ahmedabad City Stay", type: "Hotel", area: "Ahmedabad", pricePerNight: 1800, roomsAvailable: 7, rating: 4.1, isSample: true },
    { id: "gujarat-heritage", name: "Heritage Courtyard Hotel", type: "Heritage stay", area: "Ahmedabad", pricePerNight: 3100, roomsAvailable: 4, rating: 4.5, isSample: true },
  ]},
  "9": { dailyExpenses: 1700, hotels: [
    { id: "tamilnadu-pilgrim", name: "Temple Route Residency", type: "Hotel", area: "Madurai", pricePerNight: 1900, roomsAvailable: 8, rating: 4.2, isSample: true },
    { id: "tamilnadu-comfort", name: "Southern Pilgrim Comfort", type: "Hotel", area: "Rameswaram", pricePerNight: 3200, roomsAvailable: 5, rating: 4.5, isSample: true },
  ]},
};

export function getDestinationHotels(destination) {
  if (destination.accommodations?.length) return destination.accommodations;
  if (tripPlanning[destination.id]?.hotels?.length) return tripPlanning[destination.id].hotels;
  return [
    { id: `${destination.id}-value`, name: `${destination.capital} Value Stay`, type: "Hotel", area: destination.capital, pricePerNight: 1800, roomsAvailable: 6, rating: 4.1, isSample: true },
    { id: `${destination.id}-comfort`, name: `${destination.name} Comfort Hotel`, type: "Hotel", area: destination.capital, pricePerNight: 3100, roomsAvailable: 4, rating: 4.4, isSample: true },
  ];
}

export function buildTripEstimate(destination, days, budget = Infinity) {
  const tripDays = Math.max(1, Number(days) || 1);
  const nights = Math.max(1, tripDays - 1);
  const dailyExpenses = tripPlanning[destination.id]?.dailyExpenses ?? 1800;
  const hotels = getDestinationHotels(destination).filter((hotel) => hotel.roomsAvailable > 0);
  const choices = hotels
    .map((hotel) => {
      const hotelCost = hotel.pricePerNight * nights;
      const estimatedTripCost = hotelCost + dailyExpenses * tripDays;
      return { hotel, hotelCost, estimatedTripCost };
    })
    .filter((choice) => choice.estimatedTripCost <= budget)
    .sort((a, b) => b.hotel.pricePerNight - a.hotel.pricePerNight);

  return choices[0] ? { ...choices[0], nights, dailyExpenses } : null;
}
