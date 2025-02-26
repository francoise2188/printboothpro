console.log('Debug - Environment Variables:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  environment: process.env.VERCEL_ENV || 'local'
}); 