import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Ridelytics Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`\n📡 API Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/ads/recommendations?latitude={lat}&longitude={lng}`);
  console.log(`   GET  /api/ads (debug)\n`);
});
