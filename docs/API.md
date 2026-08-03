# Tourgoater API Reference

This document describes the 46 HTTP endpoints implemented by the Tourgoater Express backend.

## Base URLs

- Local: `http://localhost:3000/api`
- Vercel: `https://<your-project>.vercel.app/api`

Requests and responses use JSON. Start the local API with:

```powershell
npm.cmd run server
```

## Authentication

Protected endpoints require the JWT returned by login or OTP verification:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Access labels used below:

- **Public**: no JWT required.
- **User**: valid JWT required.
- **Admin**: valid JWT plus a database user with `role: "admin"`.

Tokens expire after one day. Authentication failures return `401`; non-admin access to admin routes returns `403`.

## Common conventions

- Dates use `YYYY-MM-DD`.
- Costs are numeric Indian rupee amounts.
- Successful creation normally returns `201 Created`.
- Validation failures return `400 Bad Request`.
- Missing records return `404 Not Found`.
- Duplicate saved records may return `409 Conflict`.
- Unexpected failures normally return:

```json
{ "message": "Unexpected server error" }
```

## Endpoint summary

| Group | Count |
|---|---:|
| Health | 1 |
| Authentication | 6 |
| Preferences | 2 |
| Saved places and trips | 7 |
| Booking inquiries | 6 |
| Flights | 1 |
| Hotels | 1 |
| Route map | 2 |
| Administration | 20 |
| **Total** | **46** |

---

## 1. Health

### GET `/api/health`

Access: **Public**

Checks whether the backend is running.

Response:

```json
{ "message": "Tourgoater API is running" }
```

---

## 2. Authentication

### POST `/api/auth/signup`

Access: **Public**

Creates an unverified account and emails a six-digit OTP.

Body:

```json
{
  "name": "Anand Kumar",
  "email": "anand@example.com",
  "password": "minimum8characters"
}
```

Rules: all fields are required; password must contain at least 8 characters. A Gmail username without `@` is normalized to `<username>@gmail.com`.

Response `201`:

```json
{
  "otpRequired": true,
  "challengeId": 21,
  "emailHint": "an•••@example.com"
}
```

Local development may also return `debugOtp` when email delivery is unavailable.

### POST `/api/auth/login`

Access: **Public**

Body:

```json
{ "email": "anand@example.com", "password": "minimum8characters" }
```

Verified-user response:

```json
{
  "user": { "id": 4, "name": "Anand Kumar", "email": "anand@example.com", "role": "user" },
  "token": "<jwt>"
}
```

An unverified user receives an OTP challenge instead. Unknown accounts return `404` with `code: "ACCOUNT_NOT_FOUND"`.

### POST `/api/auth/verify-otp`

Access: **Public**

Verifies signup/login OTP and returns a JWT.

Body:

```json
{ "challengeId": 21, "code": "123456" }
```

Response:

```json
{
  "user": { "id": 4, "name": "Anand Kumar", "email": "anand@example.com", "role": "user" },
  "token": "<jwt>"
}
```

OTP expires after 5 minutes and allows at most 5 failed attempts.

### POST `/api/auth/forgot-password`

Access: **Public**

Body:

```json
{ "email": "anand@example.com" }
```

Response:

```json
{ "challengeId": 33, "emailHint": "an•••@example.com" }
```

### POST `/api/auth/reset-password`

Access: **Public**

Body:

```json
{
  "challengeId": 33,
  "code": "123456",
  "password": "newpassword123"
}
```

Response:

```json
{ "message": "Password updated. You can now sign in" }
```

### GET `/api/auth/me`

Access: **User**

Returns the currently authenticated account.

Response:

```json
{ "user": { "id": 4, "name": "Anand Kumar", "email": "anand@example.com", "role": "user" } }
```

---

## 3. User preferences

### GET `/api/preferences`

Access: **User**

Response:

```json
{ "preferences": { "trip_budget": 42000, "trip_days": 3 } }
```

If no preference exists, the API returns budget `0` and `3` days.

### PUT `/api/preferences`

Access: **User**

Creates or updates the user's trip preferences.

Body:

```json
{ "tripBudget": 42000, "tripDays": 3 }
```

Rules: budget must be at least 1000; days must be an integer from 1 to 30.

---

## 4. Saved places and complete trips

All endpoints in this section require **User** access.

### GET `/api/plans`

Lists individually saved places.

Optional query: `destinationKey=<state-id>`.

Response:

```json
{
  "plans": [
    {
      "id": 8,
      "destination_key": "9",
      "destination_name": "Tamil Nadu",
      "place_name": "Madurai",
      "place_location": "https://maps.example/...",
      "created_at": "2026-07-31T10:00:00.000Z"
    }
  ]
}
```

### POST `/api/plans`

Saves one place.

Body:

```json
{
  "destinationKey": "9",
  "destinationName": "Tamil Nadu",
  "placeName": "Madurai",
  "placeLocation": "https://maps.example/..."
}
```

`placeLocation` is optional. Saving the same place twice returns `409`.

### DELETE `/api/plans/:id`

