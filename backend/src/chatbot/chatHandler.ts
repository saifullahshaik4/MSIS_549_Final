import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { calculateDistance } from '../utils/distance';

interface ChatRequest {
  message: string;
  userLocation: [number, number] | null;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface Ad {
  id: string;
  businessName: string;
  description: string;
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
  const adsPath = join(__dirname, '../data/ads.json');
  const adsData = readFileSync(adsPath, 'utf-8');
  return JSON.parse(adsData);
}

// Get nearby ads based on user location
function getNearbyAds(userLocation: [number, number] | null, maxDistance: number = 20000): Ad[] {
  if (!userLocation) return [];

  const [userLat, userLng] = userLocation;
  const ads = getAds();

  return ads
    .filter(ad => ad.active)
    .map(ad => {
      const distance = calculateDistance(userLat, userLng, ad.latitude, ad.longitude);
      return { ...ad, distance };
    })
    .filter(ad => ad.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5); // Top 5 closest
}

// Format ads for context with URLs
function formatAdsContext(ads: Array<Ad & { distance: number }>): string {
  if (ads.length === 0) return 'No nearby businesses available.';

  return ads.map((ad, index) => {
    const distanceKm = (ad.distance / 1000).toFixed(1);
    const distanceMi = (ad.distance / 1609.34).toFixed(1);
    return `${index + 1}. ${ad.businessName} - ${ad.description} (${distanceMi} mi / ${distanceKm} km away)\n   Website: ${ad.websiteUrl}`;
  }).join('\n');
}

// Get current location name using reverse geocoding
async function getCurrentLocationName(userLocation: [number, number] | null): Promise<string> {
  if (!userLocation) return 'Unknown location';

  const [lat, lng] = userLocation;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Ridelytics-PWA/1.0'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract city/town/suburb, fallback to county, fallback to state
    const city = data.address?.city || 
                 data.address?.town || 
                 data.address?.suburb ||
                 data.address?.county ||
                 data.address?.state ||
                 'your area';
    
    const state = data.address?.state || '';
    
    return state ? `${city}, ${state}` : city;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'your area';
  }
}

export async function handleChatMessage(req: Request, res: Response) {
  try {
    const { message, userLocation, conversationHistory }: ChatRequest = req.body;

    console.log(`📨 Chat request: "${message.substring(0, 50)}..." | Location: ${userLocation ? 'provided' : 'none'}`);

    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
    const temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
    const maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '500');
    
    console.log('🔑 Gemini API Key status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');
    console.log(`⚙️  Model: ${model}, Temperature: ${temperature}, Max Tokens: ${maxTokens}`);

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    // Initialize client according to official docs - the client automatically picks up GEMINI_API_KEY
    const ai = new GoogleGenAI({});

    // Get current location name
    const currentLocation = await getCurrentLocationName(userLocation);
    console.log(`📍 Current location: ${currentLocation}`);

    // Get nearby ads
    const nearbyAds = getNearbyAds(userLocation);
    const adsContext = formatAdsContext(nearbyAds);

    console.log(`🏪 Found ${nearbyAds.length} nearby businesses`);

    // Build system prompt with user's current location
    const systemPrompt = `You are an in-vehicle assistant for Ridelytics rideshare, helping passengers discover amazing local businesses during their ride.

CONTEXT: You are speaking to a passenger in the back of a rideshare vehicle.

PASSENGER'S CURRENT LOCATION: ${currentLocation}
${userLocation ? `Coordinates: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : ''}

OUR PARTNERED BUSINESSES (from closest to farthest):
${adsContext}

CRITICAL RULES - FOLLOW IN ORDER:
1. **When passenger mentions their destination**, immediately respond with excitement and recommend partnered businesses IN or NEAR that destination
   - Look at the business names and descriptions to match the location
   - Give COMPLETE responses with full descriptions
   - ALWAYS include the website URL for each business you recommend
   - Format the URL as: "Click here to check it out: [URL]"
   - After recommending, ask: "Would you like more recommendations in [their destination] or anywhere else?"
   
