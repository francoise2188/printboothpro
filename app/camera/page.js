'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CameraRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');

  useEffect(() => {
    if (eventId) {
      // Redirect to the new camera route
      console.log('Redirecting to new camera route:', `/camera/${eventId}`);
      router.replace(`/camera/${eventId}`);
    } else {
      // If no event ID, redirect to home
      console.log('No event ID found, redirecting to home');
      router.replace('/');
    }
  }, [eventId, router]);

  return (
    <div className="text-center text-white">
      <h2 className="text-xl font-semibold">Redirecting...</h2>
    </div>
  );
}

export default function CameraRedirectPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Suspense fallback={
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      }>
        <CameraRedirectContent />
      </Suspense>
    </div>
  );
}