'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

function HomeContent() {
  const [email, setEmail] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');
  const error = searchParams.get('error');

  useEffect(() => {
    async function checkEventStatus() {
      if (!eventId) return;

      const { data, error } = await supabase
        .from('events')
        .select('is_active')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error checking event status:', error);
        return;
      }

      // If event is not active, redirect to ended page
      if (!data.is_active) {
        router.push('/event-ended');
      }
    }

    checkEventStatus();
  }, [eventId]);

  useEffect(() => {
    async function fetchEventData() {
      console.log('🎯 Fetching event data for:', eventId);
      try {
        const { data, error } = await supabase
          .from('design_settings')
          .select('landing_background')
          .eq('event_id', eventId)
          .single();

        console.log('📦 Design settings data:', data);
        console.log('🖼️ Background URL:', data?.landing_background);

        if (error) {
          console.error('❌ Error:', error);
          return;
        }
        
        // Set the background URL to state
        if (data?.landing_background) {
          setBackgroundUrl(data.landing_background);
        }
        
      } catch (error) {
        console.error('❌ Fetch error:', error);
      }
    }

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // If this is an event page, show the event-specific layout
  if (eventId) {
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
        {/* Background Image Container */}
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt="Background"
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

        {/* Email Form */}
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
              Start Photobooth
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If no eventId, show the main homepage
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          PrintBooth Pro
        </h1>
        <p className={styles.description}>
          Your All-in-One Photo Magnet Solution for Events & Markets
        </p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={styles.buttonContainer}>
          <button
            onClick={() => router.push('/camera')}
            className={styles.startButton}
          >
            Start Photo Booth
          </button>
          
          <Link href="/subscription" className={styles.subscribeButton}>
            Subscribe Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
