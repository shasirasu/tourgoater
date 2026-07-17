# Tourgoater

Tourgoater is a budget-focused trip planner. This Week 9 base contains user sign-up and login.

## Setup

1. Create a PostgreSQL database: `createdb -U postgres tourgoater`.
2. Create the tables: `psql -U postgres -d tourgoater -f server/schema.sql`.
3. Add sample destinations and hotels: `psql -U postgres -d tourgoater -f server/seed.sql`.
4. Copy `.env.example` to `.env` and enter your database password and a secure `JWT_SECRET`.
5. Install packages with `npm install`.
6. Start the backend with `npm run server`.
7. In a second terminal, start React with `npm run dev`.
8. Open `http://localhost:5173`.

## Current Checkpoint

- Create an account
- Log in
- Keep the user logged in after a page refresh
- Log out

Destination and trip-planning features are future checkpoints.
