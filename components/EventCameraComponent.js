'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';  // Make sure this path is correct
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';

export default function EventCameraComponent({ eventId }) {
  const videoRef = useRef(null);
  const [overlayUrl, setOverlayUrl] = useState('');
  const [photo, setPhoto] = useState(null);
  const [countdownNumber, setCountdownNumber] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch frame overlay from Supabase
  useEffect(() => {
    async function fetchFrame() {
      try {
        console.log('🎯 Fetching frame for event:', eventId);
        const { data, error } = await supabase
          .from('event_camera_settings')
          .select('frame_url')
          .eq('event_id', eventId)
          .single();

        if (error) {
          console.error('❌ Settings fetch error:', error);
          return;
        }

        if (data?.frame_url) {
          console.log('🖼️ Found frame URL:', data.frame_url);
          setOverlayUrl(data.frame_url);
        }
      } catch (error) {
        console.error('💥 Error:', error);
      }
    }

    if (eventId) {
      fetchFrame();
    }
  }, [eventId, supabase]);

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
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Keep the 3:4 ratio for template compatibility
      canvas.width = 1080;  // Standard width
      canvas.height = 1440; // 4:3 ratio for templates
      
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate how to fit the video in our 3:4 canvas
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;
      
      let sourceWidth = video.videoWidth;
      let sourceHeight = video.videoHeight;
      let destX = 0;
      let destY = 0;
      let destWidth = canvas.width;
      let destHeight = canvas.height;

      // Fit video to canvas while maintaining aspect ratio
      if (videoAspect > canvasAspect) {
        // Video is wider than canvas
        destWidth = canvas.height * videoAspect;
        destX = -(destWidth - canvas.width) / 2;
      } else {
        // Video is taller than canvas
        destHeight = canvas.width / videoAspect;
        destY = -(destHeight - canvas.height) / 2;
      }

      // Draw at natural size (no scaling during capture)
      ctx.drawImage(video, destX, destY, destWidth, destHeight);
      
      const photoUrl = canvas.toDataURL('image/jpeg', 1.0);
      console.log('Photo captured, size:', Math.round(photoUrl.length / 1024), 'KB');
      
      setPhoto(photoUrl);
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const startCamera = async () => {
    try {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      // First, let's log what devices are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      console.log('📸 Available cameras:', cameras);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('📺 Video element size:', {
            videoWidth: videoRef.current.videoWidth,
            videoHeight: videoRef.current.videoHeight,
            clientWidth: videoRef.current.clientWidth,
            clientHeight: videoRef.current.clientHeight
          });
        };
      }
    } catch (error) {
      console.error('❌ Camera error:', error);
      toast.error('Failed to start camera');
    }
  };

  const handleRetake = async () => {
    setPhoto(null);
    await startCamera();
  };

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
    <div className="min-h-screen bg-black p-4">
      {/* Camera Container */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        {photo ? (
          <div className="relative h-full w-full">
            <img
              src={photo}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
            {overlayUrl && (
              <img
                src={overlayUrl}
                alt="Frame overlay"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
              />
            )}
          </div>
        ) : (
          <div className="relative h-full w-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {overlayUrl && (
              <img
                src={overlayUrl}
                alt="Frame overlay"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none z-10"
              />
            )}
          </div>
        )}

        {/* Countdown Overlay */}
        <CountdownOverlay number={countdownNumber} />
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
          <>
            <button 
              onClick={startCountdown}
              className="w-full p-3 bg-blue-500 text-white rounded-lg"
            >
              Take Photo
            </button>
            <button
              onClick={() => {
                if (videoRef.current?.srcObject) {
                  const track = videoRef.current.srcObject.getVideoTracks()[0];
                  const settings = track.getSettings();
                  track.applyConstraints({
                    facingMode: settings.facingMode === 'user' ? 'environment' : 'user'
                  });
                }
              }}
              className="w-full p-3 bg-gray-500 text-white rounded-lg"
            >
              Switch Camera
            </button>
          </>
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
