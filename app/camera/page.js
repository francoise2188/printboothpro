import { Suspense } from 'react';
import CameraComponent from './CameraComponent';

export default function CameraPage({ searchParams }) {
  const eventId = searchParams?.event;

  return (
    <Suspense fallback={<div>Loading camera...</div>}>
      <CameraComponent eventId={eventId} />
    </Suspense>
  );
}