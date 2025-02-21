'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/AuthContext';
import React from 'react';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const marketId = params.marketId;
  const searchParams = useSearchParams();
  const photoId = searchParams.get('photoId');
  const initialQuantity = Number(searchParams.get('quantity')) || 1;
  const [quantity, setQuantity] = useState(initialQuantity);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const { user } = useAuth();

  const [settings, setSettings] = useState({
    paypal_username: '',
    venmo_username: '',
    single_magnet_price: '0',
    three_magnets_price: '0',
    six_magnets_price: '0',
    nine_magnets_price: '0',
    enable_tax: false,
    tax_rate: '0',
    coupons: []
  });

  const [pricing, setPricing] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });

  const [orderCode, setOrderCode] = useState('');

  // Fetch settings when component mounts
  useEffect(() => {
    async function fetchSettings() {
      try {
        console.log('Fetching payment settings for market:', marketId);
        
        // First get the market owner
        const { data: marketData, error: marketError } = await supabase
          .from('markets')
          .select('user_id')
          .eq('id', marketId)
          .single();

        if (marketError) {
          console.error('Error fetching market:', marketError);
          return;
        }

        const marketOwnerId = marketData.user_id;
        console.log('Found market owner:', marketOwnerId);
        
        const { data, error } = await supabase
          .from('payment_settings')
          .select('*')
          .eq('market_id', marketId)
          .eq('user_id', marketOwnerId)
          .maybeSingle();

        console.log('Raw database response:', data);

        if (error) {
          console.error('Fetch error:', error);
          throw error;
        }
        
        if (data) {
          // Parse coupons if they're stored as a string
          let parsedCoupons = [];
          try {
            parsedCoupons = typeof data.coupons === 'string' 
              ? JSON.parse(data.coupons) 
              : (data.coupons || []);
            console.log('Parsed coupons:', parsedCoupons);
          } catch (e) {
            console.error('Error parsing coupons:', e);
            parsedCoupons = [];
          }

          const newSettings = {
            paypal_username: data.paypal_username || '',
            venmo_username: data.venmo_username || '',
            single_magnet_price: data.single_magnet_price || '0',
            three_magnets_price: data.three_magnets_price || '0',
            six_magnets_price: data.six_magnets_price || '0',
            nine_magnets_price: data.nine_magnets_price || '0',
            enable_tax: data.enable_tax || false,
            tax_rate: data.tax_rate || '0',
            coupons: parsedCoupons
          };
          
          console.log('Settings being set:', newSettings);
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    }

    if (marketId) {
      fetchSettings();
    }
  }, [marketId]);

  // Calculate price based on quantity
  const getPrice = React.useCallback((qty) => {
    let totalPrice;
    
    // Check if quantity exactly matches a special tier
    if (qty === 9) {
      totalPrice = Number(settings.nine_magnets_price);
      console.log('Using exact 9 magnets price:', totalPrice);
    } else if (qty === 6) {
      totalPrice = Number(settings.six_magnets_price);
      console.log('Using exact 6 magnets price:', totalPrice);
    } else if (qty === 3) {
      totalPrice = Number(settings.three_magnets_price);
      console.log('Using exact 3 magnets price:', totalPrice);
    } else if (qty === 1) {
      totalPrice = Number(settings.single_magnet_price);
      console.log('Using single magnet price:', totalPrice);
    } else {
      // For any other quantity, charge the single price per photo
      totalPrice = Number(settings.single_magnet_price) * qty;
      console.log(`Using individual pricing: ${settings.single_magnet_price} x ${qty} = ${totalPrice}`);
    }
    
    return totalPrice;
  }, [settings]);

  // Update pricing whenever quantity, settings, or coupon changes
  useEffect(() => {
    const calculateTotal = () => {
      console.log('Calculating total for quantity:', quantity);
      const basePrice = getPrice(quantity);
      console.log('Base price calculated:', basePrice);
      
      let discount = 0;
      if (couponCode && Array.isArray(settings.coupons)) {
        const coupon = settings.coupons.find(c => c.code === couponCode.toUpperCase());
        if (coupon) {
          if (coupon.type === 'percentage') {
            discount = basePrice * (Number(coupon.amount) / 100);
            console.log(`Applied ${coupon.amount}% discount:`, discount);
          } else {
            discount = Number(coupon.amount);
            console.log(`Applied $${coupon.amount} discount:`, discount);
          }
        }
      }

      const subtotal = basePrice;
      const taxableAmount = subtotal - discount;
      const tax = settings.enable_tax 
        ? (taxableAmount * (Number(settings.tax_rate) / 100))
        : 0;
      
      const total = Math.max(0, taxableAmount + tax);

      console.log('Final price breakdown:', {
        quantity,
        basePrice,
        subtotal,
        discount,
        tax,
        total
      });

      setPricing({
        subtotal,
        tax,
        discount,
        total
      });
    };

    calculateTotal();
  }, [quantity, settings, couponCode, getPrice]);

  // Payment handlers
  const handlePayPal = () => {
    if (settings.paypal_username && pricing.total > 0) {
      window.location.href = `https://www.paypal.com/paypalme/${settings.paypal_username}/${pricing.total.toFixed(2)}`;
    } else {
      alert(settings.paypal_username ? 'Invalid total amount' : 'PayPal not configured');
    }
  };

  const handleVenmo = () => {
    if (settings.venmo_username && pricing.total > 0) {
      window.location.href = `https://venmo.com/${settings.venmo_username}`;
    } else {
      alert(settings.venmo_username ? 'Invalid total amount' : 'Venmo not configured');
    }
  };

  // Update the coupon validation
  const handleApplyCoupon = () => {
    console.log('Trying to apply coupon:', couponCode);
    console.log('Available coupons:', settings.coupons);
    
    if (!Array.isArray(settings.coupons)) {
      console.log('No coupons available');
      setCouponMessage('Invalid coupon code');
      return;
    }

    const coupon = settings.coupons.find(c => c.code === couponCode.toUpperCase());
    console.log('Found coupon:', coupon);

    if (coupon) {
      const discountText = coupon.type === 'percentage' 
        ? `${coupon.amount}% off`
        : `$${coupon.amount} off`;
      setCouponMessage(`Coupon applied: ${discountText}`);
    } else {
      setCouponMessage('Invalid coupon code');
      setCouponCode('');
    }
  };

  const updatePhotoStatus = async (photoId) => {
    try {
      console.log('🔄 Updating photo status for ID:', photoId);

      // Update photo with status and order code
      const { data: updateData, error: updateError } = await supabase
        .from('market_photos')
        .update({ 
          status: 'pending',
          order_code: orderCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', photoId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating photo:', updateError);
        throw updateError;
      }

      console.log('✅ Photo status updated successfully:', updateData);
      return true;
    } catch (error) {
      console.error('❌ Error in updatePhotoStatus:', error);
      return false;
    }
  };

  // Move the photo check to its own effect
  useEffect(() => {
    if (!photoId) return;

    const checkPhoto = async () => {
      const { data, error } = await supabase
        .from('market_photos')
        .select('*')
        .eq('id', photoId)
        .single();
      
      if (error) {
        console.error('Error fetching photo:', error);
      } else {
        console.log('Photo data loaded:', data);
        // Set the order code from the photo
        if (data?.order_code) {
          setOrderCode(data.order_code);
        }
      }
    };
    
    checkPhoto();
  }, [photoId]);

  // Add this useEffect to handle quantity from URL
  useEffect(() => {
    const urlQuantity = searchParams.get('quantity');
    if (urlQuantity) {
      const qty = Number(urlQuantity);
      if ([1, 3, 6, 9].includes(qty)) {
        setQuantity(qty);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black p-2 sm:p-4">
      <div className="w-full max-w-md mx-auto" style={{ 
        backgroundColor: 'var(--background-light)',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'var(--primary-green)',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--secondary-sage)'
        }}>
          <h1 style={{ 
            fontFamily: 'var(--font-accent)',
            color: 'var(--text-light)',
            fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem'
          }}>Checkout</h1>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Code Display */}
          <div className="text-center">
            <div style={{ 
              backgroundColor: 'var(--secondary-sage)',
              padding: '1.25rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <p style={{ color: 'var(--accent-tan)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Your Order Code:
              </p>
              <p style={{ 
                color: 'var(--text-light)',
                fontSize: 'clamp(1.5rem, 6vw, 2rem)',
                fontWeight: '600',
                marginBottom: '0.5rem',
                wordBreak: 'break-all'
              }}>{orderCode}</p>
              <p style={{ color: 'var(--accent-tan)', fontSize: '0.75rem' }}>
                Keep this code for your records
              </p>
            </div>
          </div>

          {/* Quantity Display - replacing the dropdown */}
          <div className="card" style={{ 
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                color: 'var(--text-dark)',
                fontSize: '1rem',
                fontWeight: '500'
              }}>
                Quantity:
              </span>
              <span style={{
                color: 'var(--text-dark)',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                {quantity} {quantity === 1 ? 'photo' : 'photos'}
              </span>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="card" style={{ 
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <label style={{ 
              display: 'block',
              color: 'var(--text-dark)',
              fontSize: '1rem',
              fontWeight: '500',
              marginBottom: '0.75rem'
            }}>Have a Coupon?</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--accent-tan)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'var(--text-dark)',
                  backgroundColor: 'white',
                  transition: 'all 0.2s ease'
                }}
              />
              <button
                onClick={handleApplyCoupon}
                style={{
                  padding: '0.75rem 1.25rem',
                  backgroundColor: 'var(--secondary-sage)',
                  color: 'var(--text-light)',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Apply
              </button>
            </div>
            {couponMessage && (
              <p style={{ 
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                color: couponMessage.includes('Invalid') ? '#dc2626' : '#059669'
              }}>
                {couponMessage}
              </p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="card" style={{ 
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center" style={{ color: 'var(--text-dark)' }}>
                <span>Subtotal:</span>
                <span>${pricing.subtotal.toFixed(2)}</span>
              </div>
              {pricing.discount > 0 && (
                <div className="flex justify-between items-center" style={{ color: '#059669' }}>
                  <span>Discount:</span>
                  <span>-${pricing.discount.toFixed(2)}</span>
                </div>
              )}
              {settings.enable_tax && (
                <div className="flex justify-between items-center" style={{ color: 'var(--text-dark)' }}>
                  <span>Tax ({settings.tax_rate}%):</span>
                  <span>${pricing.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 mt-3" style={{ 
                borderTop: '1px solid var(--accent-tan)',
                color: 'var(--text-dark)',
                fontSize: 'clamp(1.125rem, 4vw, 1.25rem)',
                fontWeight: '600'
              }}>
                <span>Total:</span>
                <span>${pricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={handlePayPal}
              disabled={pricing.total <= 0}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--secondary-sage)',
                color: 'var(--text-light)',
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: pricing.total <= 0 ? '0.5' : '1',
                fontSize: '1rem'
              }}
            >
              Pay with PayPal
            </button>
            <button
              onClick={handleVenmo}
              disabled={pricing.total <= 0}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--primary-green)',
                color: 'var(--text-light)',
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: pricing.total <= 0 ? '0.5' : '1',
                fontSize: '1rem'
              }}
            >
              Pay with Venmo
            </button>
            
            {/* Test Button - Only shows in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={async () => {
                  if (!photoId) {
                    console.error('❌ No photoId found!');
                    alert('No photo ID found');
                    return;
                  }

                  console.log('🧪 Starting test checkout with:', {
                    marketId,
                    photoId,
                    settings,
                    pricing,
                    quantity
                  });

                  // Update photo status
                  const success = await updatePhotoStatus(photoId);
                  
                  if (success) {
                    alert(`Test Successful!\n\nPhoto ID: ${photoId}\nTotal: $${pricing.total.toFixed(2)}\nStatus: Updated to pending`);
                    router.push(`/market/${marketId}/success?photoId=${photoId}`);
                  } else {
                    alert('Error updating photo status');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  backgroundColor: 'var(--accent-tan)',
                  color: 'var(--primary-green)',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '1rem'
                }}
              >
                🧪 Test Checkout (Dev Only)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
