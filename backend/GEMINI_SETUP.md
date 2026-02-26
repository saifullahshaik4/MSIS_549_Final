# Gemini API Key Setup - Troubleshooting

## Current Issue
The chatbot is getting a 403 error: "Method doesn't allow unregistered callers"

This means the API key needs additional configuration in Google Cloud.

## Steps to Fix:

### 1. Enable the Generative Language API

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Select your project: `projects/821803779471`
3. Go to **APIs & Services** > **Library**
4. Search for "Generative Language API"
5. Click on it and click **ENABLE**

### 2. Enable Billing (if not already done)

1. Go to https://console.cloud.google.com/billing
2. Link a billing account to your project
3. Note: Gemini has a free tier, but billing must be enabled

### 3. Verify API Key Restrictions

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your API key: `AIzaSyBmVNCPHrfdFBHVjTXkOnQDTT8Pc6Izd0`
3. Click on it to edit
4. Under **API restrictions**:
   - Choose "Restrict key"
   - Select "Generative Language API"
5. Under **Application restrictions**:
   - For development, choose "None"
   - Or add your server IP if you want to restrict it
6. Click **Save**

### 4. Alternative: Create a New API Key

If the above doesn't work, create a fresh API key:

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Choose your project or create new one
4. Copy the new key
5. Replace it in `/backend/.env`:
   ```
   GEMINI_API_KEY=your_new_key_here
   ```

## Testing After Fix

Once you've completed the steps above:

```bash
# Restart the backend
cd backend
npm run dev

# Test in another terminal
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi","userLocation":[47.6062,-122.3321],"conversationHistory":[]}'
```

You should see a proper response from Gemini!

## What's Already Implemented

✅ Gemini SDK installed
✅ API key in .env file
✅ Chat handler with location-based recommendations
✅ Integration with ads.json
✅ Conversation history support
✅ Frontend chatbot UI ready

## Next Steps

1. Complete the API setup steps above
2. Test the chatbot in the frontend
3. The chatbot will automatically:
   - Recommend nearby businesses from ads.json
   - Include "Sponsored by" attributions
   - Suggest things to do near locations
   - Maintain conversation context

## Need Help?

If you're still having issues:
- Make sure billing is enabled in Google Cloud
- Try using the AI Studio link to create a fresh key
- Check the Google Cloud Console for any error messages
