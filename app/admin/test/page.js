'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestPage() {
  const [status, setStatus] = useState({
    supabase: 'Testing...',
    env: 'Testing...',
    error: null
  });

  useEffect(() => {
    // Test environment variables
    const testEnvVars = () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log('URL:', url); // Debug log
      console.log('Key exists:', !!key); // Debug log

      if (url && key) {
        setStatus(prev => ({
          ...prev,
          env: '✅ Environment variables loaded!'
        }));
      } else {
        setStatus(prev => ({
          ...prev,
          env: '❌ Missing environment variables'
        }));
      }
    };

    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...'); // Debug log
        const { data, error } = await supabase
          .from('design_settings')
          .select('*')
          .limit(1);

        if (error) throw error;
        
        console.log('Supabase response:', data); // Debug log
        setStatus(prev => ({
          ...prev,
          supabase: '✅ Supabase connection successful!'
        }));
      } catch (error) {
        console.error('Supabase Error:', error);
        setStatus(prev => ({
          ...prev,
          supabase: '❌ Supabase error',
          error: error.message
        }));
      }
    };

    testEnvVars();
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Connection Test</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-semibold">Environment Variables:</h2>
            <p className="mt-2">{status.env}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h2 className="font-semibold">Supabase Connection:</h2>
            <p className="mt-2">{status.supabase}</p>
            {status.error && (
              <p className="mt-2 text-red-500 text-sm">{status.error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
