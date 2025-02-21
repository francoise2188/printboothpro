'use client';

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';  // Make sure this path is correct
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import CountdownOverlay from './CountdownOverlay';

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
      canvas.width = 600;
      canvas.height = 600;
      
      const ctx = canvas.getContext('2d');
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      ctx.drawImage(
        video,
        startX, startY, size, size,
        0, 0, canvas.width, canvas.height
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
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
      <div className="relative w-full max-w-md mx-auto aspect-square">
        {photo ? (
          <img
            src={photo}
            alt="Captured photo"
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
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
