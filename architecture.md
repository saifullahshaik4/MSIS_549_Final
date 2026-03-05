# Ridelytics — Technical Architecture

This document describes the technical architecture, tech stack, and data flows of the Ridelytics location-based ad PWA.

---

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client (Browser / PWA)"]
        PWA[Next.js PWA]
        PWA --> Map[Map Component<br/>Leaflet]
        PWA --> Chatbot[Chatbot Component]
        PWA --> AdViewer[Ad Viewer Page]
        PWA --> Geolocation[Geolocation API]
    end

    subgraph Backend["Backend (Express)"]
        API[REST API]
        API --> AdsEndpoint["/api/ads/recommendations"]
        API --> ChatEndpoint["/api/chat"]
        API --> HealthEndpoint["/api/health"]
        AdsEndpoint --> Haversine[Haversine Distance]
        AdsEndpoint --> AdsJSON[(ads.json)]
        ChatEndpoint --> Gemini[Gemini AI]
        ChatEndpoint --> AdsJSON
    end

    subgraph External["External Services"]
        Nominatim[Nominatim<br/>Reverse Geocoding]
        OSRM[OSRM<br/>Routing API]
        GeminiAPI[Google Gemini API]
    end

    Geolocation -->|lat, lng| PWA
    PWA -->|GET /api/ads/recommendations| AdsEndpoint
    PWA -->|POST /api/chat| ChatEndpoint
    PWA -->|coordinates| Nominatim
    PWA -->|route| OSRM
    AdsEndpoint -->|duration| OSRM
    ChatEndpoint -->|prompt| GeminiAPI
    ChatEndpoint -->|location name| Nominatim
    GeminiAPI -->|response| ChatEndpoint
```

---

## Tech Stack Diagram

```mermaid
flowchart LR
    subgraph Frontend["Frontend Stack"]
        Next[Next.js 16]
        React[React 19]
        TS[TypeScript]
        Tailwind[Tailwind CSS 4]
        Leaflet[Leaflet / react-leaflet]
        Lucide[Lucide React]
        PWA2[PWA Manifest + SW]
    end

    subgraph Backend["Backend Stack"]
        Express[Express]
        TS2[TypeScript]
        CORS[CORS]
        Dotenv[dotenv]
        GenAI[Google GenAI SDK]
    end

    subgraph Data["Data & APIs"]
        JSON[(ads.json)]
        Nominatim[Nominatim API]
        OSRM[OSRM API]
        Gemini[Gemini API]
    end

    Frontend --> Backend
    Backend --> Data
    Frontend --> Nominatim
    Frontend --> OSRM
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant PWA as Next.js PWA
    participant Geo as Geolocation API
    participant Backend as Express Backend
    participant Nominatim
    participant OSRM
    participant Gemini

    User->>PWA: Opens app
    PWA->>Geo: Request location
    Geo->>PWA: lat, lng

    PWA->>Nominatim: Reverse geocode
    Nominatim->>PWA: "Seattle, WA"

    PWA->>Backend: GET /api/ads/recommendations?lat=&lng=
    Backend->>Backend: Haversine distance
    Backend->>OSRM: Get drive duration
    OSRM->>Backend: duration (seconds)
    Backend->>PWA: ads with distance, duration

    User->>PWA: Types in chatbot
    PWA->>Backend: POST /api/chat (message, location)
    Backend->>Nominatim: Reverse geocode
    Backend->>Gemini: Generate with context
    Gemini->>Backend: AI response
    Backend->>PWA: response with recommendations
```

---

## Component Architecture

```mermaid
flowchart TB
    subgraph "nextjs-pwa/app"
        Page[page.tsx<br/>Main Home Screen]
        AdViewer[ad-viewer/page.tsx<br/>Partner Site Viewer]
    end

    subgraph "Components"
        Map[Map.tsx<br/>Leaflet map, routing, markers]
        Chatbot[Chatbot.tsx<br/>AI chat UI]
    end

    subgraph "Hooks"
        useUserLocation[useUserLocation<br/>Geolocation]
        useReverseGeocode[useReverseGeocode<br/>Nominatim]
        useAdRecommendations[useAdRecommendations<br/>Backend API]
    end

    subgraph "backend/src"
        app[app.ts<br/>Express routes]
        chatHandler[chatHandler.ts<br/>Gemini integration]
        distance[distance.ts<br/>Haversine]
        ads[data/ads.json]
    end

    Page --> Map
    Page --> Chatbot
    Page --> useUserLocation
    Page --> useReverseGeocode
    Page --> useAdRecommendations
    Map --> useUserLocation
    Map --> OSRM
    Chatbot --> app
    useAdRecommendations --> app
    app --> distance
    app --> ads
    app --> chatHandler
    chatHandler --> Gemini
```

---

## API Endpoints Diagram

```mermaid
flowchart LR
    subgraph "REST API"
        Health["GET /api/health"]
        Ads["GET /api/ads/recommendations"]
        Chat["POST /api/chat"]
    end

    subgraph "Inputs"
        LatLng["?latitude=&longitude="]
        Body["message, userLocation, conversationHistory"]
    end

    subgraph "Outputs"
        Status["{ status: ok }"]
        AdsList["{ ads: [...] }"]
        ChatResp["{ response: string }"]
    end

    LatLng --> Ads
    Body --> Chat
    Health --> Status
    Ads --> AdsList
    Chat --> ChatResp
```

---

## Technologies Summary

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Leaflet, react-leaflet, Lucide React |
| **Backend** | Node.js, Express, TypeScript, @google/genai, CORS, dotenv |
| **Storage** | JSON file (ads.json) |
| **External APIs** | Nominatim (reverse geocoding), OSRM (routing), Google Gemini (AI) |
