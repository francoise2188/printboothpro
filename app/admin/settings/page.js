'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import styles from './settings.module.css';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  
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

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      if (!user) {
        console.log('⚠️ No user logged in');
        return;
      }

      // First get the user's market
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);  // Get just the first market

      if (marketError) {
        console.error('❌ Market fetch error:', JSON.stringify(marketError, null, 2));
        throw marketError;
      }

      if (!marketData || marketData.length === 0) {
        console.error('❌ No markets found for user');
        throw new Error('No markets found');
      }

      const marketId = marketData[0].id;  // Use the first market
      console.log('🎯 Fetching settings for market:', marketId, 'and user:', user.id);

      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .single();

      if (error) {
        // Only create new settings if we get a "not found" error
        if (error.code === 'PGRST116') {
          // Check if settings already exist for this market
          const { data: existingSettings, error: checkError } = await supabase
            .from('payment_settings')
            .select('*')
            .eq('market_id', marketId);

          if (checkError) {
            console.error('❌ Error checking existing settings:', JSON.stringify(checkError, null, 2));
            throw checkError;
          }

          // Only create new settings if none exist for this market
          if (!existingSettings || existingSettings.length === 0) {
            console.log('⚠️ No settings found, creating new ones');
            const { data: newData, error: insertError } = await supabase
              .from('payment_settings')
              .insert([{ 
                user_id: user.id,
                market_id: marketId,
                paypal_username: '',
                venmo_username: '',
                single_magnet_price: '0',
                three_magnets_price: '0',
                six_magnets_price: '0',
                nine_magnets_price: '0',
                enable_tax: false,
                tax_rate: '0',
                coupons: []
              }])
              .select()
              .single();

            if (insertError) {
              console.error('❌ Insert error:', JSON.stringify(insertError, null, 2));
              throw insertError;
            }
            console.log('✅ Created new settings:', newData);
            setSettings(newData);
            return;
          }
        }
        console.error('❌ Settings fetch error:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ Fetched existing settings:', data);
      setSettings(data);
      setMessage('');
    } catch (error) {
      console.error('❌ Error in fetchSettings:', JSON.stringify(error, null, 2));
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // First get the user's market
      const { data: marketData, error: marketError } = await supabase
        .from('markets')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);  // Get just the first market

      if (marketError) {
        console.error('❌ Market fetch error:', JSON.stringify(marketError, null, 2));
        throw marketError;
      }

      if (!marketData || marketData.length === 0) {
        console.error('❌ No markets found for user');
        throw new Error('No markets found');
      }

      const marketId = marketData[0].id;  // Use the first market
      console.log('💾 Preparing to save settings:', {
        marketId,
        userId: user.id,
        settings: settings
      });

      // First check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('market_id', marketId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing settings:', JSON.stringify(checkError, null, 2));
        throw checkError;
      }

      // Prepare the settings data
      const settingsData = {
        user_id: user.id,
        market_id: marketId,
        paypal_username: settings.paypal_username || '',
        venmo_username: settings.venmo_username || '',
        single_magnet_price: settings.single_magnet_price || '0',
        three_magnets_price: settings.three_magnets_price || '0',
        six_magnets_price: settings.six_magnets_price || '0',
        nine_magnets_price: settings.nine_magnets_price || '0',
        enable_tax: settings.enable_tax || false,
        tax_rate: settings.tax_rate || '0',
        coupons: settings.coupons || [],
        updated_at: new Date().toISOString()
      };

      console.log('📝 Saving settings data:', settingsData);

      let saveResult;
      if (!existingSettings) {
        // Insert new settings
        console.log('➕ Inserting new settings...');
        saveResult = await supabase
          .from('payment_settings')
          .insert([settingsData])
          .select()
          .single();
      } else {
        // Update existing settings
        console.log('🔄 Updating existing settings...');
        saveResult = await supabase
          .from('payment_settings')
          .update(settingsData)
          .eq('user_id', user.id)
          .eq('market_id', marketId)
          .select()
          .single();
      }

      if (saveResult.error) {
        console.error('❌ Save error:', JSON.stringify(saveResult.error, null, 2));
        throw saveResult.error;
      }

      console.log('✅ Settings saved successfully:', saveResult.data);
      
      // Refresh settings from the database
      await fetchSettings();
      
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('❌ Error in handleSubmit:', JSON.stringify(error, null, 2));
      setMessage(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Payment Settings</h1>
      </div>
      
      {message && (
        <div className={`${styles.message} ${message.includes('Error') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Payment Methods Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment Methods</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>PayPal Username</label>
              <input
                type="text"
                value={settings.paypal_username}
                onChange={(e) => setSettings({...settings, paypal_username: e.target.value})}
                className={styles.input}
                placeholder="Enter PayPal username"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Venmo Username</label>
              <input
                type="text"
                value={settings.venmo_username}
                onChange={(e) => setSettings({...settings, venmo_username: e.target.value})}
                className={styles.input}
                placeholder="Enter Venmo username"
              />
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Single Magnet Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.single_magnet_price}
                onChange={(e) => setSettings({...settings, single_magnet_price: e.target.value})}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>3 Magnets Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.three_magnets_price}
                onChange={(e) => setSettings({...settings, three_magnets_price: e.target.value})}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>6 Magnets Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.six_magnets_price}
                onChange={(e) => setSettings({...settings, six_magnets_price: e.target.value})}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>9 Magnets Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.nine_magnets_price}
                onChange={(e) => setSettings({...settings, nine_magnets_price: e.target.value})}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Tax Settings</h2>
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={settings.enable_tax}
                  onChange={(e) => setSettings({...settings, enable_tax: e.target.checked})}
                  className={styles.checkboxInput}
                />
                <label className={styles.checkboxLabel}>Enable Tax</label>
              </div>
            </div>
            {settings.enable_tax && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({...settings, tax_rate: e.target.value})}
                  className={styles.input}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="submit"
            disabled={saving}
            className={styles.primaryButton}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 