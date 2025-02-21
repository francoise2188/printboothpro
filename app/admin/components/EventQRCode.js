'use client';
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '../../../lib/AuthContext';

export default function EventQRCode({ eventId, eventName }) {
  const [mounted, setMounted] = useState(false);
  const [eventUrl, setEventUrl] = useState('');
  const [isActive, setIsActive] = useState(true); // New state for QR status
  const supabase = createClientComponentClient();
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setEventUrl(`${window.location.origin}/?event=${eventId}`);
    }
    
    // Fetch initial event status with user_id check
    async function fetchEventStatus() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('events')
        .select('is_active')
        .eq('id', eventId)
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setIsActive(data.is_active);
      }
    }
    
    fetchEventStatus();
  }, [eventId, user]);

  // Handle QR activation toggle with user_id check
  const toggleEventStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ is_active: !isActive })
        .eq('id', eventId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setIsActive(data.is_active);
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  if (!mounted) return null;

  return (
    <div className="bg-white p-6 mt-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Event QR Code</h3>
        <button
          onClick={toggleEventStatus}
          className={`px-4 py-2 rounded text-white transition-colors ${
            isActive 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          {isActive ? 'Deactivate QR' : 'Activate QR'}
        </button>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative">
          <QRCodeSVG 
            value={eventUrl} 
            size={200}
            className={`mb-4 ${!isActive && 'opacity-50'}`}
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                Deactivated
              </span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          {isActive 
            ? 'Scan this code to access the photo booth'
            : 'QR code is currently deactivated'
          }
        </p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigator.clipboard.writeText(eventUrl)}
            className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
          >
            Copy URL
          </button>
          
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              printWindow.document.write(`
                <html>
                  <head>
                    <title>${eventName} - QR Code</title>
                    <style>
                      body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                      }
                      h2 { 
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                      }
                      svg {
                        width: 600px !important;
                        height: 600px !important;
                      }
                      ${!isActive ? '.qr-code { opacity: 0.5; }' : ''}
                    </style>
                  </head>
                  <body>
                    <h2>${eventName || 'Event'}</h2>
                    <div class="qr-code">
                      ${document.querySelector('.flex.flex-col.items-center svg').outerHTML}
                    </div>
                    ${!isActive ? '<p style="text-align: center; color: red; margin-top: 20px;">QR Code Deactivated</p>' : ''}
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }}
            className="mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors"
          >
            Print QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
