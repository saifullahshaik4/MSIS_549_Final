# Ridelytics - Next.js PWA

A Progressive Web Application with Uber-inspired design, featuring real-time location tracking, push notifications, and restaurant recommendations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# 1. Navigate to project directory
cd nextjs-pwa

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# Or with HTTPS (required for PWA features like location and notifications)
npm run dev -- --experimental-https
```

### Access the App
- **HTTP**: http://localhost:3000
- **HTTPS**: https://localhost:3000 (accept certificate warning)

---

## ✨ Features

### 🗺️ Interactive Map
- **Light, minimal style** using CartoDB tiles
- **Real-time GPS tracking** with blue pulsing marker
- **Route visualization** between pickup and dropoff
- **Current location display** - Shows "Currently in [City, State]" when tracking is enabled
- **Custom markers** for pickup (green), dropoff (black), and user location (blue)

### 📍 Location Tracking
- Click the **Navigation button** (top-right on map) to start/stop tracking
- **Reverse geocoding** converts GPS coordinates to city/state names
- **Auto-updates** as you move between locations
- **Privacy-focused** - only tracks when explicitly enabled

### 🔔 Push Notifications
- Click the **notification bell** (bottom-right) to manage notifications
- Subscribe/unsubscribe functionality
- Send test notifications
- Full PWA service worker integration

### 🎨 Modern UI
- Uber-inspired design with professional aesthetics
- Responsive layout (mobile, tablet, desktop)
- Driver tipping interface with quick options ($1, $3, $5, Custom)
- Restaurant recommendations powered by OpenTable

---

## 🎮 How to Use

### Enable Location Tracking
1. Click the **Navigation button** (top-right corner of map)
2. Allow location permissions when prompted
3. See your current location: "Currently in [Your City, State]"
4. Blue pulsing marker shows your position on map
5. Location updates automatically as you move

### Test Push Notifications
1. Click the **🔔 bell icon** (bottom-right corner)
2. Click **Subscribe** and allow notifications
3. Enter a test message
4. Click **Send Test** to receive a notification

### Test with Different Locations
Use Chrome DevTools to simulate locations:
1. Open DevTools (F12) → More tools → Sensors
2. Override geolocation with coordinates:
   - Seattle, WA: `47.6062, -122.3321`
   - Redmond, WA: `47.6740, -122.1215`
   - Dallas, TX: `32.7767, -96.7970`
   - New York, NY: `40.7128, -74.0060`

---

## 🔧 Configuration

### Environment Variables

The project includes pre-configured VAPID keys in `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMtZ2evz1kUP-bnBV26f3RzWYEf-QAi6RbV0MZlrw1baxP9uSLGCOfBhFo214bQ9TtnQS7ywyW-0cTNTKU7zpic
VAPID_PRIVATE_KEY=Ko9zI-lIdFIpwAMceKOfnSoXwCcqHWEM_KIzDbeViJ8
```

**For production**, generate new keys:
```bash
npx web-push generate-vapid-keys
```
Then update `.env.local` with your keys.

### Change Map Location

Edit `app/components/Map.tsx`:
```typescript
center = [32.7767, -96.7970]  // [latitude, longitude]
```

### Change Destination

Edit `app/page.tsx`:
```typescript
<p className="text-gray-600">Cafe Brazil · 8 min</p>
```

---

## 📦 Project Structure

```
nextjs-pwa/
├── app/
│   ├── actions.ts              # Server actions for push notifications
│   ├── components/
│   │   └── Map.tsx            # Interactive map with location tracking
│   ├── manifest.ts            # PWA manifest
│   ├── page.tsx              # Main UI (Uber-like interface)
│   └── layout.tsx            # Root layout
├── public/
│   ├── sw.js                 # Service worker
│   └── icon-*.svg            # App icons
├── .env.local                # Environment variables (VAPID keys)
├── next.config.ts            # Next.js config with security headers
└── package.json              # Dependencies
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev                              # Start dev server (HTTP)
npm run dev -- --experimental-https      # Start dev server (HTTPS)

# Production
npm run build                            # Create production build
npm start                                # Start production server

