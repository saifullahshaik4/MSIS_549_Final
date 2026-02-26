# Ridelytics - Location-Based Ad PWA

A Progressive Web Application with location-based advertisement recommendations.

## Project Structure

```
MSIS_549_final/
├── nextjs-pwa/          # Frontend PWA (Next.js)
└── backend/             # Backend API (Express + TypeScript)
```

## Features

- **Real-time Location Tracking**: Uses browser Geolocation API to track user location
- **Location-Based Ads**: Shows relevant advertisements based on proximity
- **Progressive Web App**: Installable, works offline, push notifications
- **Interactive Map**: Real-time location display with Leaflet
- **Dynamic Content**: Ads change automatically as you move

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:3001`

### 2. Start the Frontend

```bash
cd nextjs-pwa
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Grant Location Permission

When you open the app, your browser will ask for location permission. Click "Allow" to enable location tracking.

## How It Works

```
User Opens PWA
    ↓
Browser Geolocation API
    ↓
Gets GPS Coordinates (lat, lng)
    ↓
Frontend Sends to Backend: GET /api/ads/recommendations?latitude=X&longitude=Y
    ↓
Backend Calculates Distances (Haversine Formula)
    ↓
Returns Closest Matching Ad
    ↓
Frontend Displays Dynamic Ad
```

## Backend API

See [backend/README.md](backend/README.md) for detailed API documentation.

**Key Endpoint:**
```
GET /api/ads/recommendations?latitude={lat}&longitude={lng}
```

## Frontend

See [nextjs-pwa/README.md](nextjs-pwa/README.md) for frontend documentation.

**Key Features:**
- Auto-starts location tracking on page load
- Fetches ads based on current location
- Updates dynamically as location changes
- Shows loading states and error handling

## Adding New Ads

Edit `backend/src/data/ads.json`:

```json
{
  "id": "unique-id",
  "businessName": "Your Business",
  "imageUrl": "/path/to/image.png",
  "websiteUrl": "https://yourbusiness.com",
  "latitude": 47.6740,
  "longitude": -122.1215,
  "radius": 5000,
  "active": true,
  "priority": 1
}
```

- **radius**: How far from the business location the ad will show (in meters)
- **priority**: Lower number = higher priority (1 is highest)

## Environment Variables

### Backend (.env)
```
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Testing Location-Based Ads

The backend includes sample ads for:
- **Qamaria Redmond** (47.6740, -122.1215) - 8km radius
- **Qamaria Seattle** (47.6062, -122.3321) - 5km radius
- **Bellevue** (47.6101, -122.2015) - 6km radius
- **Kirkland** (47.6815, -122.2087) - 5.5km radius

Move around (or change your mock location) to see different ads!

## Development

### Backend Development
```bash
cd backend
npm run dev      # Auto-reload on changes
```

### Frontend Development
```bash
cd nextjs-pwa
npm run dev      # Hot reload enabled
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd nextjs-pwa
npm run build
npm start
```

## Technologies

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Leaflet (Maps)
- Lucide React (Icons)
- Web Push API

### Backend
- Node.js + Express
- TypeScript
- JSON file storage (no database)
- CORS enabled

## Troubleshooting

### Location Not Working
1. Make sure you granted browser location permission
2. Check browser console for errors
3. Try HTTPS (some browsers require secure context)

### Ads Not Showing
1. Make sure backend is running on port 3001
2. Check browser console for API errors
3. Verify you're within radius of an ad location
4. Check `backend/src/data/ads.json` for active ads

### Backend Not Starting
1. Make sure port 3001 is not in use
2. Run `npm install` in backend folder
3. Check `.env` file exists

## License

ISC
