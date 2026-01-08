import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, leadId } = await req.json()

    // 1. Appel API de vérification (Exemple avec Hunter.io ou autre)
    // const API_KEY = Deno.env.get('EMAIL_VERIFIER_API_KEY')
    // const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${API_KEY}`)
    // const result = await response.json()
    
    // Simulation pour le moment
    let status = 'valid'
    if (email.includes('test')) status = 'risky'
    if (email.includes('error')) status = 'invalid'

    // 2. Mise à jour de la base de données
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase
      .from('scraping_results')
      .update({ 
        email_status: status,
        email_last_verified_at: new Date().toISOString()
      })
      .eq('id', leadId)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

