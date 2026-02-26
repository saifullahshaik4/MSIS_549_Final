# Chatbot Implementation Guide

## Overview
The chatbot is designed to help users discover local businesses and things to do based on their current location. It recommends places from the ads.json file and provides personalized suggestions.

## Frontend (Already Implemented)
- **Location**: `/nextjs-pwa/app/components/Chatbot.tsx`
- **Features**:
  - Bottom-left floating chat button
  - Expandable chat window
  - Real-time messaging
  - Auto-scroll to latest messages
  - Loading indicators
  - Timestamp on messages

## Backend Setup

### 1. Current Files
- **Chat Handler**: `/backend/src/chatbot/chatHandler.ts` (Placeholder implementation)
- **API Endpoint**: `/backend/src/app.ts` (POST `/api/chat`)

### 2. Environment Variables Needed
Add these to `/backend/.env` after you provide the credentials:

```env
# Chatbot API Credentials (to be added)
CHATBOT_API_KEY=your_api_key_here
CHATBOT_API_URL=your_api_url_here
CHATBOT_MODEL=your_model_name_here
```

### 3. Implementation Steps

Once you provide the chatbot credentials, we need to:

1. **Update `/backend/src/chatbot/chatHandler.ts`**:
   - Replace placeholder response with actual chatbot API call
   - Integrate conversation history
   - Use user location to filter nearby ads from `ads.json`
   - Format responses to include "Sponsored by [Business Name]"
   - Recommend things to do in the area

2. **Expected Conversation Flow**:
   ```
   Bot: "Hi! 👋 I'm your local guide. What's your destination today?"
   User: "I'm looking for a coffee shop"
   Bot: "Great choice! ☕ Based on your location, I found some amazing options:
         
         • Lune Cafe - Pioneer Square (0.5 mi away)
         • Toasted - U-District (3.9 mi away)
         
         Sponsored by Lune Cafe
         
         Are you interested in things to do near these locations?"
   User: "Yes, what's nearby?"
   Bot: "Near Lune Cafe, you can explore Pioneer Square's historic district, 
         visit the Underground Tour, or check out local art galleries. 
         Would you like directions to any of these places?"
   ```

3. **Chatbot Logic Requirements**:
   - Parse user's destination/interest from message
   - Query ads.json for matching businesses
   - Calculate distance to user's current location
   - Filter by proximity (e.g., within 10 miles)
   - Provide relevant recommendations
   - Include "Sponsored by" attribution
   - Suggest activities near recommended locations

## API Request Format

```typescript
POST /api/chat
Content-Type: application/json

{
  "message": "I'm looking for coffee",
  "userLocation": [47.6062, -122.3321],
  "conversationHistory": [
    {
      "role": "assistant",
      "content": "Hi! 👋 I'm your local guide..."
    },
    {
      "role": "user",
      "content": "I'm looking for coffee"
    }
  ]
}
```

## API Response Format

```typescript
{
  "response": "Great choice! ☕ Based on your location...",
  "timestamp": "2026-02-26T05:30:33.361Z"
}
```

## Testing

Once implemented, test with:
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want coffee",
    "userLocation": [47.6062, -122.3321],
    "conversationHistory": []
  }'
```

## Next Steps

Please provide:
1. Chatbot API credentials
2. API documentation URL (if available)
3. Any specific requirements for the chatbot's personality/tone
4. Rate limits or usage constraints

Once I have the credentials, I'll:
1. Add them to the `.env` file
2. Implement the actual chatbot integration
3. Add error handling and retry logic
4. Test the full conversation flow
