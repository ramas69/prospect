const SUPABASE_URL = 'https://acwesyhvhvakumtwtsmd.supabase.co';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/scraping-webhook`;

async function testWebhookN8N() {
  console.log('Testing N8N webhook format...');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  const sessionId = 'test-session-' + Date.now();
  console.log('Session ID:', sessionId);
  console.log('Note: This test uses a fake session_id. For real testing, create a session first.');
  console.log('');

  console.log('Testing N8N webhook payload...');

  const n8nPayload = [
    {
      "session_id": sessionId,
      "nom_feuille_google_sheet": "Feuille test",
      "lien_google_sheet": "https://docs.google.com/spreadsheets/d/10BeoVh8BfSCjIlQluxp1EvI7eZ2T32GdXIfTBtwg_p4/edit",
      "statut": "termine",
      "count": 2,
      "json_donnee_scrappe": JSON.stringify([
        {
          "row_number": 2,
          "Nom de catégorie": "Restaurant français",
          "URL Google Maps": "https://www.google.com/maps/search/?api=1&query=L'Alsacien%20Dijon",
          "Titre": "L'Alsacien Dijon",
          "Rue": "3 Rue Mably",
          "Ville": "Dijon",
          "Code postal": 21000,
          "Email": "contact@lalsacien.com",
          "Site web": "http://www.lalsacien.com/restaurant-alsacien-flammekueche-dijon/",
          "Téléphone": 33380608478,
          "Score total": 4.6,
          "Nombre d'avis": 1448
        },
        {
          "row_number": 3,
          "Nom de catégorie": "Restaurant",
          "URL Google Maps": "https://www.google.com/maps/search/?api=1&query=Mama%20Restaurant%20Dijon",
          "Titre": "Mama Restaurant Dijon",
          "Rue": "8 Rue Dr Maret",
          "Ville": "Dijon",
          "Code postal": 21000,
          "Email": "reception.dijon@mamashelter.com",
          "Site web": "https://fr.mamashelter.com/dijon/restaurants/",
          "Téléphone": 33380609610,
          "Score total": 4.5,
          "Nombre d'avis": 550
        }
      ])
    }
  ];

  try {
    console.log('Sending payload...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log('✅ Test successful!');
      console.log('Processed:');
      console.log('  - Results count:', result.processed.results_count);
      console.log('  - Emails found:', result.processed.emails_found);
      console.log('  - Status:', result.processed.status);
    } else {
      console.log('❌ Test failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }

  console.log('');
  console.log('Test completed!');
}

testWebhookN8N();
