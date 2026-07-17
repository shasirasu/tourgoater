CREATE TABLE IF NOT EXISTS users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('Beach', 'Mountain', 'City', 'Nature')),
  description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accommodations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  accommodation_type VARCHAR(20) NOT NULL CHECK (accommodation_type IN ('Hotel', 'Resort')),
  price_per_night NUMERIC(10, 2) NOT NULL CHECK (price_per_night >= 0),
  rooms_available INTEGER NOT NULL DEFAULT 0 CHECK (rooms_available >= 0),
  rating NUMERIC(2, 1) CHECK (rating >= 0 AND rating <= 5),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (destination_id, name)
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
  accommodation_id INTEGER NOT NULL REFERENCES accommodations(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  transport_type VARCHAR(20) NOT NULL CHECK (transport_type IN ('Flight', 'Train', 'Bus')),
  transport_cost NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (transport_cost >= 0),
  total_budget NUMERIC(10, 2) NOT NULL CHECK (total_budget >= 0),
  estimated_cost NUMERIC(10, 2) NOT NULL CHECK (estimated_cost >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS saved_plans (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_key VARCHAR(80) NOT NULL,
  destination_name VARCHAR(120) NOT NULL,
  place_name VARCHAR(160) NOT NULL,
  place_location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, destination_key, place_name)
);

CREATE INDEX IF NOT EXISTS accommodations_destination_id_idx
  ON accommodations(destination_id);

CREATE INDEX IF NOT EXISTS trips_user_id_idx
  ON trips(user_id);

CREATE INDEX IF NOT EXISTS trips_destination_id_idx
  ON trips(destination_id);

CREATE INDEX IF NOT EXISTS saved_plans_user_id_idx
  ON saved_plans(user_id);
