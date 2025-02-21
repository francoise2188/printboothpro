import { loadStripe } from '@stripe/stripe-js';

// This is for the frontend - loading Stripe.js
let stripePromise;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    name: 'Monthly Plan',
    price: 60, // $60/month
    interval: 'month',
    currency: 'usd',
    features: [
      'Unlimited photo sessions',
      'Custom branding',
      'Digital downloads',
      'Basic analytics',
      'Email support'
    ]
  }
}; 