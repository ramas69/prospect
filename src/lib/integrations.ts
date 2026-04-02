import { supabase } from './supabase';

interface Prospect {
  id: string;
  business_name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  category?: string;
  rating?: number;
  reviews_count?: number;
  employee_range?: string;
  revenue?: number;
  company_category?: string;
  sessions?: { sector: string; location: string | null };
}

// ══════════════════════════════════
// BREVO
// ══════════════════════════════════

export async function pushToBrevo(
  apiKey: string,
  prospects: Prospect[],
  listName?: string
): Promise<{ success: number; failed: number; listId?: number }> {
  const withEmail = prospects.filter(p => p.email);
  if (withEmail.length === 0) return { success: 0, failed: 0 };

  // 1. Créer ou trouver la liste
  const finalListName = listName || `Prospects ${new Date().toLocaleDateString('fr-FR')}`;
  let listId: number | undefined;

  try {
    const createRes = await fetch('https://api.brevo.com/v3/contacts/lists', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: finalListName, folderId: 1 }),
    });
    if (createRes.ok) {
      const data = await createRes.json();
      listId = data.id;
    }
  } catch { /* ignore */ }

  // 2. Pousser les contacts
  let success = 0;
  let failed = 0;

  // Brevo supporte l'import batch
  const contacts = withEmail.map(p => ({
    email: p.email!,
    attributes: {
      PRENOM: p.business_name,
      NOM: p.business_name,
      ENTREPRISE: p.business_name,
      TELEPHONE: p.phone || '',
      SITE_WEB: p.website || '',
      ADRESSE: p.address || '',
      SECTEUR: p.category || p.sessions?.sector || '',
      VILLE: p.sessions?.location || '',
      EFFECTIFS: p.employee_range || '',
      CA: p.revenue ? `${p.revenue}€` : '',
    },
  }));

  // Batch de 50 contacts max
  for (let i = 0; i < contacts.length; i += 50) {
    const batch = contacts.slice(i, i + 50);
    try {
      const res = await fetch('https://api.brevo.com/v3/contacts/import', {
        method: 'POST',
        headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listIds: listId ? [listId] : undefined,
          jsonBody: batch,
          updateExistingContacts: true,
        }),
      });
      if (res.ok) {
        success += batch.length;
      } else {
        failed += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  return { success, failed, listId };
}

// ══════════════════════════════════
// LEMLIST
// ══════════════════════════════════

interface LemlistCampaign {
  _id: string;
  name: string;
}

export async function getLemlistCampaigns(apiKey: string): Promise<LemlistCampaign[]> {
  try {
    const res = await fetch('https://api.lemlist.com/api/campaigns', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function pushToLemlist(
  apiKey: string,
  campaignId: string,
  prospects: Prospect[]
): Promise<{ success: number; failed: number }> {
  const withEmail = prospects.filter(p => p.email);
  if (withEmail.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const p of withEmail) {
    try {
      const res = await fetch(
        `https://api.lemlist.com/api/campaigns/${campaignId}/leads/${encodeURIComponent(p.email!)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: p.business_name,
            lastName: '',
            companyName: p.business_name,
            phone: p.phone || '',
            website: p.website || '',
            customFields: {
              address: p.address || '',
              sector: p.category || p.sessions?.sector || '',
              city: p.sessions?.location || '',
              employees: p.employee_range || '',
              revenue: p.revenue ? `${p.revenue}€` : '',
              rating: p.rating?.toString() || '',
            },
          }),
        }
      );
      if (res.ok || res.status === 200) {
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    // Rate limit Lemlist
    await new Promise(r => setTimeout(r, 200));
  }

  return { success, failed };
}

// Helper pour récupérer les clés API depuis les settings
export async function getIntegrationKeys(userId: string): Promise<{
  brevo_api_key: string | null;
  lemlist_api_key: string | null;
}> {
  const { data } = await supabase
    .from('user_settings')
    .select('brevo_api_key, lemlist_api_key')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    brevo_api_key: data?.brevo_api_key || null,
    lemlist_api_key: data?.lemlist_api_key || null,
  };
}
