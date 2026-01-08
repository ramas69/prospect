import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface N8NWebhookPayload {
  session_id: string;
  nom_feuille_google_sheet?: string;
  lien_google_sheet?: string;
  statut?: string;
  count?: number;
  json_donnee_scrappe?: string;
}

interface ScrapedData {
  row_number?: number;
  'Nom de catégorie'?: string;
  'URL Google Maps'?: string;
  Titre?: string;
  Rue?: string;
  Ville?: string;
  'Code postal'?: number;
  Email?: string;
  'Site web'?: string;
  Téléphone?: number | string;
  'Score total'?: number;
  "Nombre d'avis"?: number;
  "Heures d'ouverture"?: string;
  Infos?: string;
  Résumé?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const rawPayload = await req.json();
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Raw payload:', JSON.stringify(rawPayload, null, 2));

    let payload: N8NWebhookPayload;
    if (Array.isArray(rawPayload) && rawPayload.length > 0) {
      console.log('Payload is array, taking first element');
      payload = rawPayload[0];
    } else {
      console.log('Payload is object');
      payload = rawPayload;
    }

    console.log('Extracted payload:', JSON.stringify(payload, null, 2));

    if (!payload.session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const status = payload.statut === 'termine' ? 'completed' :
                   payload.statut === 'en_cours' ? 'in_progress' :
                   payload.statut === 'echoue' ? 'failed' : 'pending';

    let emailsFound = 0;
    let scrapedDataArray: ScrapedData[] = [];

    if (payload.json_donnee_scrappe) {
      try {
        console.log('Parsing json_donnee_scrappe...');
        scrapedDataArray = JSON.parse(payload.json_donnee_scrappe);
        console.log(`Parsed ${scrapedDataArray.length} items from scraped data`);
        console.log('First item sample:', JSON.stringify(scrapedDataArray[0], null, 2));

        emailsFound = scrapedDataArray.filter(item =>
          item.Email && item.Email !== 'aucun_mail' && item.Email.includes('@')
        ).length;
        console.log(`Found ${emailsFound} valid emails`);
      } catch (parseError) {
        console.error('Error parsing json_donnee_scrappe:', parseError);
      }
    } else {
      console.log('No json_donnee_scrappe in payload');
    }

    const updateData: any = {
      status: status,
      sheet_url: payload.lien_google_sheet,
      sheet_name: payload.nom_feuille_google_sheet,
      actual_results: payload.count || scrapedDataArray.length,
      emails_found: emailsFound,
      progress_percentage: status === 'completed' ? 100 : undefined,
      scraped_data: scrapedDataArray.length > 0 ? scrapedDataArray : undefined,
    };

    if (status === 'in_progress' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    console.log('Update data to be saved:', JSON.stringify(updateData, null, 2));

    const { data: session, error: updateError } = await supabase
      .from('scraping_sessions')
      .update(updateData)
      .eq('id', payload.session_id)
      .select('user_id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating session:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update session', details: updateError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (scrapedDataArray.length > 0 && session.user_id) {
      // Get existing leads for this user to avoid duplicates
      const { data: existingLeads } = await supabase
        .from('scraping_results')
        .select('business_name, address')
        .filter('session_id', 'in', 
          supabase
            .from('scraping_sessions')
            .select('id')
            .eq('user_id', session.user_id)
        );

      const existingSet = new Set(
        (existingLeads || []).map(l => `${l.business_name}|${l.address || ''}`)
      );

      const resultsToInsert = scrapedDataArray.map(item => {
        const address = [
          item.Rue,
          item['Code postal'],
          item.Ville
        ].filter(Boolean).join(', ');

        const phone = item.Téléphone ?
          (typeof item.Téléphone === 'number' ? `+${item.Téléphone}` : item.Téléphone) :
          undefined;

        const email = item.Email && item.Email !== 'aucun_mail' && item.Email.includes('@') ?
          item.Email :
          undefined;

        const businessName = item.Titre || 'Sans nom';
        const normalizedAddress = address || '';

        // Check for duplicate
        if (existingSet.has(`${businessName}|${normalizedAddress}`)) {
          return null;
        }

        return {
          session_id: payload.session_id,
          business_name: businessName,
          address: address || undefined,
          phone: phone,
          email: email,
          website: item['Site web'] || undefined,
          rating: item['Score total'] || undefined,
          reviews_count: item["Nombre d'avis"] || undefined,
          category: item['Nom de catégorie'] || undefined,
        };
      }).filter(Boolean);

      if (resultsToInsert.length > 0) {
      const { error: resultsError } = await supabase
        .from('scraping_results')
        .insert(resultsToInsert);

      if (resultsError) {
        console.error('Error inserting results:', resultsError);
        }
      } else {
        console.log('No new leads to insert (all duplicates)');
      }
    }

    if (status === 'completed' && session.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_scraping_count, total_leads_generated')
        .eq('id', session.user_id)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_scraping_count: (profile.total_scraping_count || 0) + 1,
            total_leads_generated: (profile.total_leads_generated || 0) + (payload.count || scrapedDataArray.length),
            last_scraping_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', session.user_id);
      }
    }

    console.log('=== WEBHOOK SUCCESS ===');
    console.log(`Session ${payload.session_id} updated with status: ${status}`);
    console.log(`Results: ${scrapedDataArray.length}, Emails: ${emailsFound}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        processed: {
          session_id: payload.session_id,
          status: status,
          results_count: scrapedDataArray.length,
          emails_found: emailsFound
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});