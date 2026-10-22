// ==============================================================================
// L'AURA BISTRO - SUPABASE CLIENT CONFIGURATION (SINGLETON PROMISE)
// ==============================================================================

const SUPABASE_CONFIG = {
  // Supabase Project URL
  url: "https://kdyupekprmrpgadilxqi.supabase.co",
  
  // Supabase Publishable Key
  anonKey: "sb_publishable_FHaJRONJwt706m1pXByXsw_KFyU6Opj"
};

// Check if credentials have been saved previously in localStorage (handy for testing)
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

// Singleton Promise to strictly prevent multiple GoTrueClient instances
let clientPromise = null;

export const getSupabaseClient = () => {
  if (!clientPromise) {
    clientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
      ({ createClient }) => {
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
      }
    );
  }
  return clientPromise;
};
