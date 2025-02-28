import { Suspense } from 'react';
import NewEventCamera from '../../components/NewEventCamera';

export default async function CameraPage({ searchParams }) {
  const eventId = await searchParams?.event;

  return (
    <Suspense fallback={<div>Loading camera...</div>}>
      <NewEventCamera eventId={eventId} />
    </Suspense>
  );
}