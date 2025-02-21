import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Initialize Supabase client directly in the API route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const dynamic = 'force-dynamic';

// Test GET route
export async function GET() {
  console.log('GET /api/events called');
  
  try {
    // Get the authenticated user
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    if (userError) throw userError;

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('user_id', user.id) // Add user_id filter
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Log the full structure of the first event
    if (events?.[0]) {
      console.log('First event data structure:', JSON.stringify(events[0], null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      events 
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Simplified POST route for testing
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received event creation request:', body);

    // Get the authenticated user
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    if (userError) throw userError;

    // First, create the client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([{
        name: body.client_name,
        email: body.client_email,
        phone: body.client_phone,
        user_id: user.id // Add user_id to client record
      }])
      .select()
      .single();

    if (clientError) {
      console.error('Client creation error:', clientError);
      throw clientError;
    }

    // Then create event with client_id and user_id
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert([{
        name: body.name,
        date: body.date,
        start_time: body.start_time,
        end_time: body.end_time,
        status: body.status || 'not_started',
        client_id: clientData.id,
        user_id: user.id // Add user_id to event record
      }])
      .select()
      .single();

    if (eventError) {
      console.error('Event creation error:', eventError);
      throw eventError;
    }

    return NextResponse.json({
      success: true,
      event: {
        ...eventData,
        client: clientData
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create event'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Get the authenticated user
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    if (userError) throw userError;

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    // First verify the user owns this event
    const { data: event, error: eventCheckError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (eventCheckError) throw eventCheckError;
    if (!event) throw new Error('Event not found or access denied');

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete event' 
    }, { status: 500 });
  }
}
