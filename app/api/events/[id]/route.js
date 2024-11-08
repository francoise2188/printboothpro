import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  'https://maupxocrkqnsfaaprqyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXB4b2Nya3Fuc2ZhYXBycXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwODQwMzIsImV4cCI6MjA0NTY2MDAzMn0.vHIcIHyDMkSN_KS2zd5px_vbi4GcxE0D-xx-mNFSOdY'
);

// Update event
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Debug log to see exact format of incoming dates
    console.log('Raw incoming data:', {
      eventDate: body.eventDate,
      endDate: body.endDate,
      timezone: body.timezone
    });

    const { eventName, eventDate, endDate, photoLimit, status, timezone } = body;

    // Updated date formatting function
    const formatForDB = (dateStr) => {
      if (!dateStr) return null;
      try {
        // Parse the date string
        const date = new Date(dateStr);
        
        // Format as PostgreSQL timestamp with timezone
        const formatted = date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        }).replace(',', '');

        return `${formatted}+00`;
      } catch (error) {
        console.error('Date formatting error:', error);
        return null;
      }
    };

    const updateData = {
      name: eventName,
      date: formatForDB(eventDate),
      end_date: formatForDB(endDate),
      photo_limit: photoLimit,
      status: status,
      timezone: timezone
    };

    // Debug log to see what we're sending to Supabase
    console.log('Data being sent to Supabase:', updateData);

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Get event
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    console.log('Retrieved event:', data);

    return NextResponse.json({ 
      success: true, 
      event: data 
    });
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Delete event
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}