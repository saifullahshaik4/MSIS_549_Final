'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function AdViewerContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') || ''

  if (!url) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">No URL provided</p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back button bar */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border-b border-gray-200 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Ridelytics
        </Link>
      </div>

      {/* Iframe - some sites block embedding; use "Open in new tab" if needed */}
      <div className="flex-1 min-h-0">
        <iframe
          src={url}
          title="Partner website"
          className="w-full h-full min-h-[calc(100vh-80px)] border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}

export default function AdViewerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    }>
      <AdViewerContent />
    </Suspense>
  )
}
