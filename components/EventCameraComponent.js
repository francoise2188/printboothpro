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
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Use a fixed size that matches common photo booth dimensions
      canvas.width = 1080;  // 3:4 ratio for portrait orientation
      canvas.height = 1440;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate scaling to fit the video while maintaining aspect ratio
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (videoAspect > canvasAspect) {
        // Video is wider than canvas
        drawWidth = canvas.height * videoAspect;
        offsetX = -(drawWidth - canvas.width) / 2;
      } else {
        // Video is taller than canvas
        drawHeight = canvas.width / videoAspect;
        offsetY = -(drawHeight - canvas.height) / 2;
      }
      
      // Draw the video frame
      ctx.drawImage(
        video,
        offsetX, offsetY, drawWidth, drawHeight
      );

      setPhoto(canvas.toDataURL('image/jpeg', 0.95));
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

      // Try to get the widest possible view
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment',
          zoom: 1,  // Force zoom to 1
          advanced: [{ zoom: 1 }]  // Additional zoom constraint
        },
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
                objectFit: 'contain'
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
