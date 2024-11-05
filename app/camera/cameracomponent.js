'use client';

import { useState, useRef, useEffect } from 'react';

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

export default function CameraComponent({ userEmail }) {
  const videoRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(null);

  // Add this right after your useState declarations
  console.log('Countdown number:', countdownNumber); // Debug log

  // Function to start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  // Initialize camera on page load
  useEffect(() => {
    startCamera();

    // Cleanup function
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Add this function right after your useEffect hook
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

  // Take photo function
  const takePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = 600;  // 2 inches * 300 DPI
      canvas.height = 600; // 2 inches * 300 DPI
      
      const ctx = canvas.getContext('2d');
      
      // Calculate dimensions to maintain aspect ratio
      const size = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      
      // Draw the square photo
      ctx.drawImage(
        video,
        startX, startY, size, size,    // Source (crop to square)
        0, 0, canvas.width, canvas.height  // Destination (600x600)
      );

      setPhoto(canvas.toDataURL('image/jpeg', 0.95));
    }
  };

  // Retake photo function
  const retakePhoto = async () => {
    setPhoto(null);
    await startCamera();
  };

  // Save photo function
  const savePhoto = async () => {
    if (!photo) return;

    try {
      console.log('Saving photo for email:', userEmail);

      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo: photo,
          email: userEmail
        })
      });

      const result = await response.json();
      console.log('Server response:', result);
      
      if (result.success) {
        console.log('Photo saved successfully for:', userEmail);
        await retakePhoto();
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Failed to save photo. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Debug info */}
        <div className="bg-yellow-200 p-4 mb-4">
          Countdown active: {countdownNumber !== null ? 'YES' : 'NO'}
          <br />
          Current number: {countdownNumber}
        </div>

        {/* Camera/Photo Container */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {photo ? (
            <img 
              src={photo} 
              alt="Captured photo"
              className="w-full aspect-square object-cover"
            />
          ) : (
            <div className="relative w-full aspect-square">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onPlay={() => setCameraActive(true)}
              />
              {/* Test overlay */}
              <div className="absolute inset-0 bg-red-500 opacity-50">
                <div className="flex items-center justify-center h-full">
                  <span className="text-[200px] text-white">
                    TEST
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-4 space-y-2">
          {photo ? (
            <>
              <button 
                onClick={retakePhoto}
                className="w-full bg-gray-500 text-white p-4 rounded-lg hover:bg-gray-600"
              >
                Retake Photo
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => shareToInstagram(photo)}
                  className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600"
                >
                  Share to Instagram
                </button>
                <button 
                  onClick={() => shareToFacebook(photo)}
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600"
                >
                  Share to Facebook
                </button>
              </div>
              <button 
                onClick={() => saveToDevice(photo)}
                className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600"
              >
                Save to Device
              </button>
              <button 
                onClick={savePhoto}
                className="w-full bg-green-500 text-white p-4 rounded-lg hover:bg-green-600"
              >
                Done
              </button>
            </>
          ) : (
            <button 
              onClick={startCountdown}
              disabled={!cameraActive}
              className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Take Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
