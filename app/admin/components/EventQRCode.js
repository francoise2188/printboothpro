'use client';
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function EventQRCode({ eventId }) {
  const [mounted, setMounted] = useState(false);
  const [eventUrl, setEventUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/event/${eventId}`);
    }
  }, [eventId]);

  if (!mounted) return null;

  return (
    <div className="bg-white p-6 mt-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Event QR Code</h3>
      <div className="flex flex-col items-center">
        <QRCodeSVG 
          value={eventUrl} 
          size={200}
          className="mb-4" 
        />
        <p className="text-sm text-gray-600 mb-2">
          Scan this code to access the event page
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(eventUrl)}
          className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
        >
          Copy URL
        </button>
      </div>
    </div>
  );
}
