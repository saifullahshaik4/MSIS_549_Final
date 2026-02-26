# Ridelytics Backend

Backend API for location-based ad recommendations in the Ridelytics PWA.

## Features

- Location-based ad recommendations using Haversine distance calculation
- Simple JSON file storage (no database needed)
- RESTful API endpoints
- CORS enabled for frontend communication

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend directory:

```
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Add Ad Data

Edit `src/data/ads.json` to add or modify advertisements. Each ad should have:

```json
{
  "id": "unique-id",
  "businessName": "Business Name",
  "imageUrl": "/path/to/image.png",
  "websiteUrl": "https://example.com",
  "latitude": 47.6740,
  "longitude": -122.1215,
  "radius": 5000,
  "active": true,
  "priority": 1
}
```

- **radius**: Service radius in meters
- **priority**: Lower number = higher priority (1 is highest)
- **active**: Set to false to temporarily disable an ad

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status.

### Get Ad Recommendations

```
GET /api/ads/recommendations?latitude={lat}&longitude={lng}
```

**Parameters:**
- `latitude` (required): User's current latitude
- `longitude` (required): User's current longitude

**Response:**
```json
{
  "ad": {
    "id": "qamaria-redmond",
    "businessName": "Qamaria Redmond",
    "imageUrl": "/path/to/image.png",
    "websiteUrl": "https://order.qamariacoffee.com/...",
    "distance": 1234
  }
}
```

Or if no ads match:
```json
{
  "ad": null,
  "message": "No ads available in your area"
}
```

### Get All Ads (Debug)

```
GET /api/ads
```

Returns all ads from ads.json (for debugging purposes).

## How It Works

1. Frontend sends user's GPS coordinates to backend
2. Backend calculates distance from user to each ad location using Haversine formula
3. Filters ads where `distance <= radius`
4. Sorts by priority (then by distance)
5. Returns the closest matching ad

## Distance Calculation

Uses the Haversine formula to calculate great-circle distances between two points on Earth:

```typescript
calculateDistance(userLat, userLng, adLat, adLng) → distance in meters
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app with routes
│   ├── server.ts           # Server entry point
│   ├── data/
│   │   └── ads.json        # Ad data storage
│   └── utils/
│       └── distance.ts     # Haversine distance calculator
├── package.json
├── tsconfig.json
└── .env
```

## Adding New Ads

Simply edit `src/data/ads.json` and restart the server. No database migrations needed!

## CORS

The backend allows requests from the frontend URL specified in `.env` (default: `http://localhost:3000`).

## Notes

- The server runs on port 3001 by default
- All coordinates use decimal degrees (latitude: -90 to 90, longitude: -180 to 180)
- Distances are returned in meters
- The default ad (priority 10, large radius) acts as a fallback
