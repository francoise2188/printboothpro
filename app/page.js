'use client';

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleStart = (e) => {
    e.preventDefault();
    if (email) {
      localStorage.setItem('userEmail', email);
      router.push('/camera');
    }
  };

  return (
    <div style={{ 
      height: '100vh',
      width: '100vw',
      backgroundImage: 'url(https://images.unsplash.com/photo-1492684223066-81342ee5ff30)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '20px',
        borderRadius: '15px',
        marginBottom: '40px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleStart}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email to start"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #ccc',
              marginBottom: '10px'
            }}
          />
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
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
