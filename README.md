# Tourgoater

Tourgoater is a budget-focused trip planner. This Week 9 base contains user sign-up and login.

## Setup

1. Run `npm install` to install the app and SQLite dependency.
2. Copy `.env.example` to `.env` and enter a secure `JWT_SECRET`.
3. Start the API with `npm run server`. The SQLite database and tables are created automatically in `server/data/tourgoater.db`.
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

## Deploying to Vercel

1. Connect a Neon Postgres database to the Vercel project and confirm that it supplies `DATABASE_URL`.
2. Add `JWT_SECRET` in Vercel Project Settings > Environment Variables. Use a long random value and enable it for Production and Preview.
3. Set `CLIENT_URL` to the production site URL, for example `https://tourgoater.vercel.app`.
4. Push the repository to the Git provider connected to Vercel, then redeploy.
5. Open `/api/health` on the deployed domain. It should return `{"message":"Tourgoater API is running"}`.

The deployed API uses PostgreSQL and creates its tables automatically. Local development continues to use `server/data/tourgoater.db` when `DATABASE_URL` is not set.
