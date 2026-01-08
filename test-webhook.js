const SUPABASE_URL = 'https://acwesyhvhvakumtwtsmd.supabase.co';
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/scraping-webhook`;

async function testWebhook() {
  console.log('Testing webhook...');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  const sessionId = 'test-session-id';

  console.log('1. Testing progress update...');
  const progressPayload = {
    session_id: sessionId,
    status: 'in_progress',
    progress_percentage: 50,
    current_step: 'Extraction des données',
    actual_results: 0,
    emails_found: 0
  };

  try {
    const progressResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressPayload),
    });

    const progressResult = await progressResponse.json();
    console.log('Progress update response:', progressResult);
    console.log('');
  } catch (error) {
    console.error('Error testing progress update:', error.message);
    console.log('');
  }

  console.log('2. Testing completion with results...');
  const completePayload = {
    session_id: sessionId,
    status: 'completed',
    progress_percentage: 100,
    current_step: 'Finalisation',
    actual_results: 2,
    emails_found: 1,
    sheet_url: 'https://docs.google.com/spreadsheets/d/example',
    duration_seconds: 120,
    results: [
      {
        business_name: 'Restaurant Le Gourmet',
        address: '123 Rue de Paris, 75001 Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@legourmet.fr',
        website: 'https://legourmet.fr',
        rating: 4.5,
        reviews_count: 245,
        category: 'Restaurant'
      },
      {
        business_name: 'Bistro Parisien',
        address: '456 Avenue des Champs, 75008 Paris',
        phone: '+33 1 98 76 54 32',
        website: 'https://bistroparisien.fr',
        rating: 4.2,
        reviews_count: 128,
        category: 'Restaurant'
      }
    ]
  };

  try {
    const completeResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completePayload),
    });

    const completeResult = await completeResponse.json();
    console.log('Completion response:', completeResult);
    console.log('');
  } catch (error) {
    console.error('Error testing completion:', error.message);
    console.log('');
  }

  console.log('Test completed!');
  console.log('');
  console.log('Note: This test uses a fake session_id.');
  console.log('For real testing, use a session_id from an actual scraping session.');
}

testWebhook();
