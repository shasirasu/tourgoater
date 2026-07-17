INSERT INTO destinations (name, category, description, image_url)
VALUES
  ('Goa', 'Beach', 'A coastal destination known for beaches and relaxed stays.', NULL),
  ('Ooty', 'Mountain', 'A hill destination with cool weather and scenic views.', NULL),
  ('Chennai', 'City', 'A coastal city with culture, food, and historic places.', NULL)
ON CONFLICT (name) DO NOTHING;

INSERT INTO accommodations (
  destination_id,
  name,
  accommodation_type,
  price_per_night,
  rooms_available,
  rating,
  image_url
)
SELECT id, 'Sea Breeze Resort', 'Resort', 4500.00, 8, 4.4, NULL
FROM destinations
WHERE name = 'Goa'
ON CONFLICT (destination_id, name) DO NOTHING;

INSERT INTO accommodations (
  destination_id,
  name,
  accommodation_type,
  price_per_night,
  rooms_available,
  rating,
  image_url
)
SELECT id, 'Hill View Hotel', 'Hotel', 2800.00, 5, 4.2, NULL
FROM destinations
WHERE name = 'Ooty'
ON CONFLICT (destination_id, name) DO NOTHING;

INSERT INTO accommodations (
  destination_id,
  name,
  accommodation_type,
  price_per_night,
  rooms_available,
  rating,
  image_url
)
SELECT id, 'Marina City Hotel', 'Hotel', 3200.00, 12, 4.1, NULL
FROM destinations
WHERE name = 'Chennai'
ON CONFLICT (destination_id, name) DO NOTHING;
