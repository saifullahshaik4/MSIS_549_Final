import express, { Request, Response } from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { calculateDistance } from './utils/distance';
import { handleChatMessage } from './chatbot/chatHandler';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Ad interface
interface Ad {
  id: string;
  businessName: string;
  imageUrl: string;
  websiteUrl: string;
  latitude: number;
  longitude: number;
  radius: number;
  active: boolean;
  priority: number;
}

// Read ads from JSON file
function getAds(): Ad[] {
  try {
    const adsPath = join(__dirname, 'data', 'ads.json');
    const adsData = readFileSync(adsPath, 'utf-8');
    return JSON.parse(adsData);
  } catch (error) {
    console.error('Error reading ads.json:', error);
    return [];
  }
}

// API Routes

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Get ad recommendations based on user location
app.get('/api/ads/recommendations', async (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;

  // Validate input
  if (!latitude || !longitude) {
    return res.status(400).json({
      error: 'Missing required parameters',
      message: 'Both latitude and longitude are required'
    });
  }

  const userLat = parseFloat(latitude as string);
  const userLng = parseFloat(longitude as string);

  // Validate coordinates
  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Latitude and longitude must be valid numbers'
    });
  }

  if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
    return res.status(400).json({
      error: 'Invalid coordinates',
      message: 'Coordinates are out of valid range'
    });
  }

  const ads = getAds();

  // Calculate distances and filter by radius
  const matchingAds = ads
    .filter(ad => ad.active)
    .map(ad => {
      const distance = calculateDistance(
        userLat,
        userLng,
        ad.latitude,
        ad.longitude
      );
      return {
        ...ad,
        distance: Math.round(distance) // Distance in meters
      };
    })
    .filter(ad => ad.distance <= ad.radius)
    .sort((a, b) => {
      // Sort by priority first, then by distance
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.distance - b.distance;
    });

  console.log(`[${new Date().toISOString()}] Location: (${userLat}, ${userLng}), Matching ads: ${matchingAds.length}`);

  if (matchingAds.length > 0) {
    // Fetch actual driving duration for all matching ads with timeout and error handling
    const adsWithDuration = await Promise.all(
      matchingAds.map(async (ad) => {
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${ad.longitude},${ad.latitude}?overview=false`;
          
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const osrmResponse = await fetch(osrmUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          // Check if response is JSON
          const contentType = osrmResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn(`OSRM returned non-JSON response for ${ad.businessName}`);
            return {
              id: ad.id,
              businessName: ad.businessName,
              imageUrl: ad.imageUrl,
              websiteUrl: ad.websiteUrl,
              latitude: ad.latitude,
              longitude: ad.longitude,
              distance: ad.distance,
              duration: null
            };
          }
          
          const osrmData = await osrmResponse.json();
          
          let duration = null;
          if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
            duration = Math.round(osrmData.routes[0].duration); // Duration in seconds
          }
          
          return {
            id: ad.id,
            businessName: ad.businessName,
            imageUrl: ad.imageUrl,
            websiteUrl: ad.websiteUrl,
            latitude: ad.latitude,
            longitude: ad.longitude,
            distance: ad.distance,
            duration: duration
          };
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.warn(`OSRM request timeout for ${ad.businessName}`);
          } else {
            console.error(`Error fetching route duration for ${ad.businessName}:`, error.message);
          }
          return {
            id: ad.id,
            businessName: ad.businessName,
            imageUrl: ad.imageUrl,
            websiteUrl: ad.websiteUrl,
            latitude: ad.latitude,
            longitude: ad.longitude,
            distance: ad.distance,
            duration: null
          };
        }
      })
    );

    res.json({
      ads: adsWithDuration,
      total: adsWithDuration.length
    });
  } else {
    res.json({
      ads: [],
      total: 0,
      message: 'No ads available in your area'
    });
  }
});

// Get all ads (for debugging)
app.get('/api/ads', (req: Request, res: Response) => {
  const ads = getAds();
  res.json({ ads });
});

// Chat endpoint
app.post('/api/chat', handleChatMessage);

export default app;
