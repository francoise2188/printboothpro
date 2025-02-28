'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Image from 'next/image';

export default function EventPage() {
  const [email, setEmail] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();
  
  // Get the raw ID from the URL
  const rawId = params?.id || '';
  // Clean the ID - remove any URL encoding and brackets
  const eventId = rawId.replace(/[\[\]]/g, '');

  useEffect(() => {
    let isMounted = true;

    async function checkEventStatus() {
      if (!eventId) {
        console.log('No event ID found');
        setError('Event ID is missing');
        setIsLoading(false);
        return;
      }

      console.log('Checking event status for ID:', eventId);

      try {
        setIsLoading(true);
        
        // Fetch event data with error logging
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*, design_settings(*)')
          .eq('id', eventId)
          .single();
        
        console.log('Event data:', eventData);

        if (!isMounted) return;

        if (eventError) {
          console.error('Supabase error fetching event:', eventError.message);
          throw eventError;
        }

        if (!eventData) {
          console.error('No event found for ID:', eventId);
          throw new Error('Event not found');
        }

        // If event is not active, redirect to ended page
        if (!eventData.is_active) {
          console.log('Event is not active, redirecting...');
          router.push('/event-ended');
          return;
        }

        // Set background URL from design settings
        if (eventData.design_settings?.[0]?.landing_background) {
          console.log('Setting background URL:', eventData.design_settings[0].landing_background);
          setBackgroundUrl(eventData.design_settings[0].landing_background);
        } else {
          console.log('No landing background found in design settings');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error details:', err.message);
        
        // Set a more user-friendly error message
        const errorMessage = err.message.includes('invalid input syntax') 
          ? 'Invalid event ID format'
          : err.message === 'Event not found' 
            ? 'Event not found' 
            : 'Unable to load event. Please try again later.';
        
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkEventStatus();

    return () => {
      isMounted = false;
    };
  }, [eventId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">Loading Photo Booth...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">{error}</h2>
          <p className="mt-2 text-gray-400">Event ID: {eventId || 'Not provided'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {backgroundUrl && (
        <div style={{
          position: 'absolute',
          height: '102vh',
          width: '100vw',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          margin: 0,
          padding: 0,
        }}>
          <Image
            src={backgroundUrl}
            alt="Event Background"
            fill
            style={{
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onError={(e) => {
              console.error('Error loading background image:', e);
              console.log('Attempted URL:', backgroundUrl);
              setError('Unable to load background image');
            }}
            onLoad={() => {
              console.log('Background image loaded successfully');
            }}
            priority
            unoptimized
          />
        </div>
      )}

      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '15px',
        borderRadius: '12px',
        width: '80%',
        maxWidth: '350px',
        zIndex: 2
      }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (email) {
            localStorage.setItem('userEmail', email);
            const targetUrl = `/camera/${eventId}`;
            console.log('Redirecting to:', targetUrl);
            router.push(targetUrl);
          }
        }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Start Photo Booth
          </button>
        </form>
      </div>
    </div>
  );
} 