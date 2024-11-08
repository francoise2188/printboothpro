import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  'https://maupxocrkqnsfaaprqyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXB4b2Nya3Fuc2ZhYXBycXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwODQwMzIsImV4cCI6MjA0NTY2MDAzMn0.vHIcIHyDMkSN_KS2zd5px_vbi4GcxE0D-xx-mNFSOdY'
);

// Test GET route
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*');

    if (error) {
      console.error('Supabase GET error:', error);
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      events: data 
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { 
      status: 500 
    });
  }
}

// Simplified POST route for testing
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { eventName, eventDate, endDate, photoLimit, status, timezone } = body;

    // Validate that dates are present
    if (!eventDate || !endDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Start and end dates are required' 
      }, { status: 400 });
    }

    const eventData = {
      name: eventName,
      date: eventDate,        // Already formatted from frontend
      end_date: endDate,      // Already formatted from frontend
      photo_limit: parseInt(photoLimit) || 0,
      status: status,
      timezone: timezone,
      created_at: new Date().toISOString().replace('T', ' ').replace('Z', '+00')
    };

    console.log('Inserting into Supabase:', eventData);

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete event' 
    }, { status: 500 });
  }
}