# Linting
npm run lint                             # Run ESLint
```

---

## 🔌 Backend Integration (Future)

### Location Tracking API

The app is ready for backend integration. Location data format:

```typescript
{
  userId: "user_123",
  rideId: "ride_456",
  location: {
    latitude: 32.7767,
    longitude: -96.7970,
    name: "Dallas, TX"  // Human-readable location
  },
  timestamp: "2026-02-22T18:30:00Z"
}
```

### Recommended Endpoint

Create `app/api/location/update/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { userId, rideId, location, timestamp } = await request.json()
  
  // Save to database
  // await db.locationUpdate.create({ data: {...} })
  
  return NextResponse.json({ success: true })
}
```

### Database Schema (Prisma Example)

```prisma
model LocationUpdate {
  id           String   @id @default(cuid())
  userId       String
  rideId       String
  latitude     Float
  longitude    Float
  locationName String?
  timestamp    DateTime @default(now())
  
  @@index([rideId, timestamp])
  @@index([userId])
}
```

---

## 📱 PWA Features

### Install as App

**Desktop (Chrome/Edge):**
- Look for install icon (⊕) in address bar
- Click and follow prompts

**iOS (Safari):**
- Tap Share button → Add to Home Screen

**Android (Chrome):**
- Menu (⋮) → Add to Home screen

### Offline Support
- Service worker caches essential assets
- Works without internet connection
- Push notifications work offline

---

## 🧪 Testing

### Test Location Tracking
1. Enable HTTPS: `npm run dev -- --experimental-https`
2. Click Navigation button on map
3. Allow location permissions
4. Verify "Currently in [City, State]" appears
5. Move to different location or use DevTools to simulate

### Test Push Notifications
1. Run with HTTPS (required)
2. Click bell icon → Subscribe
3. Send test notification
4. Verify notification appears

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 50+ | ✅ Full support |
| Edge | 79+ | ✅ Full support |
| Firefox | 44+ | ✅ Full support |
| Safari (macOS) | 16+ | ✅ Full support |
| Safari (iOS) | 16.4+ | ✅ Full support (when installed) |

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
4. Deploy

### Other Platforms
- Netlify
- AWS Amplify
- Google Cloud Platform
- Azure
- Any Node.js hosting

**Important:** Set environment variables on your hosting platform.

---

## 🔐 Security & Privacy

### Location Privacy
- Location tracking **only** when user explicitly enables it
- Clear visual indicator when tracking is active
- User can stop tracking anytime
- No background tracking without permission

### Push Notifications
- Requires user consent
- Can unsubscribe anytime
- VAPID keys secure the connection

### Security Headers
Configured in `next.config.ts`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy for service worker

---

## 🎨 Customization

### Change App Name

Edit `app/manifest.ts`:
```typescript
name: 'Your App Name',
short_name: 'YourApp',
```

And `app/page.tsx`:
```typescript
<h1 className="text-3xl font-bold">Your App Name</h1>
```

### Change Theme Colors

Edit `app/manifest.ts`:
```typescript
background_color: '#ffffff',
theme_color: '#000000',
```

### Change Map Style

Edit `app/components/Map.tsx`:
```typescript
// Current: CartoDB Light (minimal, clean)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {...})

// Alternative: CartoDB Dark
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {...})
```

---

## 🐛 Troubleshooting

### Location Not Working
- **Check HTTPS**: Location API requires HTTPS
- **Check permissions**: Allow location in browser settings
- **Check device**: Enable location services on device
- **Not in private mode**: Location may be blocked in incognito

### Notifications Not Working
- **Use HTTPS**: Push notifications require HTTPS
- **Check permissions**: Allow notifications in browser
- **Check VAPID keys**: Verify keys in `.env.local`
- **Restart server**: After changing environment variables

### Map Not Loading
- **Check internet**: Map tiles need network connection
- **Check console**: Look for errors in browser DevTools
- **Clear cache**: Try hard refresh (Ctrl+Shift+R)

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## 📚 Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | React framework |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Type safety |
| Tailwind CSS | ^4 | Styling |
| Leaflet | ^1.9.4 | Interactive maps |
| lucide-react | latest | Icons |
| web-push | ^3.6.7 | Push notifications |

---

## 🎯 Key Features Summary

✅ **Uber-inspired design** with professional UI  
✅ **Real-time GPS tracking** with visual marker  
✅ **Current location display** (e.g., "Currently in Seattle, WA")  
✅ **Interactive map** with light, minimal style  
✅ **Push notifications** with service worker  
✅ **Installable PWA** for all platforms  
✅ **Responsive design** for mobile, tablet, desktop  
✅ **Privacy-focused** with explicit user controls  
✅ **Backend-ready** architecture for API integration  
✅ **Production-ready** with security headers  

---

## 🆘 Support

For issues:
1. Check the troubleshooting section above
2. Verify HTTPS is enabled for PWA features
3. Check browser console for errors
4. Ensure environment variables are set

---

## 📄 License

This project is open source and available under the MIT License.

---

**Built with Next.js 16.1.6** | Created: February 22, 2026

🚗 **Ready to ride!**
