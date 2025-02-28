'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CameraRedirectPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center text-white">
        <h2 className="text-xl font-semibold">Redirecting...</h2>
      </div>
    </div>
  );
}