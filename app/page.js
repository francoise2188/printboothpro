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

  const handleStart = () => {
    if (email) {
      localStorage.setItem('userEmail', email);
      router.push(eventId ? `/camera?event=${eventId}` : '/camera');
    }
  };

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
            onClick={handleStart}
            disabled={!email}
            className={styles.startButton}
          >
            {email ? 'Start Photo Booth' : 'Enter Email'}
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
