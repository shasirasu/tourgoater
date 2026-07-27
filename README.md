# Tourgoater

Tourgoater is a full-stack India travel-planning application. A user can explore destinations, select places, define a stay-and-activity budget, compare live flights and hotels, calculate an overall total, save and edit complete plans, and submit an in-app booking inquiry.

## Main features

- Account registration, login, persistent authentication, and logout
- Browse and search Indian destinations
- Four-step planner on every destination page:
  1. Select places
  2. Set the stay-and-activity budget, dates, travelers, and departure city
  3. Search and select a live flight
  4. Search and select a live hotel
- Separate flight travel add-on and stay-and-activity budget
- Overall total and generated daily itinerary
- Individually bookmarked places
- Complete saved trip plans
- Edit an existing plan without creating a duplicate
- Delete a complete plan with a five-second Undo window
- In-app overall-booking review page
- Persistent traveler details and booking inquiries
- Admin destination, place, and hotel management
- SQLite for local development and PostgreSQL for deployment

## Technology

- React 19 and React Router
- Vite
- Express 5
- SQLite (`node:sqlite`) for local development
- PostgreSQL (`pg`) when `DATABASE_URL` is configured
- JWT authentication and bcrypt password hashing
- SerpAPI for live flight and hotel results

## Requirements

- Node.js 22 or later (required by `node:sqlite`)
- npm
- A SerpAPI key for live flight and hotel searches
- Optional PostgreSQL database for production

## Local setup

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Copy `.env.example` to `.env`.

3. Set at least these values:

   ```env
   PORT=3000
   SQLITE_DATABASE_PATH=server/data/tourgoater.db
   JWT_SECRET=replace_this_with_a_long_random_value
   CLIENT_URL=http://localhost:5173
   SERPAPI_KEY=your_serpapi_key
   ```

   Leave `DATABASE_URL` empty or remove it to use local SQLite. Set `ADMIN_EMAIL` to the email address that should receive the admin role.

4. Start the API in the first terminal:

   ```powershell
   npm run server
   ```

5. Start the React application in a second terminal:

   ```powershell
   npm run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173).

The Vite development server proxies `/api` requests to `http://localhost:3000`. Database tables are created automatically when the API starts.

## Complete user flow

### 1. Create an account

Open `/signup`, enter the account details, and submit. The API hashes the password and returns a JWT. The token is stored according to the selected session preference.

### 2. Explore destinations

Open `/browse`, search for a state or capital, and select a destination. Every destination uses `/destination/:id` and the same shared planning flow.

### 3. Select places

Choose one or more tourist places. The selection is stored locally for that destination and is used to generate the itinerary.

### 4. Set the trip budget

Enter:

- Stay-and-activity budget
- Number of days
- Departure city or live location
- Travel date and preferred departure time

The entered budget covers the hotel, food, activities, and local travel. Live flight travel is calculated separately as an add-on.

### 5. Select a live flight

The application requests `/api/flights` with the departure city, destination, and date. Select one returned flight. Its price is multiplied by the traveler count and displayed as the travel add-on.

### 6. Select a live hotel

The application requests `/api/hotels` with the destination, dates, and guest count. Select one hotel to include its live total in the plan.

### 7. Review the overall total

After both a flight and hotel are selected, the page displays:

- Stay-and-activity budget
- Hotel price and number of nights
- Food, activities, and local travel
- Remaining or exceeded trip budget
- Separate flight travel add-on
- Combined overall total
- Daily itinerary

The disclaimer explains that flight travel is added above the stay-and-activity budget.

### 8. Save a complete plan

Select **Save plan**. The plan is stored in `saved_trip_plans`, including places, flight, hotel, dates, travelers, budget, and total.

Open `/saved` to see two independent sections:

- **Full trip plans**: complete overall plans
- **Individual places**: bookmarked places grouped by destination

### 9. Edit or delete a plan

Select **Edit plan** on a full-plan card. The destination planner loads the exact stored places, flight, hotel, dates, travelers, and budget. Selecting **Update plan** updates the same database row.

