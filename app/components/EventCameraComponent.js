'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

export default function EventCameraComponent({ eventId }) {
  const videoRef = useRef(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [photo, setPhoto] = useState(null);
  const [countdownNumber, setCountdownNumber] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  console.log('🎯 Component mounted with eventId:', eventId);

  // Fetch frame overlay from Supabase
  useEffect(() => {
    async function fetchFrame() {
      try {
        console.log('🔍 Debug - Event ID:', eventId);
        console.log('🔍 Debug - Supabase Client:', !!supabase);
        
        // First, check if the event exists
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, name')
          .eq('id', eventId)
          .single();
          
        if (eventError) {
          console.error('❌ Event fetch error:', eventError);
          setError('Failed to fetch event details');
          return;
        }
        
        console.log('✅ Event found:', eventData);

        // Then fetch the design settings
        console.log('🎯 Fetching frame overlay from design_settings for event:', eventId);
        const { data, error } = await supabase
          .from('design_settings')
          .select('*')  // Select all fields for debugging
          .eq('event_id', eventId)
          .maybeSingle();

        console.log('🔍 Debug - Design Settings Response:', { data, error });

        if (error) {
          console.error('❌ Settings fetch error:', error);
          setError('Failed to fetch design settings');
          return;
        }

        if (data) {
          console.log('📋 Full design settings:', data);
          if (data.frame_overlay) {
            console.log('🖼️ Found frame URL:', data.frame_overlay);
            // Verify the URL is accessible
            try {
              const response = await fetch(data.frame_overlay, { method: 'HEAD' });
              if (!response.ok) {
                console.error('❌ Frame overlay URL is not accessible:', response.status);
                setError('Frame overlay image is not accessible');
                return;
              }
              console.log('✅ Frame overlay URL is accessible');
              setOverlayUrl(data.frame_overlay);
            } catch (urlError) {
              console.error('❌ Error checking frame URL:', urlError);
              setError('Failed to verify frame overlay URL');
            }
          } else {
            console.log('⚠️ No frame_overlay field in design settings');
            setError('No frame overlay configured for this event');
          }
        } else {
          console.log('⚠️ No design settings found for event');
          setError('No design settings found for this event');
        }
      } catch (error) {
        console.error('💥 Error:', error);
        setError('An unexpected error occurred');
      }
    }

    if (eventId) {
      fetchFrame();
    } else {
      console.log('⚠️ No eventId provided to component');
      setError('No event ID provided');
    }
  }, [eventId, supabase]);

  // Add debug logging for overlay URL changes
  useEffect(() => {
    console.log('🔄 Overlay URL changed:', overlayUrl);
  }, [overlayUrl]);

  const savePhoto = async () => {
    if (!photo) {
      console.log('⚠️ No photo taken yet');
      toast.error('Please take a photo first');
      return;
    }

    try {
      console.log('🚀 Starting save process for event:', eventId);

      // Convert base64 to blob
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const photoBlob = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `event_photos/${eventId}/${timestamp}.jpg`;
      
      // Generate order code for event photos
      const orderCode = `EVT-${timestamp.toString().slice(-6)}`;
      console.log('📝 Generated order code:', orderCode);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('event_photos')
        .upload(filename, photoBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('event_photos')
        .getPublicUrl(filename);

      // Prepare database record
      const photoData = {
        event_id: eventId,
        photo_url: filename,
        status: 'pending',
        source: 'event_booth',
        created_at: new Date().toISOString(),
        order_code: orderCode,
      };

      console.log('📝 Preparing to save photo data:', photoData);

      // Save record to database
      const { data: photoRecord, error: dbError } = await supabase
        .from('event_photos')
        .insert([photoData])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      console.log('✅ Photo saved successfully:', photoRecord);

      // Redirect to checkout with photoId
      router.push(`/event/${eventId}/checkout?photoId=${photoRecord.id}`);

    } catch (error) {
      console.error('❌ Error saving photo:', error);
      toast.error('Failed to save photo. Please try again.');
    }
  };

  const takePhoto = () => {
    return new Promise((resolve, reject) => {
      if (videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1440;
        const ctx = canvas.getContext('2d');

        // Calculate scaling to maintain aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let startX = 0;
        let startY = 0;

        if (videoAspect > canvasAspect) {
          drawWidth = drawHeight * videoAspect;
          startX = -(drawWidth - canvas.width) / 2;
        } else {
          drawHeight = drawWidth / videoAspect;
          startY = -(drawHeight - canvas.height) / 2;
        }

        // Draw the video frame
        ctx.drawImage(video, startX, startY, drawWidth, drawHeight);

        // If we have an overlay URL, load and draw it
        if (overlayUrl) {
          console.log('🖼️ Loading overlay image:', overlayUrl);
          const overlayImage = new Image();
          overlayImage.crossOrigin = 'anonymous';
          
          overlayImage.onload = () => {
            console.log('✅ Overlay loaded successfully, dimensions:', {
              width: overlayImage.width,
              height: overlayImage.height
            });
            ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
            const photoData = canvas.toDataURL('image/jpeg', 0.95);
            setPhoto(photoData);
            resolve(photoData);
          };
          
          overlayImage.onerror = (error) => {
            console.error('❌ Failed to load overlay:', error);
            console.error('Failed URL:', overlayUrl);
            // Still save the photo without overlay
            const photoData = canvas.toDataURL('image/jpeg', 0.95);
            setPhoto(photoData);
            resolve(photoData);
          };
          
          overlayImage.src = overlayUrl;
        } else {
          console.log('ℹ️ No overlay URL available for photo');
          const photoData = canvas.toDataURL('image/jpeg', 0.95);
          setPhoto(photoData);
          resolve(photoData);
        }
      } else {
        console.error('❌ No video reference available');
        reject(new Error('No video reference available'));
      }
    });
  };

  const startCountdown = () => {
    let count = 3;
    setCountdownNumber(count);

    const timer = setInterval(async () => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(timer);
        setCountdownNumber(null);
        await takePhoto();
      }
    }, 1000);
  };

  const handleRetake = async () => {
    setPhoto(null);
    await startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1440 },
          facingMode: 'user'
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Camera Container */}
      <div className="relative w-full max-w-md mx-auto aspect-[3/4]">
        {photo ? (
          <img
            src={photo}
            alt="Captured photo"
            className="absolute inset-0 w-full h-full object-contain rounded-xl"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
        
        {/* Frame Overlay */}
        {overlayUrl && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <img
              src={overlayUrl}
              alt="Frame overlay"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Countdown Overlay */}
        {countdownNumber && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="text-white text-8xl font-bold">
              {countdownNumber}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 max-w-md mx-auto space-y-4">
        {photo ? (
          <>
            <button 
              onClick={savePhoto}
              className="w-full p-3 bg-green-500 text-white rounded-lg"
            >
              Print Photo
            </button>
            <button 
              onClick={handleRetake}
              className="w-full p-3 bg-blue-500 text-white rounded-lg"
            >
              Retake Photo
            </button>
          </>
        ) : (
          <button 
            onClick={startCountdown}
            className="w-full p-3 bg-blue-500 text-white rounded-lg"
          >
            Take Photo
          </button>
        )}
        <button 
          onClick={() => router.push(`/event/${eventId}`)}
          className="w-full p-3 bg-gray-500 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    </div>
  );
}