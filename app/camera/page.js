'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import CameraComponent from '../../components/CameraComponent';

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

function CameraContent() {
  const videoRef = useRef(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [photo, setPhoto] = useState(null);
  const router = useRouter();
  const [countdownNumber, setCountdownNumber] = useState(null);
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');

  // Fetch overlay
  useEffect(() => {
    async function fetchFrame() {
      if (!eventId) {
        console.log('⚠️ No event ID provided');
        return;
      }

      try {
        console.log('🎯 Fetching frame for event ID:', eventId);
        const { data, error } = await supabase
          .from('design_settings')
          .select('frame_overlay')
          .eq('event_id', eventId)
          .single();

        if (error) {
          console.error('❌ Supabase error:', error);
          return;
        }

        console.log('📦 Raw frame data:', data);
        
        if (data?.frame_overlay) {
          console.log('🖼️ Found frame overlay URL:', data.frame_overlay);
          // Check if the URL is complete
          if (!data.frame_overlay.startsWith('http')) {
            // If it's not a complete URL, construct the full Supabase storage URL
            const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
            setOverlayUrl(storageUrl + data.frame_overlay);
            console.log('🔗 Constructed full URL:', storageUrl + data.frame_overlay);
          } else {
            setOverlayUrl(data.frame_overlay);
            console.log('🔗 Using provided URL:', data.frame_overlay);
          }
        } else {
          console.log('⚠️ No frame overlay found in data');
        }
      } catch (error) {
        console.error('❌ Error in fetchFrame:', error);
      }
    }

    fetchFrame();
  }, [eventId]);

  // Camera setup
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera error:', err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const takePhoto = () => {
    console.log('📸 Taking photo with overlay URL:', overlayUrl);
    
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate dimensions to maintain aspect ratio
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      // Create a Promise to handle the async image loading
      const mergePhotoAndOverlay = new Promise((resolve) => {
        // First draw the video frame
        ctx.drawImage(
          video,
          startX, startY, size, size,    // Source (crop to square)
          0, 0, canvas.width, canvas.height  // Destination (600x600)
        );

        // If there's an overlay, draw it on top
        if (overlayUrl) {
          console.log('🎨 Drawing overlay from URL:', overlayUrl);
          const overlayImg = new Image();
          
          overlayImg.onload = () => {
            console.log('✅ Overlay loaded successfully, dimensions:', overlayImg.width, 'x', overlayImg.height);
            // Draw the overlay on top of the photo
            ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
            // Get the final image with overlay
            const finalImage = canvas.toDataURL('image/jpeg', 0.95);
            console.log('🎉 Photo merged with overlay, size:', finalImage.length);
            resolve(finalImage);
          };

          overlayImg.onerror = (err) => {
            console.error('❌ Error loading overlay:', err);
            // Fallback to photo without overlay
            const photoOnly = canvas.toDataURL('image/jpeg', 0.95);
            console.log('⚠️ Using photo without overlay');
            resolve(photoOnly);
          };

          // Set crossOrigin for URL images
          overlayImg.crossOrigin = 'anonymous';
          overlayImg.src = overlayUrl;
        } else {
          // No overlay, just return the photo
          const photoOnly = canvas.toDataURL('image/jpeg', 0.95);
          console.log('📸 Taking photo without overlay');
          resolve(photoOnly);
        }
      });

      // Wait for the photo and overlay to be merged before setting the state
      mergePhotoAndOverlay.then((finalImage) => {
        console.log('💾 Saving final photo to state');
        setPhoto(finalImage);
      }).catch((error) => {
        console.error('❌ Error in photo processing:', error);
        // Fallback to photo without overlay
        const fallbackPhoto = canvas.toDataURL('image/jpeg', 0.95);
        console.log('⚠️ Using fallback photo due to error');
        setPhoto(fallbackPhoto);
      });
    }
  };

  // Add this function to start/restart the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  // Modify the Controls Section to use startCamera
  const handleRetake = async () => {
    // Stop current stream if it exists
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setPhoto(null);
    await startCamera(); // Restart the camera
  };

  // Add this function to save the photo
  const savePhoto = async () => {
    if (!photo) {
      alert('No photo to save');
      return;
    }

    try {
      console.log('🎯 Starting save in camera/page.js');
      console.log('📸 Photo data length:', photo.length);

      // If we have an eventId, include it in the request
      const photoData = {
        photo,
        saveToDatabase: true,
        eventId: eventId || null,  // Include eventId if available
        status: 'pending',         // Mark as pending for template
        template_status: 'pending', // Explicitly mark for template processing
        source: 'guest',            // Mark as guest photo
        quantity: 1                // Set quantity to 1
      };

      console.log('📦 Sending photo data with eventId:', eventId);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photoData)
      });

      // Log the response status and type
      console.log('📡 API Response Status:', response.status);
      console.log('📡 Content-Type:', response.headers.get('content-type'));

      // Check if response is OK and is JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const result = await response.json();
      console.log('📦 API Result:', result);

      if (!result.success) {
        throw new Error(result.message || 'Failed to save photo');
      }

      // Show success message
      alert('Photo saved successfully! The event host will add it to the template.');

      // Redirect to thank you page
      router.push('/thank-you');

    } catch (error) {
      console.error('❌ Error saving photo:', error);
      alert('There was an error saving your photo. Please try again.');
    }
  };

  // Add this function to handle the countdown
  const startCountdown = () => {
    let count = 3;
    setCountdownNumber(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(timer);
        setCountdownNumber(null);
        takePhoto();
      }
    }, 1000);
  };

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
              onError={(e) => {
                console.error('❌ Overlay image failed to load:', e);
                console.log('🔗 Failed URL:', overlayUrl);
              }}
              onLoad={() => {
                console.log('✅ Overlay image loaded successfully');
              }}
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
                e.preventDefault(); // Prevent default button behavior
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
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
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
            onClick={startCountdown}  // Changed from takePhoto to startCountdown
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

export default function CameraPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <h2 className="text-xl font-semibold">Loading camera...</h2>
        </div>
      </div>
    }>
      <CameraContent />
    </Suspense>
  );
}