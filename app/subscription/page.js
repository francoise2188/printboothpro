'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStripe, SUBSCRIPTION_PLANS } from '../../lib/stripe-client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { useAuth } from '../../lib/AuthContext';
import styles from './subscription.module.css';

// Initialize Supabase client
const supabase = createClientComponentClient();

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();
  const plan = SUBSCRIPTION_PLANS.MONTHLY;
  const { user } = useAuth();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Creating checkout session for:', plan.id);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.id,
        }),
      });

      const data = await response.json();
      console.log('Checkout session response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (!data.sessionId) {
        throw new Error('No session ID returned from checkout');
      }

      const stripe = await getStripe();
      const { error: stripeError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      });
      
      if (stripeError) {
        throw stripeError;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Program Name */}
        <div className={styles.programName}>
          PrintBooth Pro
        </div>

        {/* Hero Section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Streamline Your Event-Based Photo Magnet Business</h1>
          <p className={styles.subtitle}>
            The first all-in-one platform built specifically for event-based photo magnets - from weddings to markets, festivals to corporate events. Manage your entire business from one place.
          </p>
          {user && (
            <div className={styles.userBadge}>
              Logged in as: {user.email}
            </div>
          )}
        </div>

        {/* Business Models Section */}
        <div className={styles.businessModels}>
          <h2 className={styles.sectionTitle}>Two Ways to Grow Your Business</h2>
          <div className={styles.modelGrid}>
            <div className={styles.modelCard}>
              <h3 className={styles.modelTitle}>Events</h3>
              <ul className={styles.modelFeatures}>
                <li>Weddings, birthdays, corporate</li>
                <li>Custom QR codes</li>
                <li>Prepaid structure</li>
                <li>Virtual photobooth</li>
                <li>Custom overlays</li>
                <li>Automated printing</li>
              </ul>
            </div>
            <div className={styles.modelCard}>
              <h3 className={styles.modelTitle}>Markets</h3>
              <ul className={styles.modelFeatures}>
                <li>Farmers markets, vendor events</li>
                <li>Pay-as-you-go system</li>
                <li>Built-in checkout</li>
                <li>Order tracking</li>
                <li>Custom branding</li>
                <li>Calendar management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Showcase */}
        <div className={styles.featuresShowcase}>
          <h2 className={styles.sectionTitle}>Powerful Features for Your Business</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Dashboard & Analytics</h3>
              <ul className={styles.featureDetails}>
                <li>Track total revenue and orders</li>
                <li>Monitor active and upcoming events</li>
                <li>View recent activity at a glance</li>
                <li>Manage your business metrics</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Virtual Photobooth</h3>
              <ul className={styles.featureDetails}>
                <li>Unique QR code for each event</li>
                <li>Custom branded overlays</li>
                <li>Easy-to-use mobile interface</li>
                <li>No special equipment needed</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Template System</h3>
              <ul className={styles.featureDetails}>
                <li>Perfect sizing for magnets</li>
                <li>Custom backside printing</li>
                <li>Auto-flow from photos to template</li>
                <li>Zoom and pan functionality</li>
              </ul>
            </div>

            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Payment Processing</h3>
              <ul className={styles.featureDetails}>
                <li>PayPal & Venmo integration</li>
                <li>Market checkout system</li>
                <li>Custom pricing options</li>
                <li>Tax calculation support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Why PrintBooth Pro */}
        <div className={styles.whySection}>
          <h2 className={styles.sectionTitle}>Why PrintBooth Pro</h2>
          <div className={styles.whyContent}>
            <div className={styles.whyCard}>
              <h3 className={styles.whyTitle}>The Smart Choice for Event Photo Magnets</h3>
              <ul className={styles.whyList}>
                <li>
                  <strong>No Expensive Equipment Required</strong>
                  <p>Run your photobooth business without costly photobooth hardware - just use our virtual photobooth system</p>
                </li>
                <li>
                  <strong>Streamlined Workflow</strong>
                  <p>Automated process from photo capture to printing - save time and reduce errors</p>
                </li>
                <li>
                  <strong>Multiple Revenue Streams</strong>
                  <p>Handle prepaid events, market sales, and online orders all in one platform</p>
                </li>
                <li>
                  <strong>Professional Branding</strong>
                  <p>Customize every aspect of your business with professional branding options</p>
                </li>
                <li>
                  <strong>Built for Events</strong>
                  <p>Created specifically for event-based photo magnet businesses by someone who understands the industry</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Potential Section */}
        <div className={styles.potentialSection}>
          <h2 className={styles.sectionTitle}>Business Potential</h2>
          <div className={styles.potentialContent}>
            <div className={styles.potentialCard}>
              <h3 className={styles.potentialTitle}>Diverse Revenue Streams</h3>
              <ul className={styles.potentialList}>
                <li>Pre-booked Events (weddings, corporate events, parties)</li>
                <li>Market Sales (farmers markets, festivals, fairs)</li>
                <li>Online Orders</li>
                <li>Premium Events (sports events, music festivals)</li>
              </ul>
              <div className={styles.potentialFeatures}>
                <p>With PrintBooth Pro, you can:</p>
                <ul>
                  <li>Run multiple revenue streams simultaneously</li>
                  <li>Scale your business at your own pace</li>
                  <li>Manage everything from one platform</li>
                  <li>Build a flexible business that works for you</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Guide Section */}
        <div className={styles.equipmentSection}>
          <h2 className={styles.sectionTitle}>Essential Equipment Guide</h2>
          <div className={styles.equipmentGrid}>
            <div className={styles.equipmentCard}>
              <h3 className={styles.equipmentTitle}>Photo Magnet Production</h3>
              <ul className={styles.equipmentList}>
                <li>
                  <strong>2x2 Square Magnet Maker</strong>
                  <ul>
                    <li>Manual maker recommended for beginners (cost-effective)</li>
                    <li>Automatic maker available for scaling up</li>
                  </ul>
                </li>
                <li>
                  <strong>Mylar/Backing Pieces Kit</strong>
                  <ul>
                    <li>Includes materials for magnet assembly</li>
                    <li>Usually bundled with maker and cutter</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className={styles.equipmentCard}>
              <h3 className={styles.equipmentTitle}>Printing & Cutting</h3>
              <ul className={styles.equipmentList}>
                <li>
                  <strong>Professional Printer</strong>
                  <ul>
                    <li>Recommended: Epson EcoTank</li>
                    <li>Provides professional quality prints</li>
                    <li>Cost-effective ink system</li>
                  </ul>
                </li>
                <li>
                  <strong>2x2 Square Paper Punch</strong>
                  <ul>
                    <li>Precisely sized for magnets</li>
                    <li>Usually included with magnet maker</li>
                  </ul>
                </li>
                <li>
                  <strong>Guillotine Paper Cutter</strong>
                  <ul>
                    <li>For precise, clean cuts</li>
                    <li>Essential for professional finish</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <p className={styles.equipmentNote}>
            Note: PrintBooth Pro is web-based software that works with any of these equipment setups, 
            allowing you to start small and scale up as your business grows.
          </p>
        </div>

        {/* Pricing Section */}
        <div className={styles.pricingCard}>
          <div className={styles.cardContent}>
            <div className={styles.planHeader}>
              <h3 className={styles.planName}>Professional Plan</h3>
              <div className={styles.priceContainer}>
                <span className={styles.price}>$59</span>
                <span className={styles.interval}>/month</span>
              </div>
            </div>

            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>No setup fees</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>No transaction fees</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited events & markets</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited photos & orders</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom branding options</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Payment processing</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Auto-printing capability</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.featureIcon} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span>Business analytics</span>
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={styles.subscribeButton}
            >
              {loading ? 'Processing...' : user ? 'Subscribe Now' : 'Get Started'}
            </button>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <p className={styles.guarantee}>
              Cancel anytime • No long-term commitment
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className={styles.faqSection}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h3>How does billing work?</h3>
              <p>Billing is automatic through Stripe and occurs monthly until you cancel your subscription.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>How do I get started?</h3>
              <p>Simply subscribe, create your login, and you'll have immediate access to the web-based program.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>What equipment do I need?</h3>
              <p>To use PrintBooth Pro, you only need a computer with internet access. For your photo magnet business, you'll need the equipment listed in our guide above.</p>
            </div>
            <div className={styles.faqItem}>
              <h3>How does the virtual photobooth work?</h3>
              <p>Each event and market gets a unique QR code. When guests scan it, they access a custom virtual photobooth where they can take photos. The photos automatically include your custom borders (created in Canva).</p>
            </div>
            <div className={styles.faqItem}>
              <h3>Can I customize my branding?</h3>
              <p>Yes! You can create custom landing pages, add custom camera borders (made in Canva), include your email/website to be printed on the back of each magnet, and customize the look for each event or market.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 