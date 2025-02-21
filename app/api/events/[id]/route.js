import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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
    
    // Get the authenticated user using cookies from the request
    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // First update the event details
    const updateData = {
      name: body.name,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      status: body.status,
      event_type: body.event_type,
      location: body.location,
      address: body.address,
      expected_guests: body.expected_guests,
      package: body.package,
      package_price: body.package_price,
      photo_limit: body.photo_limit
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    console.log('Updating event with data:', updateData);

    // Add user_id check to ensure user owns this event
    const { data: eventData, error: eventError } = await supabaseServer
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (eventError) {
      console.error('Error updating event:', eventError);
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    if (!eventData) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Then handle design settings if provided
    if (body.landing_background || body.frame_overlay) {
      const designData = {
        event_id: id,
        landing_background: body.landing_background,
        frame_overlay: body.frame_overlay,
        updated_at: new Date().toISOString()
      };

      const { error: designError } = await supabaseServer
        .from('design_settings')
        .upsert(designData)
        .eq('event_id', id);

      if (designError) {
        console.error('Error updating design settings:', designError);
        return NextResponse.json(
          { error: 'Failed to update design settings' },
          { status: 500 }
        );
      }
    }

    // Fetch the updated event with design settings
    const { data: updatedEvent, error: fetchError } = await supabaseServer
      .from('events')
      .select(`
        *,
        design_settings (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated event:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error in PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get event
export async function GET(request, { params }) {
  try {
    const { id } = params;
    console.log('Fetching event with ID:', id);
    
    // Get the authenticated user using cookies from the request
    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore });
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Authentication failed', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      console.error('No active session found');
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Authentication failed', details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('No authenticated user found');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log('Authenticated user ID:', user.id);
    
    // Fetch the event with design settings and user_id check
    const { data: event, error: eventError } = await supabaseServer
      .from('events')
      .select(`
        *,
        design_settings (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (eventError) {
      console.error('Database error:', eventError);
      return NextResponse.json(
        { error: 'Failed to fetch event', details: eventError.message },
        { status: 500 }
      );
    }

    if (!event) {
      console.error('Event not found or access denied for ID:', id);
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Successfully fetched event:', event.id);
    return NextResponse.json(event);
  } catch (error) {
    console.error('Unexpected error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Delete event
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    console.log('Starting deletion for event:', id);

    // Get the authenticated user using cookies from the request
    const cookieStore = cookies();
    const supabaseServer = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // First verify the user owns this event
    const { data: event, error: eventCheckError } = await supabaseServer
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (eventCheckError) {
      console.error('Error checking event ownership:', eventCheckError);
      return NextResponse.json(
        { error: 'Failed to verify event ownership' },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Delete associated design settings first
    const { error: designDeleteError } = await supabaseServer
      .from('design_settings')
      .delete()
      .eq('event_id', id);

    if (designDeleteError) {
      console.error('Error deleting design settings:', designDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete design settings' },
        { status: 500 }
      );
    }

    // Finally delete the event
    const { error: deleteError } = await supabaseServer
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}