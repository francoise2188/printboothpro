'use client';
import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function CameraTest() {
  const videoRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [overlayUrl, setOverlayUrl] = useState('');
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('event');

  // Fetch theme settings
  useEffect(() => {
    async function fetchThemeSettings() {
      if (!eventId) return;

      try {
        const { data, error } = await supabase
          .from('design_settings')
          .select('frame_overlay')
          .eq('event_id', eventId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching theme:', error);
          return;
        }

        if (data?.frame_overlay) {
          setOverlayUrl(data.frame_overlay);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    fetchThemeSettings();
  }, [eventId]);

  // Function to start the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access the camera. Please make sure you have given permission.');
    }
  };

  // Function to take a photo
  const takePhoto = () => {
    if (!videoRef.current || !isStreaming) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0);
    
    // Convert the photo to a downloadable link
    const photo = canvas.toDataURL('image/jpeg');
    const link = document.createElement('a');
    link.download = 'photo-booth-picture.jpg';
    link.href = photo;
    link.click();
  };

  return (
    <div className={styles.container}>
      <h1>Camera Test</h1>
      
      <div className={styles.cameraContainer}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
          />
          {overlayUrl && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <img
                src={overlayUrl}
                alt="Frame overlay"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className={styles.buttonContainer}>
        {!isStreaming ? (
          <button onClick={startCamera}>Start Camera</button>
        ) : (
          <button onClick={takePhoto}>Take Photo</button>
        )}
      </div>
    </div>
  );
}