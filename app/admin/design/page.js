'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DesignPage() {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

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

      // Upload to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `landing_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('designs')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('design_settings')
        .upsert({
          type: 'landing',
          url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setMessage('✅ Landing page design uploaded successfully!');
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Error uploading design: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Landing Page Design</h1>
        
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="block text-center cursor-pointer">
              <span className="text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload design'}
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
              <h2 className="font-semibold mb-2">Preview:</h2>
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
      </div>
    </div>
  );
}

