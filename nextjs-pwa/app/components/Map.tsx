'use client'

import { useEffect, useRef, useState } from 'react'

interface MapProps {
  center?: [number, number]
  zoom?: number
  showRoute?: boolean
  startLocation?: [number, number]
  endLocation?: [number, number]
  userLocation?: [number, number] | null
}

export function Map({
  center = [47.6062, -122.3321], // Default to Seattle
  zoom = 13,
  showRoute = false,
  startLocation,
  endLocation,
  userLocation = null
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const startMarkerRef = useRef<any>(null)
  const endMarkerRef = useRef<any>(null)
  const isCleaningUpRef = useRef(false)
  const hasInitializedLocationRef = useRef(false)
  const [isClient, setIsClient] = useState(false)
  const [L, setL] = useState<any>(null)

  // Load Leaflet only on client side
  useEffect(() => {
    setIsClient(true)
    
    // Dynamically import Leaflet
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
    })
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isClient || !mapRef.current || !L || mapInstanceRef.current) return

    // Use user location if available, otherwise use center prop
    const initialCenter = userLocation || center

    // Initialize map with light, minimal style
    const map = L.map(mapRef.current, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false,
    })

    // Use CartoDB Light tile layer for clean, minimal style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      isCleaningUpRef.current = true
      
      // Clean up all markers first
      if (userMarkerRef.current) {
        try {
          userMarkerRef.current.remove()
        } catch (e) {
          // Ignore
        }
        userMarkerRef.current = null
      }
      
      if (startMarkerRef.current) {
        try {
          startMarkerRef.current.remove()
        } catch (e) {
          // Ignore
        }
        startMarkerRef.current = null
      }
      
      if (endMarkerRef.current) {
        try {
          endMarkerRef.current.remove()
        } catch (e) {
          // Ignore
        }
        endMarkerRef.current = null
      }
      
      if (routeLayerRef.current) {
        try {
          routeLayerRef.current.remove()
        } catch (e) {
          // Ignore
        }
        routeLayerRef.current = null
      }
      
      // Then remove the map
      try {
        map.off()
        map.remove()
      } catch (e) {
        // Ignore
      }
      
      mapInstanceRef.current = null
      hasInitializedLocationRef.current = false
      
      setTimeout(() => {
        isCleaningUpRef.current = false
      }, 100)
    }
  }, [isClient, L])

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient || !L || isCleaningUpRef.current) return

    if (userLocation) {
      // Center map on user location on first update
      if (!hasInitializedLocationRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.setView(userLocation, 14, {
            animate: true,
            duration: 1
          })
          hasInitializedLocationRef.current = true
        } catch (error) {
          console.error('Error centering map:', error)
        }
      }

      // Update or create user marker
      if (userMarkerRef.current) {
        // Update existing marker position
        try {
          if (!isCleaningUpRef.current) {
            userMarkerRef.current.setLatLng(userLocation)
          }
        } catch (error) {
          // If update fails, remove and recreate
          try {
            userMarkerRef.current.remove()
          } catch (e) {
            // Ignore
          }
          userMarkerRef.current = null
        }
      }
      
      if (!userMarkerRef.current && !isCleaningUpRef.current) {
        // Create new user location marker
        const userIcon = L.divIcon({
          className: 'custom-marker-user',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(59, 130, 246, 0.7);
              animation: pulse 2s infinite;
            "></div>
            <style>
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })

        try {
          if (mapInstanceRef.current) {
            userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup('Your current location')
          }
        } catch (error) {
          console.error('Error creating marker:', error)
        }
      }
    } else if (userMarkerRef.current && !isCleaningUpRef.current) {
      // Remove marker if no user location
      try {
        userMarkerRef.current.remove()
      } catch (error) {
        // Ignore
      }
      userMarkerRef.current = null
    }
  }, [userLocation, isClient, L])

  // Draw route between user location and destination
  useEffect(() => {
    if (!mapInstanceRef.current || !isClient || !L || isCleaningUpRef.current) return

    // Always clean up existing route and marker first
    if (routeLayerRef.current) {
      try {
        routeLayerRef.current.remove()
      } catch (e) {
        // Ignore
      }
      routeLayerRef.current = null
    }

    if (endMarkerRef.current) {
      try {
        endMarkerRef.current.remove()
      } catch (e) {
        // Ignore
      }
      endMarkerRef.current = null
    }

    // Only draw new route if conditions are met
    if (!showRoute || !userLocation || !endLocation) {
      return
    }

    // Draw route and destination marker
    const [userLat, userLng] = userLocation
    const [destLat, destLng] = endLocation
    
    // Add timeout to prevent hanging (increased to 10 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    fetch(`https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=full&geometries=geojson`, {
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutId)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        // Check if this is still the current request (component not cleaning up)
        if (isCleaningUpRef.current) return

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) // Convert [lng, lat] to [lat, lng]

          try {
            // Double-check cleanup before adding new elements
            if (routeLayerRef.current) {
              try {
                routeLayerRef.current.remove()
              } catch (e) {
                // Ignore
              }
              routeLayerRef.current = null
            }

            if (endMarkerRef.current) {
              try {
                endMarkerRef.current.remove()
              } catch (e) {
                // Ignore
              }
              endMarkerRef.current = null
            }

            // Create destination marker
            const destIcon = L.divIcon({
              className: 'custom-marker-destination',
              html: `
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: #000;
                  border: 3px solid white;
                  border-radius: 4px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 20px;
                ">📍</div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            })

            if (mapInstanceRef.current) {
              endMarkerRef.current = L.marker(endLocation, { icon: destIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('Destination')

              // Draw actual driving route
              const routeLine = L.polyline(coordinates, {
                color: '#000',
                weight: 4,
                opacity: 0.7,
                smoothFactor: 1,
              }).addTo(mapInstanceRef.current)

              routeLayerRef.current = routeLine

              // Fit map to show the entire route
              mapInstanceRef.current.fitBounds(routeLine.getBounds(), {
                padding: [50, 50],
                maxZoom: 14
              })
            }
          } catch (error) {
            console.error('Error drawing route:', error)
          }
        } else {
          // Fallback to straight line if routing fails
          console.warn('Routing failed, using straight line')
          drawStraightLineRoute()
        }
      })
      .catch(error => {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          console.warn('OSRM request timeout, using straight line')
        } else {
          console.warn('Error fetching route, using straight line:', error.message)
        }
        // Fallback to straight line
        if (!isCleaningUpRef.current) {
          drawStraightLineRoute()
        }
      })

    // Fallback function to draw straight line
    function drawStraightLineRoute() {
      if (!userLocation || !endLocation || !mapInstanceRef.current || isCleaningUpRef.current) return
      
      try {
        // Double-check cleanup
        if (routeLayerRef.current) {
          try {
            routeLayerRef.current.remove()
          } catch (e) {
            // Ignore
          }
          routeLayerRef.current = null
        }

        if (endMarkerRef.current) {
          try {
            endMarkerRef.current.remove()
          } catch (e) {
            // Ignore
          }
          endMarkerRef.current = null
        }

        const destIcon = L.divIcon({
          className: 'custom-marker-destination',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: #000;
              border: 3px solid white;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">📍</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        endMarkerRef.current = L.marker(endLocation, { icon: destIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Destination')

        const route = L.polyline([userLocation, endLocation], {
          color: '#000',
          weight: 4,
          opacity: 0.7,
          smoothFactor: 1,
        }).addTo(mapInstanceRef.current)

        routeLayerRef.current = route

        const bounds = L.latLngBounds([userLocation, endLocation])
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 14
        })
      } catch (error) {
        console.error('Error drawing fallback route:', error)
      }
    }
  }, [userLocation, endLocation, showRoute, isClient, L])

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#f5f5f5' }}
      />
    </>
  )
}

// Hook for getting user's real-time location
export function useUserLocation() {
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  const startTracking = () => {
    if (typeof window === 'undefined') return
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsTracking(true)
    setError(null)

    // Get initial position with more lenient settings
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude])
      },
      (err) => {
        console.warn('Initial position error:', err.message)
        // Don't set error for initial position - wait for watchPosition
        // setError(err.message)
        // setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Increased from 5s to 10s
        maximumAge: 60000, // Allow cached position up to 1 minute
      }
    )

    // Watch position for real-time tracking with more lenient settings
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation([position.coords.latitude, position.coords.longitude])
        setError(null) // Clear any previous errors on successful update
      },
      (err) => {
        console.warn('Watch position error:', err.message)
        // Only show error if we don't have any location yet
        if (!location) {
          setError(err.message)
        }
        // Don't set isTracking to false - keep trying
      },
      {
        enableHighAccuracy: false, // Use network location for more reliability
        timeout: 15000, // Increased from 5s to 15s
        maximumAge: 30000, // Allow cached position up to 30 seconds
      }
    )
  }

  const stopTracking = () => {
    if (typeof window === 'undefined') return
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { location, error, isTracking, startTracking, stopTracking }
}
