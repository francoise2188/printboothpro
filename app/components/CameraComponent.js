'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'react-hot-toast';
import CountdownOverlay from './CountdownOverlay';

// Add these functions at the top with your other imports
const shareToInstagram = async (photoUrl) => {
  // Instagram sharing logic
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'My Photo Booth Picture',
        text: 'Check out my photo booth picture!',
        url: photoUrl
      });
    } else {
      // Fallback for desktop
      window.open('https://instagram.com', '_blank');
    }
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

const shareToFacebook = async (photoUrl) => {
  // Facebook sharing logic
  try {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(photoUrl)}`, '_blank');
  } catch (error) {
    console.error('Error sharing:', error);
  }
};

const saveToDevice = async (photoUrl) => {
  try {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = 'photobooth-picture.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error saving:', error);
  }
};

const finishAndSubmit = async () => {
  // Final submission to your system
  try {
    await savePhoto(); // Your existing save function
    // Redirect to thank you page or reset
    window.location.href = '/thank-you';
  } catch (error) {
    console.error('Error finishing:', error);
  }
};

// First, add this CSS at the top of your file
const overlayStyles = {
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
};

const numberStyles = {
  fontSize: '200px',
  color: 'white',
  fontWeight: 'bold'
};

// Then in your component, add this new Countdown component
const Countdown = ({ number }) => {
  if (number === null) return null;
  
  return (
    <div style={overlayStyles}>
      <div style={numberStyles}>
        {number}
      </div>
    </div>
  );
};

export default function CameraComponent() {
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [countdownNumber, setCountdownNumber] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const savePhoto = async () => {
    if (!photo) {
      console.log('⚠️ No photo taken yet');
      toast.error('Please take a photo first');
      return;
    }

    try {
      console.log('🚀 Starting save process');

      // Convert base64 to blob
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const photoBlob = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `booth_photos/${timestamp}.jpg`;
      
      // Generate order code
      const orderCode = `BTH-${timestamp.toString().slice(-6)}`;
      console.log('📝 Generated order code:', orderCode);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('booth_photos')
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
        .from('booth_photos')
        .getPublicUrl(filename);

      // Prepare database record
      const photoData = {
        photo_url: filename,
        status: 'pending',
        source: 'booth',
        created_at: new Date().toISOString(),
        order_code: orderCode,
      };

      console.log('📝 Preparing to save photo data:', photoData);

      // Save record to database
      const { data: photoRecord, error: dbError } = await supabase
        .from('booth_photos')
        .insert([photoData])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      console.log('✅ Photo saved successfully:', photoRecord);

      // Redirect to checkout with photoId
      router.push(`/checkout?photoId=${photoRecord.id}`);

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

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => shareToInstagram(photo)}
                className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Share to Instagram
              </button>
              <button 
                onClick={() => shareToFacebook(photo)}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Share to Facebook
              </button>
            </div>
            <button 
              onClick={() => saveToDevice(photo)}
              className="w-full p-3 bg-blue-500 text-white rounded-lg"
            >
              Save to Device
            </button>
            <button 
              onClick={handleRetake}
              className="w-full p-3 bg-gray-500 text-white rounded-lg"
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
          onClick={() => router.push('/')}
          className="w-full p-3 bg-gray-500 text-white rounded-lg"
        >
          Back
        </button>
      </div>
    </div>
  );
}
