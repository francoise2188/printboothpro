'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import NewEventCamera from '../../components/NewEventCamera.js';

export default function TestCameraPage() {
  const [eventId, setEventId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getFirstEvent() {
      console.log('Fetching first event...');
      const { data } = await supabase
        .from('events')
        .select('id')
        .limit(1)
        .single();
      
      if (data) {
        console.log('Found event with ID:', data.id);
        setEventId(data.id);
      } else {
        console.log('No events found in the database');
      }
    }

    getFirstEvent();
  }, []);

  if (!eventId) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <main className="min-h-screen">
      <NewEventCamera eventId={eventId} />
    </main>
  );
} 