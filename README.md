# Tourgoater

Tourgoater is a full-stack travel-planning and booking-inquiry application focused on destinations across India. Travelers can discover destinations, build a trip step by step, optionally add live flights and hotels, save complete plans, submit booking inquiries, track trip status, and communicate with an administrator inside the application.

This repository contains the React frontend, Express API, authentication system, local SQLite storage, production PostgreSQL support, Gmail OTP delivery, live travel search integrations, and admin dashboard.

## Contents

- [Features](#features)
- [Application flow](#application-flow)
- [Technology](#technology)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Local installation](#local-installation)
- [Environment variables](#environment-variables)
- [Gmail OTP setup](#gmail-otp-setup)
- [Admin access](#admin-access)
- [Database](#database)
- [API reference](#api-reference)
- [Frontend routes](#frontend-routes)
- [Production deployment](#production-deployment)
- [Testing and code quality](#testing-and-code-quality)
- [Troubleshooting](#troubleshooting)
- [Current limitations](#current-limitations)

## Features

### Accounts and security

- User signup with six-digit email OTP verification
- Standard login without requesting an OTP every time
- Clear signup prompt when a login email is not registered
- Forgot-password flow with email OTP verification
- Password hashing with bcrypt
- JWT-based authenticated API requests
- Remember-me support
- User and administrator roles
- Gmail usernames such as `exampleuser` are normalized to `exampleuser@gmail.com`

### Theme and interface

- Light mode is the default
- Users can select light or dark mode from the login/signup interface
- Theme choice applies throughout the application
- Responsive layouts for desktop and mobile
- Animated page transitions, saved-list animations, and booking-completion animation

### Destination planning

Every `/destination/:id` page follows the same four-step structure:

1. Select tourist places
2. Set the stay-and-activity budget and travel details
3. Search and optionally select a live flight
4. Search and optionally select a live hotel

After making a selection, the interface scrolls to the next step. Selecting a flight or hotel focuses the chosen result; removing it restores the complete result list.

Flights and hotels are optional. A traveler can create a trip:

- With both a flight and hotel
- With a flight but no hotel
- With a hotel but no flight
- Without either add-on

The stay-and-activity budget is displayed separately from flight travel. Flight cost is clearly identified as an add-on and is not silently included in the base travel budget.

### Saved plans

- Save individual tourist places
- Save a complete overall trip plan
- Keep saved places and full plans in separate sections
- Edit an existing plan without selecting everything again
- Delete a complete plan
- Undo an accidental deletion for five seconds
- View booking requests under ongoing trips
- View status updates made by an administrator

### Booking inquiries

- Review the complete plan inside `/booking`
- Collect traveler name, email, phone, address, city, and postal code
- Collect an initial inquiry or special request
- Submit without redirecting to Google
- Display a completion animation and thank-you message
- Store a snapshot of the selected plan
- Allow separate follow-up messages for every booking
- Allow admins to reply to each booking conversation
- Display unread admin replies in the notification bell
- Poll for new notifications every 30 seconds
- Mark notifications as read

The booking workflow submits an inquiry only. It does not charge a card, reserve inventory, issue a ticket, or guarantee a hotel room.

### Admin dashboard

- Dashboard totals for users, destinations, places, hotels, saved plans, and inquiries
- View and manage users
- Assign user or admin roles
- View all booking inquiries
- Change booking status to Pending, Ongoing, Completed, or Cancelled
- Read traveler follow-up messages
- Reply directly to a traveler’s booking inquiry
- Manage destinations, tourist places, and hotel catalog records
- Import the bundled destination catalog into PostgreSQL/Neon

## Application flow

### Traveler flow

1. Open `/signup` and create an account.
2. Enter the OTP sent to the signup email.
3. Sign in at `/login` after verification.
4. Browse destinations at `/browse`.
5. Open a destination and select places.
6. Enter budget, trip duration, origin, date, and travelers.
7. Search flights and hotels, or skip either optional section.
8. Generate the trip and review the itinerary and totals.
9. Save the complete plan or save individual places.
10. Open `/booking`, enter contact information, and submit the inquiry.
11. Open `/saved` to track the booking and send follow-up questions.
12. Use the notification bell when the administrator replies.

### Administrator flow

1. Sign up using the email configured in `ADMIN_EMAIL`.
2. Verify the signup OTP and sign in.
3. Open `/admin`.
4. Select **Inquiries** to view bookings.
5. Change the status or send a reply.
6. The reply appears in the traveler’s Saved Plans conversation and creates an unread notification.

## Technology

### Frontend

- React 19
- React Router 7
- Vite 7
- GSAP and Framer Motion
- Lucide React icons
- Plain CSS with light/dark theme variables

### Backend

- Node.js and Express 5
- JWT authentication
- bcrypt password hashing
- Nodemailer with Gmail SMTP
- SerpAPI-powered flight and hotel searches

### Storage

- Built-in Node SQLite for local development
- PostgreSQL through `pg` when `DATABASE_URL` is present
- Neon PostgreSQL is supported for hosted deployments

## Project structure

```text
tourgoater/
├── public/                  Static images and public assets
├── server/
│   ├── data/                Local SQLite database location
│   ├── middleware/          Authentication and authorization
│   ├── routes/              Auth, plans, booking, admin, flight and hotel APIs
│   ├── app.js               Express configuration and route mounting
│   ├── config.js            JWT configuration
│   ├── db.js                SQLite/PostgreSQL connection and runtime migrations
│   ├── index.js             Local API entry point
│   └── schema.sql           PostgreSQL schema reference
├── src/
│   ├── components/          Shared UI, header, auth and animations
│   ├── data/                Catalog and local/auth storage helpers
│   ├── pages/               Application screens
│   ├── App.jsx              Client routing and authentication state
│   ├── main.jsx             React entry point
│   └── styles.css           Global responsive and theme styling
├── .env.example             Environment variable template
├── db.json                  Bundled India destination catalog
├── package.json             Dependencies and scripts
├── vercel.json              Vercel configuration
└── vite.config.js           Vite and local API proxy configuration
```

## Requirements

- Node.js 22 or newer because local storage uses `node:sqlite`
- npm
- A modern browser
- Gmail account with two-step verification for real OTP email
- SerpAPI key for live flight and hotel results
- Neon or another PostgreSQL provider for persistent production storage

## Local installation

Clone the repository and enter its directory:

```powershell
git clone <repository-url>
cd tourgoater
```

Install dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env
```

For local SQLite, remove or comment out `DATABASE_URL` in `.env`. If a placeholder PostgreSQL URL remains, the server will try and fail to connect to it.

Start the API in the first terminal:

```powershell
npm run server
```

Start Vite in a second terminal:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at [http://localhost:3000](http://localhost:3000), and Vite proxies `/api` requests to it.

The application creates missing database tables and columns when the API starts.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Express port; defaults to `3000` |
| `SQLITE_DATABASE_PATH` | Local only | SQLite database file; defaults under `server/data` |
| `DATABASE_URL` | Production | PostgreSQL/Neon connection string; enables PostgreSQL instead of SQLite |
| `JWT_SECRET` | Yes in production | Long random secret used to sign authentication tokens |
| `ADMIN_EMAIL` | Recommended | Exact email that should receive admin access |
| `CLIENT_URL` | Production | Allowed frontend origin for CORS |
| `SERPAPI_KEY` | For live search | API key for flight and hotel search |
| `GMAIL_USER` | For OTP | Full Gmail sender address, for example `sender@gmail.com` |
| `GMAIL_APP_PASSWORD` | For OTP | The 16-character Google App Password, not the Gmail login password |
| `NODE_ENV` | Deployment | Set to `production` on production infrastructure |

Example local `.env`:

```env
PORT=3000
SQLITE_DATABASE_PATH=server/data/tourgoater.db
JWT_SECRET=replace-with-a-long-random-secret
ADMIN_EMAIL=adminsd@gmail.com
CLIENT_URL=http://localhost:5173
SERPAPI_KEY=your-serpapi-key
GMAIL_USER=your-sender@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

Never commit `.env`, database credentials, JWT secrets, or Gmail App Passwords.

## Gmail OTP setup

1. Sign in to the Gmail account that will send OTP emails.
2. Enable Google two-step verification.
3. Open Google Account → Security → App passwords.
4. Create an App Password for the Tourgoater mailer.
5. Set the Vercel/local variable name to `GMAIL_USER` and its value to the full Gmail address.
6. Add a second variable named `GMAIL_APP_PASSWORD` and use the generated App Password as its value.

In Vercel, do not enter `GMAIL_USER=address@gmail.com` in the **Name** field. Enter only:

```text
Name:  GMAIL_USER
Value: address@gmail.com
```

Then add:

```text
Name:  GMAIL_APP_PASSWORD
Value: your-app-password
```

Select Production and Preview as required, save the variables, and redeploy. Environment changes do not modify an already-built deployment.

In local development, if SMTP is unavailable, the server can return a development OTP for testing. Production intentionally fails OTP delivery when Gmail is not configured.

## Admin access

Set the admin email before creating the account:

```env
ADMIN_EMAIL=adminsd@gmail.com
```

Restart the API, sign up with that exact email, verify the OTP, and log in. The navigation will display **Admin**, which opens `/admin`.

An existing account matching `ADMIN_EMAIL` is promoted during a successful login. For security, do not share the admin credentials or use the same password in other systems.

## Database

### Tables

| Table | Stored information |
| --- | --- |
| `users` | Name, unique email, password hash, role, verification state and creation date |
| `email_otp_challenges` | Hashed signup OTP, expiry, attempts and used timestamp |
| `password_reset_challenges` | Hashed password-reset OTP, expiry, attempts and used timestamp |
| `saved_plans` | Individually bookmarked tourist places |
| `saved_trip_plans` | Full trip snapshot including places, optional flight/hotel, dates, travelers and totals |
| `user_preferences` | Stored travel budget and trip duration |
| `booking_inquiries` | Traveler details, plan snapshot, inquiry, total and workflow status |
| `booking_inquiry_messages` | Per-booking user/admin messages, timestamps and notification read state |
| `catalog_destinations` | Admin-managed destination metadata |
| `catalog_places` | Places belonging to catalog destinations |
| `catalog_hotels` | Hotel samples/inventory belonging to destinations |

The authoritative reference schema is in `server/schema.sql`. Runtime initialization and compatibility migrations are in `server/db.js`.

### Local SQLite

When `DATABASE_URL` is absent, the API stores data in `server/data/tourgoater.db` unless `SQLITE_DATABASE_PATH` overrides it. Keep this file private because it contains user and inquiry records.

### Neon PostgreSQL

Create a Neon project, copy its pooled connection string, and set it as `DATABASE_URL`. Restart or redeploy the API. Startup creates missing tables and migration columns automatically.

To inspect inquiries in the Neon SQL Editor:

```sql
SELECT id, user_id, destination_name, traveler_name, email, phone,
       inquiry, overall_total, status, created_at
FROM booking_inquiries
ORDER BY created_at DESC;
```

To inspect the conversation:

```sql
SELECT m.id, m.booking_inquiry_id, m.sender, m.message,
       m.read_at, m.created_at
FROM booking_inquiry_messages AS m
ORDER BY m.created_at DESC;
```

## API reference

Protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create an account and send signup OTP |
| POST | `/api/auth/verify-otp` | Verify signup OTP and finish authentication |
| POST | `/api/auth/login` | Log in with email and password |
| POST | `/api/auth/forgot-password` | Send password-reset OTP |
| POST | `/api/auth/reset-password` | Verify reset OTP and set a new password |
| GET | `/api/auth/me` | Return the authenticated account |

### Saved places and full plans

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/plans` | Load saved individual places |
| POST | `/api/plans` | Save an individual place |
| DELETE | `/api/plans/:id` | Delete an individual place |
| GET | `/api/plans/trips` | Load full saved trip plans |
| POST | `/api/plans/trips` | Save a full plan |
| PUT | `/api/plans/trips/:id` | Update an existing full plan |
| DELETE | `/api/plans/trips/:id` | Permanently delete a full plan |

### Booking inquiries and messages

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/bookings` | Load the current user’s booking inquiries |
| POST | `/api/bookings` | Submit a booking inquiry |
| GET | `/api/bookings/messages` | Load the user’s per-booking conversations |
| POST | `/api/bookings/:id/messages` | Send a follow-up message to admin |
| GET | `/api/bookings/notifications` | Load unread admin replies |
| PATCH | `/api/bookings/notifications/read` | Mark admin-reply notifications as read |

### Travel data

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/flights` | Search live flight offers through SerpAPI |
| GET | `/api/hotels` | Search live hotel offers through SerpAPI |

Example requests:

```text
/api/flights?origin=Chennai&destination=Delhi&date=2026-08-15
/api/hotels?destination=Goa&checkIn=2026-08-15&checkOut=2026-08-18&adults=2
```

### Admin

Admin routes use `/api/admin` and require the admin role. They provide dashboard totals, user management, destination/place/hotel CRUD, catalog import, booking inquiry status management, conversation loading, and inquiry replies.

### Health check

```http
GET /api/health
```

Expected response:

```json
{ "message": "Tourgoater API is running" }
```

## Frontend routes

| Route | Screen |
| --- | --- |
| `/` | Landing page |
| `/browse` | Destination listing and search |
| `/destination/:id` | Shared four-step destination planner |
| `/booking` | In-app overall booking inquiry form |
| `/saved` | Saved plans, places, ongoing trips and inquiry conversations |
| `/signup` | Account creation and signup OTP |
| `/login` | Login and forgot-password flow |
| `/admin` | Protected administrator dashboard |

## Production deployment

### Vercel checklist

1. Import the Git repository into Vercel.
2. Create a Neon PostgreSQL database.
3. Add `DATABASE_URL` to Vercel Environment Variables.
4. Add a strong `JWT_SECRET`.
5. Set `ADMIN_EMAIL`.
6. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
7. Set `SERPAPI_KEY`.
8. Set `CLIENT_URL` to the deployed frontend origin.
9. Apply variables to Production and Preview as needed.
10. Redeploy the project.
11. Open `/api/health`.
12. Test signup OTP, login, destination planning, booking submission, admin reply, and the user notification bell.

When logs say `Gmail OTP delivery is not configured`, one or both Gmail variables are absent from the active deployment. Correct the variable names, verify their selected environments, and redeploy.

## Testing and code quality

Run ESLint:

```powershell
npm run lint
```

Lint statically checks source code for likely errors, invalid patterns, and React hook mistakes. It does not run the application.

Build the production bundle:

```powershell
npm run build
```

Check backend JavaScript syntax:

```powershell
node --check server/db.js
node --check server/routes/auth.js
node --check server/routes/bookings.js
node --check server/routes/admin.js
```

Check Git whitespace errors:

```powershell
git diff --check
```

Vite may report that the main bundle exceeds 500 kB. That is a performance warning and does not mean the build failed.

## Troubleshooting

### Login says the account does not exist

The entered email is not registered. Select **Sign up now**, create the account, and verify the email OTP.

### Login asks to complete signup verification

The account exists but its signup OTP was never verified. Complete the OTP challenge before logging in.

### OTP is not sent

- Confirm `GMAIL_USER` contains the full Gmail address.
- Confirm `GMAIL_APP_PASSWORD` is a Google App Password, not the normal password.
- Remove accidental spaces from the password.
- Confirm two-step verification is enabled on the Gmail account.
- In Vercel, confirm both variables apply to the current environment.
- Redeploy after changing environment variables.
- Read Vercel function logs for the `/api/auth/signup` or `/api/auth/forgot-password` request.

### Gmail variable name contains invalid characters

The environment-variable **Name** must be only `GMAIL_USER`. Put the Gmail address in the separate **Value** field.

### Live flights or hotels do not load

Check `SERPAPI_KEY`, API quota, request dates, and server logs. The trip can still be created because flight and hotel selections are optional.

### SQLite parameter binding error

Restart with the current server code and ensure request payload values are strings/numbers rather than unsupported JavaScript objects. Full plan objects are serialized to JSON before database insertion.

### New table or column is missing

Restart the API locally or redeploy production. Runtime migrations execute during server startup.

### Admin link is missing

Confirm the logged-in email exactly matches `ADMIN_EMAIL`, restart/redeploy after changing it, log out, and log in again.

### Notification does not immediately appear

The header checks for admin replies every 30 seconds. Refreshing the page also fetches notifications immediately.

## Current limitations

- Booking submission creates an inquiry, not a confirmed reservation.
- No payment gateway is connected.
- Airline and hotel tickets are not issued by Tourgoater.
- Live search depends on SerpAPI availability and quota.
- Gmail SMTP is subject to Google sending limits and security policies.
- Notification delivery is in-app polling, not browser push notification.
- Production data should be backed up through the PostgreSQL provider.

## Privacy and security notes

- Never commit `.env` or credentials.
- Use a unique, strong `JWT_SECRET` in production.
- Rotate any credential accidentally shown in screenshots or committed to Git.
- Treat traveler phone numbers, addresses, emails, and inquiries as private data.
- Limit administrator access to trusted accounts.
- Use HTTPS in production.

## License

The package currently declares the ISC license. Add a root `LICENSE` file before public distribution if formal license text is required.
