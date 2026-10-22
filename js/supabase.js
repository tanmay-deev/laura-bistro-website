// ==============================================================================
// L'AURA BISTRO - SUPABASE CLIENT CONFIGURATION
// ==============================================================================
// Replace these two values with your project credentials from your Supabase Dashboard:
// 1. Go to https://supabase.com/dashboard -> Select your project
// 2. Click on the "Settings" (gear icon) -> "API"
// 3. Copy "Project URL" and the "anon / public" API key.
// ==============================================================================

const SUPABASE_CONFIG = {
  // Supabase Project URL
  url: "https://kdyupekprmrpgadilxqi.supabase.co",
  
  // Supabase Publishable Key
  anonKey: "sb_publishable_FHaJRONJwt706m1pXByXsw_KFyU6Opj"
};
// Check if credentials have been saved previously in localStorage (handy for testing without editing code)
const savedUrl = localStorage.getItem('laura_supabase_url');
const savedKey = localStorage.getItem('laura_supabase_key');

export const SUPABASE_URL = savedUrl || SUPABASE_CONFIG.url;
export const SUPABASE_ANON_KEY = savedKey || SUPABASE_CONFIG.anonKey;

export const isSupabaseConfigured = () => {
  return SUPABASE_URL && 
         !SUPABASE_URL.includes("YOUR_SUPABASE_PROJECT_URL") && 
         SUPABASE_ANON_KEY && 
         !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_PUBLIC_KEY");
};

let clientInstance = null;

// Asynchronously initialize and export the singleton Supabase client
export const getSupabaseClient = async () => {
  if (clientInstance) {
    return clientInstance;
  }

  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase credentials not yet configured! Please update `js/supabase.js`."
    );
  }

  // Import the latest Supabase JS client from esm.sh CDN
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return clientInstance;
};
