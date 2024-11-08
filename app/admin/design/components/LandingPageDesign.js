'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function LandingPageDesign() {
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Test Supabase connection first
      try {
        const { data: testData, error: testError } = await supabase.storage
          .from('designs')
          .list();
        
        if (testError) {
          throw new Error('Supabase storage connection failed');
        }
      } catch (error) {
        console.error('Supabase connection test failed:', error);
        setMessage('❌ Storage connection failed. Please check configuration.');
        return;
      }

      // Proceed with upload
      const fileExt = file.name.split('.').pop();
      const fileName = `landing_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('designs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(fileName);

      setMessage('✅ Upload successful!');
      
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Landing Page Background</h2>
      
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <label className="block text-center cursor-pointer">
          <span className="text-gray-600">
            {uploading ? 'Uploading...' : 'Click to upload background image'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Preview:</h3>
          <img 
            src={preview} 
            alt="Design preview" 
            className="max-h-[400px] object-contain mx-auto"
          />
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-50' : 'bg-red-50'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
