'use client';

import { useState, useRef, useEffect } from 'react';

export default function OverlayEditor() {
  const [overlayImage, setOverlayImage] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    setupCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOverlayImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save overlay
  const saveOverlay = () => {
    if (overlayImage) {
      localStorage.setItem('photoBoothOverlay', overlayImage);
      alert('Overlay saved!');
    }
  };

  // Load saved overlay
  const loadSavedOverlay = () => {
    const saved = localStorage.getItem('photoBoothOverlay');
    if (saved) {
      setOverlayImage(saved);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Overlay Editor</h1>
        
        {/* Controls */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Upload Overlay
          </button>
          <button
            onClick={saveOverlay}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Save Changes
          </button>
          <button
            onClick={loadSavedOverlay}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Load Saved
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleUpload}
            className="hidden"
          />
        </div>

        {/* Camera Preview Container */}
        <div className="bg-black rounded-lg overflow-hidden">
          <div style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '1/1',
            position: 'relative',
            margin: '0 auto'
          }}>
            {/* Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />

            {/* Overlay Layer */}
            {overlayImage && (
              <img
                src={overlayImage}
                alt="Overlay"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        </div>

        {/* Clear Overlay Button */}
        {overlayImage && (
          <button
            onClick={() => setOverlayImage(null)}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Overlay
          </button>
        )}
      </div>
    </div>
  );
}
