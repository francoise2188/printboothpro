'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

// Add these sharing functions at the top of your file
const shareToInstagram = async (photoUrl) => {
  try {
    // First, trigger download of the photo
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = 'photobooth-picture.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show instructions modal or alert
    alert('Photo saved! Open Instagram and select this photo to share.');
    
    // Open Instagram in new tab
    window.open('https://instagram.com/create', '_blank');
  } catch (error) {
    console.error('Error in Instagram share process:', error);
    alert('There was an error. Please try again.');
  }
};

const shareToFacebook = async (photoUrl) => {
  try {
    // Check if it's a data URL
    if (photoUrl.startsWith('data:')) {
      console.log('Cannot share data URL directly');
      // Use Facebook's feed dialog as fallback
      window.open('https://www.facebook.com/sharer/sharer.php', '_blank');
      return;
    }

    // Use Facebook's Share Dialog
    const fbShareUrl = `https://www.facebook.com/dialog/share?app_id=YOUR_FB_APP_ID&display=popup&href=${encodeURIComponent(photoUrl)}&redirect_uri=${encodeURIComponent(window.location.href)}`;
    
    // Open in a popup window
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      fbShareUrl,
      'facebook-share-dialog',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  } catch (error) {
    console.error('Error sharing:', error);
    // Fallback
    window.open('https://www.facebook.com/sharer/sharer.php', '_blank');
  }
};

// Helper function to convert data URL to File object
const urlToFile = async (dataUrl) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], 'photobooth.jpg', { type: 'image/jpeg' });
};

// Add this component at the top of your file, after the imports
const CountdownOverlay = ({ number }) => {
  if (!number) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999
    }}>
      <div style={{
        fontSize: '200px',
        color: 'white',
        fontWeight: 'bold'
      }}>
        {number}
      </div>
    </div>
  );
};

// Function to just get URL and save to device
const saveToDevice = async (photoData) => {
  try {
    // Prevent default behavior
    event.preventDefault();
    
    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        photo: photoData,
        saveToDatabase: false
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get photo URL');
    }

    // Create and trigger download
    const link = document.createElement('a');
    link.href = result.photo.url;
    link.download = 'photobooth-picture.jpg';
    link.target = '_blank'; // Add this to prevent page navigation
    document.body.appendChild(link);
    link.click();
    
    // Small delay before removing the link
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    alert('Photo saved to your device!');
  } catch (error) {
    console.error('Error saving to device:', error);
    alert('There was an error saving your photo. Please try again.');
  }
};

// Separate function for just getting the public URL without saving to database
const getPublicUrl = async (photoData) => {
  try {
    const response = await fetch('/api/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        photo: photoData,
        saveToDatabase: false
      })
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get photo URL');
    }

    return result.photo.url;
  } catch (error) {
    console.error('Error getting public URL:', error);
    return null;
  }
};

export default function CameraComponent() {
  const videoRef = useRef(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [photo, setPhoto] = useState(null);
  const router = useRouter();
  const [countdownNumber, setCountdownNumber] = useState(null);
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');

  // Rest of your component code...
  // (All the useEffect hooks and functions remain the same)

  return (
    <div style={{ 
      height: '100svh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Camera and Overlay Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '70vh',
        overflow: 'hidden'
      }}>
        {photo ? (
          <img 
            src={photo} 
            alt="Captured photo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }} 
          />
        )}
        {overlayUrl && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <img
              src={overlayUrl}
              alt="Frame overlay"
              crossOrigin="anonymous"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div style={{
        flex: 1,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {photo ? (
          <>
            <button 
              onClick={handleRetake}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#3B82F6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '10px'
              }}
            >
              Retake Photo
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                saveToDevice(photo);
              }}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#6366F1',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '10px'
              }}
            >
              Save to Device
            </button>

            <button 
              onClick={(e) => {
                e.preventDefault();
                savePhoto();
              }}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#22C55E',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Print My Photo!
            </button>
          </>
        ) : (
          <button 
            onClick={startCountdown}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Take Photo
          </button>
        )}
        
        <button 
          onClick={() => setFacingMode(current => current === 'user' ? 'environment' : 'user')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#6B7280',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Switch Camera
        </button>
        
        <button 
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#4B5563',
            color: 'white',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          Back to Home
        </button>
      </div>

      {/* Add the countdown overlay */}
      <CountdownOverlay number={countdownNumber} />
    </div>
  );
} 