'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CameraRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the event ID from the URL query parameters
    const eventId = searchParams.get('event');
    
    console.log('Redirecting from old camera route:', {
      eventId,
      currentUrl: window.location.href
    });

    // If we have an event ID, redirect to the new camera route
    if (eventId) {
      console.log('Redirecting to:', `/camera/${eventId}`);
      router.replace(`/camera/${eventId}`);
    } else {
      // If no event ID, redirect to home
      console.log('No event ID found, redirecting to home');
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <div className="text-center text-white">
      <h2 className="text-xl font-semibold">Redirecting...</h2>
      <p className="mt-2 text-gray-400">Please wait while we update your URL</p>
    </div>
  );
}

export default function CameraRedirectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Suspense fallback={
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="mt-2 text-gray-400">Please wait</p>
        </div>
      }>
        <CameraRedirectContent />
      </Suspense>
    </div>
  );
} 