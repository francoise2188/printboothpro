'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CameraRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the event ID from the URL query parameters
    const eventId = searchParams.get('event');
    
    console.log('%c 🎥 OLD CAMERA ROUTE ACTIVATED 🎥', 'background: #ff0000; color: #ffffff; font-size: 20px; padding: 10px; border-radius: 5px;');
    console.log('%c Current URL:', 'font-size: 16px; color: #00ff00;', window.location.href);
    console.log('%c Event ID:', 'font-size: 16px; color: #00ff00;', eventId);

    // If we have an event ID, redirect to the new camera route
    if (eventId) {
      console.log('%c 🔄 REDIRECTING TO NEW CAMERA ROUTE 🔄', 'background: #0000ff; color: #ffffff; font-size: 20px; padding: 10px; border-radius: 5px;');
      console.log('%c Target URL:', 'font-size: 16px; color: #00ff00;', `/camera/${eventId}`);
      router.replace(`/camera/${eventId}`);
    } else {
      // If no event ID, redirect to home
      console.log('%c ⚠️ NO EVENT ID FOUND - REDIRECTING TO HOME ⚠️', 'background: #ff6600; color: #ffffff; font-size: 20px; padding: 10px; border-radius: 5px;');
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