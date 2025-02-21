'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function EventPage({ params }) {
  const [email, setEmail] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const eventId = params.id;

  useEffect(() => {
    async function checkEventStatus() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('events')
          .select('is_active')
          .eq('id', eventId)
          .single();

        if (error) throw error;

        // If event is not active, redirect to ended page
        if (!data.is_active) {
          router.push('/event-ended');
          return;
        }

        // Fetch event design settings
        const { data: designData, error: designError } = await supabase
          .from('design_settings')
          .select('landing_background')
          .eq('event_id', eventId)
          .single();

        if (designError) throw designError;
        
        if (designData?.landing_background) {
          setBackgroundUrl(designData.landing_background);
        }
      } catch (err) {
        setError('Event not found or no longer available');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkEventStatus();
  }, [eventId]);

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
        <img
          src={backgroundUrl}
          alt="Event Background"
          style={{
            position: 'absolute',
            height: '102vh',
            width: 'auto',
            maxWidth: 'none',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            margin: 0,
            padding: 0,
            objectFit: 'contain',
            objectPosition: 'center'
          }}
        />
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
            router.push(`/camera?event=${eventId}`);
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