2. **ALWAYS recommend partnered businesses FIRST** - These are the only businesses you should initially suggest
3. Give detailed, enticing descriptions of partnered places (atmosphere, specialties, what makes them special)
4. When recommending partners, say "We're partnered with [Business Name]" or "Sponsored by [Business Name]"
5. **Include website URLs** for every business you recommend - make them clickable/clear
6. **Always end with a follow-up question** asking if they want more recommendations
7. **ONLY if the passenger shows disinterest** (says "not interested", "what else", "anything else", etc.), THEN ask: "Would you like me to suggest some other local spots in the area?"
8. **ONLY after they confirm** they want other options should you recommend non-partnered places
9. When suggesting non-partnered places, make it clear they are "other local spots" (not partners)

YOUR ROLE:
- Welcome passengers warmly and ask about their destination or interests
- When they mention a destination, get EXCITED and immediately recommend partners in that area
- Give FULL, COMPLETE descriptions - don't cut off mid-sentence
- Match their interests to our partnered businesses
- Be enthusiastic about our partners - they're sponsoring this experience!
- ALWAYS include website URLs in your recommendations
- ALWAYS ask follow-up questions

EXAMPLE FLOWS:

Passenger: "Redmond"
You: "That's fantastic! We're partnered with some amazing spots right in Redmond.

**Qamaria Coffee** serves authentic Yemeni coffee in a beautiful, welcoming space. They have specialty drinks you won't find anywhere else! Click here to check it out: https://order.qamariacoffee.com/order/qamaria-redmond-wa

**Crimson Coward Redmond** is also nearby with an incredible brunch menu - perfect for a meal or coffee! Click here to check it out: https://www.crimsoncoward.com/locations/crimson-coward-redmond-wa/

Would you like more recommendations in Redmond or anywhere else? ☕️"

Passenger: "Seattle"
You: "Awesome! We're partnered with great spots in Seattle.

**Lune Cafe** in Pioneer Square has amazing artisanal coffee and a cozy atmosphere. Click here to check it out: https://www.lunesglow.com/

**Toasted** has multiple locations throughout Seattle including U-District and South Lake Union - perfect for a quick, delicious bite! Click here to check it out: https://toastedseattle.com/

Would you like more recommendations in Seattle or another area?"

Passenger: "Not interested, what else?"
You: "No problem! Would you like me to suggest some other local spots in that area?"

REMEMBER: 
- Give FULL responses with complete descriptions
- ALWAYS include website URLs
- ALWAYS end with "Would you like more recommendations in [location] or anywhere else?"`;

    console.log('🤖 Sending to Gemini...');

    // Build full prompt with conversation history
    let fullPrompt = systemPrompt + '\n\nConversation history:\n';
    for (const msg of conversationHistory) {
      fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }
    fullPrompt += `\nUser's new message: ${message}`;

    // Call the API using the exact format from official docs with config from .env
    const response = await ai.models.generateContent({
      model: model,
      contents: [{
        role: 'user',
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    });

    // Extract the full response text
    let responseText = '';
    
    if (response && response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        responseText = candidate.content.parts.map((part: any) => part.text || '').join('');
      }
    }
    
    // Fallback to response.text if available
    if (!responseText && response.text) {
      responseText = response.text;
    }

    console.log(`✅ Response generated (${responseText.length} chars): ${responseText.substring(0, 100)}...`);
    console.log(`📝 Full response: ${responseText}`);
    console.log(`[${new Date().toISOString()}] Chat request processed successfully`);

    res.json({
      response: responseText,
      timestamp: new Date().toISOString(),
      nearbyBusinesses: nearbyAds.length,
      currentLocation: currentLocation
    });
  } catch (error: any) {
    console.error('❌ Chat error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });
    
    res.status(500).json({
      error: 'Failed to process chat message',
      response: "I'm sorry, I'm having trouble right now. Please try again in a moment.",
      details: error.message
    });
  }
}
