# Tourgoater API — Thunder Client Guide

## Setup

Use one of these base URLs:

- Local: `http://localhost:3000`
- Vercel: `https://tourgoater.vercel.app`

Create a Thunder Client environment variable named `baseUrl`. After login or OTP verification, copy the returned JWT into a variable named `token`.

For protected requests add:

```text
Authorization: Bearer {{token}}
Content-Type: application/json
```

Admin endpoints require a token belonging to a user whose database role is `admin`.

## Health (public)

| Method | URL | Purpose |
|---|---|---|
| GET | `{{baseUrl}}/api/health` | Confirm API and serverless function are running |

## Authentication

| Method | URL | Auth | Body |
|---|---|---|---|
| POST | `{{baseUrl}}/api/auth/signup` | Public | `{ "name": "Test User", "email": "test@example.com", "password": "Password123" }` |
| POST | `{{baseUrl}}/api/auth/login` | Public | `{ "email": "test@example.com", "password": "Password123" }` |
| POST | `{{baseUrl}}/api/auth/verify-otp` | Public | `{ "challengeId": 1, "code": "123456" }` |
| POST | `{{baseUrl}}/api/auth/forgot-password` | Public | `{ "email": "test@example.com" }` |
| POST | `{{baseUrl}}/api/auth/reset-password` | Public | `{ "challengeId": 1, "code": "123456", "password": "NewPassword123" }` |
| GET | `{{baseUrl}}/api/auth/me` | Bearer token | None |

Signup/login may return `otpRequired`, `challengeId`, and `emailHint`. Local development also returns `debugOtp` when email delivery is not configured. OTPs expire after five minutes.

## User preferences (Bearer token)

| Method | URL | Body |
|---|---|---|
| GET | `{{baseUrl}}/api/preferences` | None |
| PUT | `{{baseUrl}}/api/preferences` | `{ "tripBudget": 30000, "tripDays": 3 }` |

## Saved places and complete trip plans (Bearer token)

| Method | URL | Purpose / Body |
|---|---|---|
| GET | `{{baseUrl}}/api/plans` | List every saved place |
| GET | `{{baseUrl}}/api/plans?destinationKey=4` | List saved places for one destination |
| POST | `{{baseUrl}}/api/plans` | Save one place; use body below |
| DELETE | `{{baseUrl}}/api/plans/:id` | Delete one saved place |
| GET | `{{baseUrl}}/api/plans/trips` | List complete saved trip plans |
| POST | `{{baseUrl}}/api/plans/trips` | Save a complete trip; use body below |
| PUT | `{{baseUrl}}/api/plans/trips/:id` | Update a complete trip; same body as POST |
| DELETE | `{{baseUrl}}/api/plans/trips/:id` | Delete a complete trip |

Save-place body:

```json
{
  "destinationKey": "4",
  "destinationName": "Kerala",
  "placeName": "Munnar",
  "placeLocation": "https://maps.google.com/?q=Munnar"
}
```

Complete-trip body (`flight` and `hotel` may be `null`):

```json
{
  "destinationKey": "4",
  "destinationName": "Kerala",
  "places": [
    { "name": "Munnar", "location": "https://maps.google.com/?q=Munnar" }
  ],
  "flight": null,
  "hotel": null,
  "departureCity": "Chennai",
  "departureDate": "2026-09-10",
  "checkIn": "2026-09-10",
  "checkOut": "2026-09-13",
  "travelers": 2,
  "budget": 30000,
  "totalCost": 24500
}
```

## Live searches (Bearer token)

These use SerpApi and require `SERPAPI_KEY` on the backend.

| Method | URL | Purpose |
|---|---|---|
| GET | `{{baseUrl}}/api/flights?origin=Chennai&destination=Kochi&date=2026-09-10` | Search one-way live flights |
| GET | `{{baseUrl}}/api/hotels?destination=Munnar&checkIn=2026-09-10&checkOut=2026-09-13&adults=2` | Search live hotels |

Dates must use `YYYY-MM-DD`. Hotel checkout must be later than check-in. Adults are restricted to 1–9 by the API.

## Route map (public)

| Method | URL | Body |
|---|---|---|
| POST | `{{baseUrl}}/api/route-map/coordinates` | Place names or existing coordinates; sample below |
| POST | `{{baseUrl}}/api/route-map` | Two or more coordinates; sample below |

Resolve place coordinates:

```json
{
  "places": [
    { "name": "Munnar", "destination": "Kerala" },
    { "name": "Kochi", "destination": "Kerala" }
  ]
}
```

Calculate a road route:

```json
{
  "coordinates": [
    { "lat": 10.0889, "lng": 77.0595 },
    { "lat": 9.9312, "lng": 76.2673 }
  ]
}
```

## Booking inquiries (Bearer token)

