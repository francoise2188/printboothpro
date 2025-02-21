import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  console.log('Verify payment endpoint called');
  
  try {
    const { sessionId } = await request.json();
    console.log('Received request:', { sessionId });

    if (!sessionId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log('Retrieving Stripe session...');
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Stripe session:', session);

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    console.log('Payment verified successfully');
    // Return success with customer email
    return NextResponse.json({
      success: true,
      customerId: session.customer,
      subscriptionId: session.subscription,
      customerEmail: session.customer_details.email
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Error verifying payment' },
      { status: 500 }
    );
  }
} 