Deletes one saved place owned by the authenticated user.

Response:

```json
{ "message": "Place removed from your plan" }
```

### GET `/api/plans/trips`

Lists complete saved trip plans belonging to the user. Each item includes destination, JSON-encoded places/flight/hotel, dates, traveller count, budget and total cost.

### POST `/api/plans/trips`

Creates a complete trip plan.

Body:

```json
{
  "destinationKey": "9",
  "destinationName": "Tamil Nadu",
  "places": [
    { "name": "Madurai", "location": "https://maps.example/..." }
  ],
  "flight": null,
  "hotel": null,
  "departureCity": "Chennai",
  "departureDate": "2026-08-10",
  "checkIn": "2026-08-10",
  "checkOut": "2026-08-13",
  "travelers": 2,
  "budget": 42000,
  "totalCost": 16800
}
```

At least one place and all city/date fields are required. Flight and hotel may be `null`.

Response `201`:

```json
{
  "trip": {
    "id": 12,
    "destination_key": "9",
    "destination_name": "Tamil Nadu",
    "created_at": "2026-07-31T10:00:00.000Z"
  }
}
```

### PUT `/api/plans/trips/:id`

Updates a complete trip owned by the user. Uses the same body as trip creation.

### DELETE `/api/plans/trips/:id`

Deletes a complete trip owned by the user.

Response:

```json
{ "message": "Overall plan deleted" }
```

---

## 5. Booking inquiries and messages

All endpoints in this section require **User** access.

### GET `/api/bookings`

Lists the user's booking inquiries.

Response shape:

```json
{ "inquiries": [{ "id": 2, "destination_name": "Goa", "status": "pending", "overall_total": 55000 }] }
```

### POST `/api/bookings`

Submits a booking inquiry.

Body:

```json
{
  "booking": {
    "destinationId": "4",
    "destinationName": "Goa",
    "overallTotal": 55000
  },
  "travelerName": "Anand Kumar",
  "email": "anand@example.com",
  "phone": "9876543210",
  "address": "12 Beach Road",
  "city": "Chennai",
  "postalCode": "600001",
  "inquiry": "Please arrange an airport pickup."
}
```

`booking.destinationId`, `booking.destinationName`, contact/address fields and a six-digit postal code are required. `inquiry` is optional.

### GET `/api/bookings/messages`

Lists all user/admin messages for inquiries owned by the user.

### POST `/api/bookings/:id/messages`

Adds a user message to an owned booking inquiry.

Body:

```json
{ "message": "Can the hotel check-in be moved to 2 PM?" }
```

Maximum length: 1500 characters.

### GET `/api/bookings/notifications`

Lists unread admin messages for the user.

### PATCH `/api/bookings/notifications/read`

Marks all unread admin inquiry messages belonging to the user as read.

Response:

```json
{ "message": "Notifications marked as read" }
```

---

## 6. Live flight search

### GET `/api/flights`

Access: **User**

Queries SerpApi Google Flights.

Query parameters:

| Name | Required | Description |
|---|---|---|
| `origin` | Yes | Origin city or airport |
| `destination` | Yes | Destination city or airport |
| `date` | Yes | Outbound date, `YYYY-MM-DD` |

Example:

```http
GET /api/flights?origin=Chennai&destination=Port%20Blair&date=2026-08-10
```

Response:

```json
{
  "originCode": "MAA",
  "destinationCode": "IXZ",
  "offers": [
    {
      "id": "token",
      "airline": "Air India",
      "flightNumber": "AI 123",
      "origin": "MAA",
      "destination": "IXZ",
      "departure": "2026-08-10T09:00",
      "arrival": "2026-08-10T11:15",
      "duration": "2h 15m",
      "stops": 0,
      "price": 6400,
      "currency": "INR"
    }
  ]
}
```

Requires the server environment variable `SERPAPI_KEY`.

---

## 7. Live hotel search

### GET `/api/hotels`

Access: **User**

Queries SerpApi Google Hotels. The frontend sends the user's first selected place as `destination`.

Query parameters:

| Name | Required | Description |
|---|---|---|
| `destination` | Yes | Place/city used as hotel search area |
| `checkIn` | Yes | Check-in date |
| `checkOut` | Yes | Check-out date; must be after check-in |
| `adults` | No | Guest count, clamped by the API to 1–9; default 2 |

Example:

```http
GET /api/hotels?destination=Neil%20Island&checkIn=2026-08-10&checkOut=2026-08-13&adults=2
```

Response:

```json
{
  "hotels": [
    {
      "id": "property-token",
      "name": "Island Resort",
      "type": "hotel",
      "description": "Beachfront accommodation",
      "image": "https://...",
      "rating": 4.4,
      "reviews": 320,
      "pricePerNight": 4200,
      "totalPrice": 12600,
      "amenities": ["Wi-Fi", "Breakfast"],
      "bookingLink": "https://..."
    }
  ],
  "checkIn": "2026-08-10",
  "checkOut": "2026-08-13"
}
```

Requires `SERPAPI_KEY`.