Select **Delete plan** to remove a full plan. The card disappears immediately and an Undo notification remains for five seconds. Selecting **Undo** restores it. If the countdown finishes, `DELETE /api/plans/trips/:id` permanently deletes the record.

### 10. Use the in-app booking page

Select **Overall booking** after choosing a flight and hotel. Tourgoater opens `/booking` rather than redirecting to Google.

The booking page displays the complete plan and collects:

- Lead traveler name
- Email
- Phone number
- Full address
- City
- Six-digit postal code
- Optional inquiry or special requests

Selecting **Submit booking inquiry** stores the request in `booking_inquiries`. Confirmation is shown only after the API returns successfully, and the user receives the database inquiry reference number.

This is an inquiry workflow. It does not process card payments or issue airline or hotel tickets.

## Database tables

| Table | Purpose |
| --- | --- |
| `users` | Accounts, password hashes, and user/admin roles |
| `saved_plans` | Individually bookmarked tourist places |
| `saved_trip_plans` | Full plans containing places, flight, hotel, dates, travelers, budget, and total |
| `booking_inquiries` | Traveler contact information, address, inquiry, booking snapshot, total, and status |
| `user_preferences` | Stored trip budget and number-of-days preferences |
| `catalog_destinations` | Admin-managed destination records |
| `catalog_places` | Admin-managed tourist places |
| `catalog_hotels` | Admin-managed hotel inventory |

The complete PostgreSQL schema is in `server/schema.sql`. Runtime table creation for PostgreSQL and SQLite is implemented in `server/db.js`.

## Important API routes

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Saved places and plans

- `GET /api/plans`
- `POST /api/plans`
- `DELETE /api/plans/:id`
- `GET /api/plans/trips`
- `POST /api/plans/trips`
- `PUT /api/plans/trips/:id`
- `DELETE /api/plans/trips/:id`

### Booking inquiries

- `POST /api/bookings`
- `GET /api/bookings`

### Live travel data

- `GET /api/flights?origin=Chennai&destination=Delhi&date=2026-08-15`
- `GET /api/hotels?destination=Goa&checkIn=2026-08-15&checkOut=2026-08-18&adults=2`

### Other routes

- `GET /api/health`
- `/api/preferences`
- `/api/admin`

Saved-plan, booking, preference, and admin routes require a valid bearer token. Admin routes also require the admin role.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port; defaults to `3000` |
| `SQLITE_DATABASE_PATH` | No | Local SQLite file path |
| `DATABASE_URL` | Production | PostgreSQL connection string; switches storage from SQLite to PostgreSQL |
| `JWT_SECRET` | Production | Secret used to sign authentication tokens |
| `ADMIN_EMAIL` | No | Email that receives the admin role at signup |
| `CLIENT_URL` | No | CORS origin; defaults to `http://localhost:5173` |
| `SERPAPI_KEY` | Live search | Key used by flight and hotel APIs |
| `GMAIL_USER` | Production email OTP | Gmail address used to send login codes |
| `GMAIL_APP_PASSWORD` | Production email OTP | Google App Password for the sender account |

## Verification

Run the production build:

```powershell
npm run build
```

Check changed files for whitespace errors:

```powershell
git diff --check
```

Check server route syntax when modifying API files:

```powershell
node --check server/routes/plans.js
node --check server/routes/bookings.js
```

The build may report a chunk-size warning because the main client bundle is larger than 500 kB. This warning does not fail the build.

## Production deployment

1. Create a PostgreSQL database such as Neon.
2. Set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `SERPAPI_KEY`, and optionally `ADMIN_EMAIL` in the deployment environment.
3. Deploy the repository.
4. Open `/api/health` and confirm it returns:

   ```json
   { "message": "Tourgoater API is running" }
   ```

5. Create a test account and verify the full destination → save plan → booking inquiry workflow.

When `DATABASE_URL` is present, the API connects to PostgreSQL and creates missing runtime tables automatically. Without it, local development uses SQLite.