| Method | URL | Purpose / Body |
|---|---|---|
| GET | `{{baseUrl}}/api/bookings` | List the logged-in user's inquiries |
| GET | `{{baseUrl}}/api/bookings/messages` | List messages for the user's inquiries |
| GET | `{{baseUrl}}/api/bookings/notifications` | List unread admin replies |
| PATCH | `{{baseUrl}}/api/bookings/notifications/read` | Mark all admin replies as read; no body |
| POST | `{{baseUrl}}/api/bookings/:id/messages` | Send follow-up: `{ "message": "Please confirm hotel availability." }` |
| POST | `{{baseUrl}}/api/bookings` | Create an inquiry; use body below |

Create-booking body:

```json
{
  "booking": {
    "destinationId": "4",
    "destinationName": "Kerala",
    "places": [{ "name": "Munnar" }],
    "flight": null,
    "hotel": null,
    "overallTotal": 24500
  },
  "travelerName": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "address": "12 Sample Street",
  "city": "Chennai",
  "postalCode": "600001",
  "inquiry": "Please contact me about this trip."
}
```

## Admin (Admin Bearer token)

### Dashboard and inquiries

| Method | URL | Body |
|---|---|---|
| GET | `{{baseUrl}}/api/admin/overview` | None |
| GET | `{{baseUrl}}/api/admin/inquiries` | None |
| GET | `{{baseUrl}}/api/admin/inquiry-messages` | None |
| POST | `{{baseUrl}}/api/admin/inquiries/:id/messages` | `{ "message": "Your booking request is being reviewed." }` |
| PATCH | `{{baseUrl}}/api/admin/inquiries/:id` | `{ "status": "contacted" }` |

Valid inquiry statuses: `pending`, `contacted`, `confirmed`, `cancelled`.

### Users

| Method | URL | Body |
|---|---|---|
| GET | `{{baseUrl}}/api/admin/users` | None |
| PATCH | `{{baseUrl}}/api/admin/users/:id` | `{ "role": "admin" }` or `{ "role": "user" }` |
| DELETE | `{{baseUrl}}/api/admin/users/:id` | None; cannot delete your own account |

### Destination catalog

| Method | URL | Body |
|---|---|---|
| GET | `{{baseUrl}}/api/admin/destinations` | None |
| GET | `{{baseUrl}}/api/admin/destinations/:id/details` | None |
| POST | `{{baseUrl}}/api/admin/destinations` | Destination body below |
| PUT | `{{baseUrl}}/api/admin/destinations/:id` | Destination update body below |
| DELETE | `{{baseUrl}}/api/admin/destinations/:id` | None |
| POST | `{{baseUrl}}/api/admin/import-catalog` | None; imports `db.json` into PostgreSQL |

Create destination:

```json
{
  "id": "kerala-test",
  "name": "Kerala Test",
  "capital": "Thiruvananthapuram",
  "bestFor": "Backwaters",
  "about": "Test destination",
  "dailyExpenses": 2200
}
```

Update destination (the ID stays in the URL):

```json
{
  "name": "Kerala Test Updated",
  "capital": "Thiruvananthapuram",
  "bestFor": "Backwaters and food",
  "about": "Updated test destination",
  "dailyExpenses": 2400
}
```

### Catalog places

| Method | URL | Body |
|---|---|---|
| POST | `{{baseUrl}}/api/admin/places` | Place body below |
| PUT | `{{baseUrl}}/api/admin/places/:id` | Place update body below |
| DELETE | `{{baseUrl}}/api/admin/places/:id` | None |

Create place:

```json
{
  "destinationId": "4",
  "name": "Test Viewpoint",
  "city": "Munnar",
  "info": "A test place for API checking.",
  "mapUrl": "https://maps.google.com/?q=Munnar"
}
```

Update place:

```json
{
  "name": "Updated Test Viewpoint",
  "city": "Munnar",
  "info": "Updated test place.",
  "mapUrl": "https://maps.google.com/?q=Munnar"
}
```

### Catalog hotels

| Method | URL | Body |
|---|---|---|
| POST | `{{baseUrl}}/api/admin/hotels` | Hotel body below |
| PUT | `{{baseUrl}}/api/admin/hotels/:id` | Hotel update body below |
| DELETE | `{{baseUrl}}/api/admin/hotels/:id` | None |

Create hotel:

```json
{
  "destinationId": "4",
  "name": "API Test Hotel",
  "type": "Hotel",
  "area": "Munnar",
  "pricePerNight": 2500,
  "roomsAvailable": 5,
  "rating": 4.2
}
```

Update hotel:

```json
{
  "name": "Updated API Test Hotel",
  "type": "Resort",
  "area": "Munnar",
  "pricePerNight": 2800,
  "roomsAvailable": 4,
  "rating": 4.4
}
```

## Recommended Thunder Client test order

1. `GET /api/health`
2. `POST /api/auth/signup`
3. `POST /api/auth/verify-otp`
4. Save the returned `token`
5. `GET /api/auth/me`
6. Test preferences, plans, bookings, flights, hotels, and route map
7. Log in with the configured admin email to test `/api/admin/*`

Use IDs returned by POST/GET requests in endpoints containing `:id`. Avoid running DELETE requests against real user data.