---

## 8. Route map

These endpoints are currently **Public**.

### POST `/api/route-map/coordinates`

Converts 1–30 place names into coordinates using OpenStreetMap Nominatim. Supplied coordinates are reused without geocoding.

Body:

```json
{
  "places": [
    { "name": "Madurai Meenakshi Temple", "destination": "Tamil Nadu" },
    { "name": "Rameswaram", "destination": "Tamil Nadu", "lat": 9.2876, "lng": 79.3129 }
  ]
}
```

Response:

```json
{
  "places": [
    { "name": "Madurai Meenakshi Temple", "lat": 9.9195, "lng": 78.1193 },
    { "name": "Rameswaram", "lat": 9.2876, "lng": 79.3129 }
  ]
}
```

### POST `/api/route-map`

Calculates a driving route through 2–30 coordinates using OSRM.

Body:

```json
{
  "coordinates": [
    { "lat": 9.9195, "lng": 78.1193 },
    { "lat": 9.2876, "lng": 79.3129 }
  ]
}
```

Response:

```json
{
  "coordinates": [[78.1193, 9.9195], [79.3129, 9.2876]],
  "distanceKm": 170,
  "durationMinutes": 205
}
```

---

## 9. Administration

Every endpoint in this section requires **Admin** access.

### Dashboard and inquiries

#### GET `/api/admin/overview`

Returns counts for users, destinations, places, hotels, saved plans and booking inquiries.

#### GET `/api/admin/inquiries`

Lists all booking inquiries with account and traveller details.

#### GET `/api/admin/inquiry-messages`

Lists all booking inquiry messages in chronological order.

#### POST `/api/admin/inquiries/:id/messages`

Body:

```json
{ "message": "Your booking request has been received." }
```

Adds an admin reply. Maximum length: 1500 characters.

#### PATCH `/api/admin/inquiries/:id`

Body:

```json
{ "status": "confirmed" }
```

Allowed statuses: `pending`, `contacted`, `confirmed`, `cancelled`.

### Users

#### GET `/api/admin/users`

Lists all users with ID, name, email, role and creation date.

#### PATCH `/api/admin/users/:id`

Body:

```json
{ "role": "admin" }
```

Allowed roles: `user`, `admin`.

#### DELETE `/api/admin/users/:id`

Deletes a user. An admin cannot delete their own account through this endpoint.

### Catalog destinations

#### GET `/api/admin/destinations`

Lists catalog destinations with place and hotel counts.

#### POST `/api/admin/destinations`

Body:

```json
{
  "id": "9",
  "name": "Tamil Nadu",
  "capital": "Chennai",
  "bestFor": "Temples and heritage",
  "about": "Southern Indian state",
  "dailyExpenses": 1700
}
```

`id`, `name` and `capital` are required.

#### PUT `/api/admin/destinations/:id`

Updates destination name, capital, best-for text, description and daily expenses.

#### DELETE `/api/admin/destinations/:id`

Deletes a catalog destination.

#### GET `/api/admin/destinations/:id/details`

Returns:

```json
{
  "destination": {},
  "places": [],
  "hotels": []
}
```

### Catalog places

#### POST `/api/admin/places`

Body:

```json
{
  "destinationId": "9",
  "name": "Madurai",
  "city": "Madurai",
  "info": "Historic temple city",
  "mapUrl": "https://maps.example/..."
}
```

#### PUT `/api/admin/places/:id`

Updates `name`, `city`, `info` and `mapUrl`.

#### DELETE `/api/admin/places/:id`

Deletes a catalog place.

### Catalog hotels

#### POST `/api/admin/hotels`

Body:

```json
{
  "destinationId": "9",
  "name": "Temple City Hotel",
  "type": "Hotel",
  "area": "Madurai",
  "pricePerNight": 2800,
  "roomsAvailable": 8,
  "rating": 4.3
}
```

#### PUT `/api/admin/hotels/:id`

Updates `name`, `type`, `area`, `pricePerNight`, `roomsAvailable` and `rating`.

#### DELETE `/api/admin/hotels/:id`

Deletes a catalog hotel.

### Catalog import

#### POST `/api/admin/import-catalog`

Imports destinations and places from the repository's `db.json`, and creates default catalog hotels. Existing destination/place records are updated where supported.

Response:

```json
{ "message": "Imported 28 destinations into the database" }
```

---

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Local Express port; defaults to 3000 |
| `DATABASE_URL` | PostgreSQL/Neon connection string |
| `JWT_SECRET` | JWT signing secret; required in production |
| `ADMIN_EMAIL` | Email that should receive the admin role |
| `CLIENT_URL` | Allowed CORS frontend origin |
| `SERPAPI_KEY` | Google Flights and Hotels provider key |
| `GMAIL_USER` | Gmail account used to send OTP messages |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password |

## cURL examples

Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anand@example.com","password":"minimum8characters"}'
```

Authenticated request:

```bash
curl http://localhost:3000/api/plans/trips \
  -H "Authorization: Bearer YOUR_TOKEN"
```

