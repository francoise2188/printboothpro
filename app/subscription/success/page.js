'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../subscription.module.css';

export default function SubscriptionSuccessPage() {
  const [status, setStatus] = useState('loading');
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        // Verify the subscription with our backend
        const response = await fetch('/api/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        });

        const { success, error } = await response.json();

        if (error) throw new Error(error);

        setStatus('success');
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setStatus('error');
      }
    };

    verifySubscription();
  }, [sessionId]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.pricingCard}>
          <div className={styles.cardContent}>
            {status === 'loading' && (
              <div className={styles.planHeader}>
                <h2 className={styles.planName}>
                  Verifying your subscription...
                </h2>
                <p className={styles.subtitle}>
                  Please wait while we confirm your payment
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className={styles.planHeader}>
                <div className={styles.successIcon}>
                  <svg
                    className={styles.featureIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ width: '3rem', height: '3rem', margin: '0 auto' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className={styles.planName}>
                  Subscription Successful!
                </h2>
                <p className={styles.subtitle}>
                  Thank you for subscribing. You'll be redirected to your profile in a moment...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className={styles.planHeader}>
                <div className={styles.errorIcon}>
                  <svg
                    className={styles.featureIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ width: '3rem', height: '3rem', margin: '0 auto', color: '#dc2626' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className={styles.planName}>
                  Something went wrong
                </h2>
                <p className={styles.subtitle}>
                  There was an error verifying your subscription. Please contact support.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 