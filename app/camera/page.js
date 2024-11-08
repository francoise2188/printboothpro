'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OverlayDesign from '../admin/design/components/OverlayDesign';

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [countdown, setCountdown] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        takePhoto();
      }
    }, 1000);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const retakePhoto = async () => {
    setPhoto(null);
    await startCamera();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert base64 to blob
      const response = await fetch(photo);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'photobooth-picture.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving photo:', error);
    }
    setIsSaving(false);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareToInstagram = () => {
    alert('To share on Instagram: Save the photo and share it through the Instagram app');
  };

  const handleDone = () => {
    router.push('/'); // Go back to landing page
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', padding: '20px' }}>
      <OverlayDesign />
      <div style={{
        width: '100%',
        maxWidth: '600px',
        aspectRatio: '1',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        backgroundColor: '#1a1a1a'
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
        
        {countdown !== null && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{
              fontSize: '200px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {countdown}
            </span>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '20px',
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {!photo ? (
          <button 
            onClick={startCountdown}
            style={{
              padding: '15px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            Take Photo
          </button>
        ) : (
          <>
            <button 
              onClick={retakePhoto}
              style={{
                padding: '15px',
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              Retake Photo
            </button>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '15px',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                cursor: 'pointer',
                opacity: isSaving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <i className="fas fa-download"></i>
              {isSaving ? 'Saving...' : 'Save Photo'}
            </button>

            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button 
                onClick={shareToFacebook}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#1877F2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <i className="fab fa-facebook-f"></i>
                Share
              </button>
              
              <button 
                onClick={shareToInstagram}
                style={{
                  flex: 1,
                  padding: '15px',
                  backgroundColor: '#E4405F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                Share to Instagram
              </button>
            </div>

            <button 
              onClick={handleDone}
              style={{
                padding: '15px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
