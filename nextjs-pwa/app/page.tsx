'use client'

import { useState, useEffect } from 'react'
import { Volume2, Sun, Star, MapPin, Navigation, ChevronLeft, ChevronRight } from 'lucide-react'
import { Map, useUserLocation } from './components/Map'
import { Chatbot } from './components/Chatbot'
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

// Reverse geocoding hook to get location name from coordinates
function useReverseGeocode(location: [number, number] | null) {
  const [locationName, setLocationName] = useState<string>('Unknown Location')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!location) {
      setLocationName('Unknown Location')
      return
    }

    const [lat, lng] = location
    setIsLoading(true)

    // Using Nominatim (OpenStreetMap) reverse geocoding API
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`)
      .then(res => res.json())
      .then(data => {
        // Extract city and state/country
        const address = data.address
        const city = address.city || address.town || address.village || address.hamlet || address.suburb
        const state = address.state
        const country = address.country
        
        if (city && state) {
          setLocationName(`${city}, ${state}`)
        } else if (city) {
          setLocationName(city)
        } else if (state) {
          setLocationName(state)
        } else {
          setLocationName(country || 'Unknown Location')
        }
      })
      .catch(() => {
        setLocationName('Unknown Location')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [location])

  return { locationName, isLoading }
}

// Hook to fetch ad recommendations from backend
interface AdRecommendation {
  id: string
  businessName: string
  imageUrl: string
  websiteUrl: string
  latitude: number
  longitude: number
  distance: number
  duration: number | null // Duration in seconds from OSRM
}

function useAdRecommendations(location: [number, number] | null) {
  const [ads, setAds] = useState<AdRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!location) {
      return
    }

    const [lat, lng] = location
    setIsLoading(true)
    setError(null)

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
    
    fetch(`${backendUrl}/api/ads/recommendations?latitude=${lat}&longitude=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.ads && data.ads.length > 0) {
          setAds(data.ads)
        } else {
          setAds([])
        }
      })
      .catch(err => {
        console.error('Error fetching ad recommendations:', err)
        setError('Failed to load recommendations')
        setAds([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [location])

  return { ads, isLoading, error }
}

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [message, setMessage] = useState('')
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    })
    setSubscription(sub)
    
    const serializedSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
        auth: arrayBufferToBase64(sub.getKey('auth')),
      },
    }
    await subscribeUser(serializedSub)
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  async function sendTestNotification() {
    if (subscription) {
      await sendNotification(message)
      setMessage('')
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      <button 
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-6 right-6 p-4 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-colors z-50"
        title="PWA Notifications"
      >
        <span className="text-xl">🔔</span>
      </button>

      {showPanel && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">PWA Notifications</h3>
            <button 
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {subscription ? (
            <div className="space-y-3">
              <p className="text-sm text-green-600 font-medium">
                ✓ Subscribed to notifications
              </p>
              <button
                onClick={unsubscribeFromPush}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Unsubscribe
              </button>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Enter notification message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={sendTestNotification}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                  disabled={!message}
                >
                  Send Test
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Enable notifications to receive updates
              </p>
              <button
                onClick={subscribeToPush}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                Subscribe
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default function Page() {
  const { location, error, isTracking, startTracking, stopTracking } = useUserLocation()
  const { locationName, isLoading } = useReverseGeocode(location)
  const { ads, isLoading: isLoadingAd } = useAdRecommendations(location)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  // Auto-start location tracking on mount
  useEffect(() => {
    startTracking()
  }, [])

  // Reset to first ad when ads change
  useEffect(() => {
    setCurrentAdIndex(0)
  }, [ads])

  // Get the current ad
  const recommendedAd = ads.length > 0 ? ads[currentAdIndex] : null

  // Navigation handlers
  const handleNextAd = () => {
    if (ads.length > 0 && currentAdIndex < ads.length - 1) {
      setCurrentAdIndex((prev) => prev + 1)
    }
  }

  const handlePrevAd = () => {
    if (ads.length > 0 && currentAdIndex > 0) {
      setCurrentAdIndex((prev) => prev - 1)
    }
  }

  // Format distance for display
  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)} m`
    } else if (distanceInMeters < 1600) {
      return `${(distanceInMeters / 1000).toFixed(1)} km`
    } else {
      const miles = distanceInMeters / 1609.34
      return `${miles.toFixed(1)} mi`
    }
  }

  // Format duration from seconds
  const formatDuration = (durationInSeconds: number): string => {
    const minutes = Math.round(durationInSeconds / 60)
    
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }

  // Calculate estimated time based on distance (fallback if no duration provided)
  const calculateEstimatedTime = (distanceInMeters: number): string => {
    const miles = distanceInMeters / 1609.34
    const hours = miles / 40 // Assuming 40 mph average speed
    const minutes = Math.round(hours * 60)
    
    if (minutes < 1) return '< 1 min'
    if (minutes < 60) return `${minutes} min`
    
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
  }

  // Get display time - use actual duration if available, otherwise calculate
  const getDisplayTime = (ad: AdRecommendation): string => {
    if (ad.duration !== null) {
      return formatDuration(ad.duration)
    }
    return calculateEstimatedTime(ad.distance)
  }

  // Get destination coordinates from the recommended ad
  const destinationLocation: [number, number] | undefined = recommendedAd
    ? [recommendedAd.latitude, recommendedAd.longitude]
    : undefined

  // Function to open website in a popup window
  const handleAdClick = (websiteUrl: string) => {
    const width = 1000
    const height = 800
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    window.open(
      websiteUrl,
      'AdWebsite',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Original View */}
        <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 bg-gray-50">
          <h1 className="text-3xl font-bold">Ridelytics</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <Volume2 className="w-6 h-6" />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <Sun className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Map Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              <div className="relative h-64">
                <Map 
                  userLocation={location}
                  endLocation={destinationLocation}
                  showRoute={!!location && !!destinationLocation}
                />
                <button className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 z-[1000]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 7l10 10M17 7l-10 10" />
                  </svg>
                </button>
              </div>
              <div className="p-6 relative">
                {isTracking && location ? (
                  <>
                    <h2 className="text-2xl font-bold mb-1">
                      Location: {isLoading ? 'Locating...' : locationName}
                    </h2>
                    {recommendedAd ? (
                      <p className="text-gray-600">
                        Distance to {recommendedAd.businessName} · {formatDistance(recommendedAd.distance)} · {getDisplayTime(recommendedAd)}
                      </p>
                    ) : (
                      <p className="text-gray-600">Loading recommendations...</p>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-1">Location: Locating...</h2>
                    <p className="text-gray-600">Waiting for location access...</p>
                  </>
                )}
                {isTracking && location && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">Live tracking enabled</span>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    Location error: {error}
                  </div>
                )}
              </div>
            </div>

            {/* Driver Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">Christopher M.</h3>
                    <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-md">
                      <Star className="w-4 h-4 fill-white" />
                      <span className="text-sm font-bold">4.9</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    Professional driver since 2019 · 2,450 trips
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Hi this is Chris! and I am excited to be your driver today. If you have any ride preferences please let me know. Thank you and enjoy the ride!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Dynamic Ad */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg h-full min-h-[700px]">
            {isLoadingAd ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading recommendations...</p>
                </div>
              </div>
            ) : recommendedAd ? (
              <>
                <div 
                  onClick={() => handleAdClick(recommendedAd.websiteUrl)}
                  className="absolute inset-0 cursor-pointer transition-transform hover:scale-[1.02] duration-300"
                >
                  <img 
                    src={recommendedAd.imageUrl}
                    alt={recommendedAd.businessName}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>
                
                {/* Navigation Buttons - Only show if there are multiple ads */}
                {ads.length > 1 && (
                  <>
                    {/* Left arrow - only show if not at first ad */}
                    {currentAdIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePrevAd()
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Previous ad"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                      </button>
                    )}
                    
                    {/* Right arrow - only show if not at last ad */}
                    {currentAdIndex < ads.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNextAd()
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                        aria-label="Next ad"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                      </button>
                    )}

                    {/* Ad indicator dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {ads.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentAdIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <p className="text-gray-600 text-lg">No ads available in your area</p>
                  <p className="text-gray-400 text-sm mt-2">Try moving to a different location</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chatbot */}
        <Chatbot userLocation={location} />
      </div>
    </div>
  )
}
