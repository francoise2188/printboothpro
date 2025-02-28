'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import NewEventCamera from '../../../components/NewEventCamera';

export default function CameraPage() {
  const params = useParams();
  const eventId = params?.id;

  // If no event ID, redirect to home
  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">No event ID provided</h2>
          <p className="mt-2 text-gray-400">Please scan a valid QR code</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading camera...</div>}>
      <NewEventCamera eventId={eventId} />
    </Suspense>
  );
} 