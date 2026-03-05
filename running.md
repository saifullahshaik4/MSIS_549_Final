# Ridelytics — Running Instructions for Graders

This document provides step-by-step instructions to run the Ridelytics location-based ad PWA. Follow these steps in order.

---

## Prerequisites

- **Node.js** 18.x or 20.x ([nodejs.org](https://nodejs.org))
- **npm** (included with Node.js)
- A modern browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for external APIs: Nominatim, OSRM, Gemini)

---

## Quick Start (Copy & Paste)

Open **two terminal windows** and run the following:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```
Wait until you see: `📍 Running on: http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd nextjs-pwa
npm install
npm run dev
```
Wait until you see: `Ready on http://localhost:3000`

**Then:** Open [http://localhost:3000](http://localhost:3000) in your browser and **allow location access** when prompted.

---

## Detailed Step-by-Step Instructions

### Step 1: Start the Backend Server

1. Open a terminal and navigate to the project root:
   ```bash
   cd /path/to/MSIS_549_final
   ```

2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. (Optional) Create a `.env` file for custom configuration:
   ```bash
   echo "PORT=3001" > .env
   echo "FRONTEND_URL=http://localhost:3000" >> .env
   ```
   *If you skip this, the app uses these defaults automatically.*

4. Start the backend in development mode:
   ```bash
   npm run dev
   ```

5. **Verify:** You should see output like:
   ```
   🚀 Ridelytics Backend Server
   📍 Running on: http://localhost:3001
   ```

6. **Keep this terminal open.** The backend must stay running.

---

### Step 2: Start the Frontend

1. Open a **new terminal** (leave the backend running).

2. Navigate to the frontend directory and install dependencies:
   ```bash
   cd /path/to/MSIS_549_final/nextjs-pwa
   npm install
   ```

3. (Optional) Create `.env.local` for backend URL override:
   ```bash
   echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:3001" > .env.local
   ```
   *If you skip this, the app uses `http://localhost:3001` by default.*

4. Start the frontend in development mode:
   ```bash
   npm run dev
   ```

5. **Verify:** You should see output like:
   ```
   ▲ Next.js 16.x.x
   - Local: http://localhost:3000
   ✓ Ready in X.Xs
   ```

6. **Keep this terminal open.** The frontend must stay running.

---

### Step 3: Open the App in Your Browser

1. Open a browser and go to: **http://localhost:3000**

2. When prompted for **location permission**, click **Allow**.
   - Location is required for ad recommendations and the map.

3. You should see:
   - A map centered on your location
   - Your current city/state (e.g., "Seattle, WA")
   - Location-based ad recommendations (if you're within range of ad locations)

---

## What to Verify

| Feature | How to Test |
|--------|-------------|
| **Map & Location** | Map loads and shows your location; city name appears |
| **Ad Recommendations** | Ads appear in the sidebar (Seattle-area ads have ~50km radius) |
| **Chatbot** | Click the chat icon; send a message *(requires `GEMINI_API_KEY` in backend `.env`)* |
| **Push Notifications** | Click the bell icon; subscribe *(requires VAPID keys in `nextjs-pwa/.env.local`)* |

---

## Optional: Full Functionality

### Chatbot (AI Recommendations)

The chatbot uses Google Gemini. To enable it:

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `backend/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the backend

Without this, the chatbot will return an error when used. All other features work.

### Push Notifications

To enable push notifications:

1. Generate VAPID keys:
   ```bash
   cd nextjs-pwa
   npx web-push generate-vapid-keys
   ```
2. Create or edit `nextjs-pwa/.env.local`:
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```
3. Restart the frontend

Without this, the app runs normally; only the push notification feature is disabled.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Port 3001 already in use"** | Stop any process using port 3001, or change `PORT` in `backend/.env` |
| **"Port 3000 already in use"** | Stop any process using port 3000, or run `npm run dev -- -p 3002` in nextjs-pwa |
| **Location not working** | Ensure you clicked "Allow" for location; try HTTPS or a different browser |
| **No ads showing** | Ads are configured for Seattle area (~50km radius); use browser DevTools to override location if needed |
| **Backend connection failed** | Ensure backend is running on port 3001; check `NEXT_PUBLIC_BACKEND_URL` in frontend |
| **Chatbot returns error** | Add `GEMINI_API_KEY` to `backend/.env` (see Optional section above) |

---

## Project Structure Reference

```
MSIS_549_final/
├── backend/           # Express API (port 3001)
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── data/ads.json
│   │   └── chatbot/
│   └── package.json
├── nextjs-pwa/        # Next.js frontend (port 3000)
│   ├── app/
│   └── package.json
├── running.md         # This file
├── README.md
└── architecture.md
```

---

## Summary

1. **Terminal 1:** `cd backend && npm install && npm run dev`
2. **Terminal 2:** `cd nextjs-pwa && npm install && npm run dev`
3. **Browser:** Open http://localhost:3000 and allow location

The core app (map, location tracking, ad recommendations) runs with no additional configuration.
