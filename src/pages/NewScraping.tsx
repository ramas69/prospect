import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabase, Template } from '../lib/supabase';
import ScrapingSplitForm, { ProspectionFormData } from '../components/ScrapingSplitForm';

export default function NewScraping() {
  const { profile, settings, refreshProfile } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formInitialData, setFormInitialData] = useState<Partial<ProspectionFormData>>({});

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    loadTemplates();
    // checkActiveSession(); // DÉSACTIVÉ : Le scraping ne doit pas reprendre automatiquement
  }, [profile]);

  const checkActiveSession = async () => {
    if (!profile) return;

    const { data: activeSession } = await supabase
      .from('scraping_sessions')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeSession) {
      setSessionId(activeSession.id);
      setIsLoading(true);
    }
  };

  const loadTemplates = async () => {
    if (!profile) return;

    const { data: templatesData } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', profile.id)
      .order('use_count', { ascending: false })
      .limit(5);

    setTemplates(templatesData || []);
  };

  const extractLocationFromUrl = (url: string): string | null => {
    try {
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        return `${match[1]},${match[2]}`;
      }
      const placeMatch = url.match(/place\/([^\/]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
      }
    } catch (e) {
      console.error('Error extracting location:', e);
    }
    return null;
  };

  const handleFormSubmit = async (data: ProspectionFormData) => {
    if (!profile) return;

    // Utiliser les paramètres par défaut si les champs ne sont pas fournis (car cachés)
    const emailToUse = data.emailNotification || settings?.notification_email || profile.email;
    const sheetUrlToUse = data.urlFichier || settings?.default_sheet_url || '';

    setIsLoading(true);

    try {
      // Utiliser la location formatée (Ville + km) si disponible, sinon extraire de l'URL
      const location = data.location || extractLocationFromUrl(data.lienGoogleMaps);

      const { data: session, error: sessionError } = await supabase
        .from('scraping_sessions')
        .insert({
          user_id: profile.id,
          google_maps_url: data.lienGoogleMaps,
          sector: data.secteurActivite,
          location: location,
          limit_results: data.limitResultats,
          email_notification: emailToUse,
          new_file: data.nouveauFichier,
          file_name: data.nomFichier,
          sheet_name: data.nomFeuille,
          status: 'pending',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update matching templates usage count
      const { data: matchingTemplates } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', profile.id)
        .eq('sector', data.secteurActivite)
        .ilike('location', `%${location || ''}%`);

      if (matchingTemplates && matchingTemplates.length > 0) {
        await Promise.all(
          matchingTemplates.map(template =>
            supabase
              .from('templates')
              .update({ use_count: template.use_count + 1 })
              .eq('id', template.id)
          )
        );
      }

      setSessionId(session.id);

      const payload = {
        session_id: session.id,
        lien_google_maps: data.lienGoogleMaps,
        secteur_activite: data.secteurActivite,
        limit_resultats: data.limitResultats,
        email_notification: emailToUse,
        nouveau_fichier: data.nouveauFichier,
        nom_fichier: data.nomFichier,
        nom_feuille: data.nomFeuille,
        url_fichier: sheetUrlToUse,
        timestamp: new Date().toISOString(),
      };

      console.log('=== LANCEMENT RECHERCHE ===');
      console.log('Payload envoyé:', payload);

      // Appel à la Edge Function Supabase (remplace n8n)
      const scrapingUrl = `${supabaseUrl}/functions/v1/scraping-engine`;
      fetch(scrapingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(response => {
        if (!response.ok) {
          console.error('Erreur Edge Function:', response.status);
        } else {
          console.log('Recherche lancée avec succès');
        }
      }).catch(err => {
        console.error('Erreur réseau Edge Function:', err);
      });

      showNotification('success', 'Recherche lancée ! Vos prospects seront disponibles dans quelques minutes.');
    } catch (error: any) {
      console.error('Erreur lors du scraping:', error);
      showNotification('error', error.message || 'Une erreur est survenue');
      if (sessionId) {
        await supabase
          .from('scraping_sessions')
          .update({ status: 'failed' })
          .eq('id', sessionId);
      }
      setIsLoading(false);
    }
  };

  const simulateScraping = async (id: string) => {
    const steps = [
      { step: 'Connexion à Google Maps', percentage: 20 },
      { step: 'Extraction des données', percentage: 40 },
      { step: 'Recherche des emails', percentage: 60 },
      { step: 'Création du Google Sheet', percentage: 80 },
      { step: 'Finalisation', percentage: 100 },
    ];

    for (const { step, percentage } of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const isLastStep = percentage === 100;

      await supabase
        .from('scraping_sessions')
        .update({
          status: isLastStep ? 'completed' : 'in_progress',
          current_step: step,
          progress_percentage: percentage,
          ...(isLastStep && {
            sheet_url: 'https://docs.google.com/spreadsheets/d/1w8drVumQ5zRLRTSgYwnqzlQdt0G4bWTvOM2YqAt3t90/edit',
            completed_at: new Date().toISOString(),
            actual_results: 5,
            emails_found: 3,
          }),
        })
        .eq('id', id);

      // Si c'est la fin, on crée de VRAIS prospects pour le test
      if (isLastStep) {
        const fakeResults = [
          {
            session_id: id,
            business_name: "Le Barbier du Marais",
            address: "7 Rue des Francs Bourgeois, 75004 Paris",
            phone: "+33 1 44 54 97 25",
            email: "contact@barbiermarais.fr",
            website: "https://www.barbierdumarais.com",
            rating: 4.8,
            reviews_count: 1250,
            category: "Coiffeur"
          },
          {
            session_id: id,
            business_name: "Gentlemen's Factory",
            address: "12 Rue de la Roquette, 75011 Paris",
            phone: "+33 1 43 55 12 34",
            email: "hello@gentlemenfactory.fr",
            website: "https://gentlemenfactory.fr",
            rating: 4.6,
            reviews_count: 850,
            category: "Barbier"
          },
          {
            session_id: id,
            business_name: "Alain Maître Barbier",
            address: "8 Rue Saint-Claude, 75003 Paris",
            phone: "+33 1 42 77 55 05",
            email: "alain@maitrebarbier.com",
            rating: 4.9,
            reviews_count: 2100,
            category: "Coiffeur pour hommes"
          }
        ];

        await supabase.from('scraping_results').insert(fakeResults);
      }
    }

    await refreshProfile();
    showNotification('success', 'Recherche terminée avec succès !');
  };

  const useTemplate = (template: Template) => {
    setFormInitialData({
      secteurActivite: template.sector,
      limitResultats: template.limit_results,
      location: template.location || undefined,
    });
    showNotification('success', `Template "${template.name}" appliqué`);
  };

  return (
    <div className="h-full">
      <ScrapingSplitForm
        templates={templates}
        onTemplateSelect={useTemplate}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        initialData={formInitialData}
        hideEmail={!!settings?.notification_email}
        hideSheetUrl={!!settings?.default_sheet_url}
        sessionId={sessionId}
        onScrapingComplete={() => {
          setIsLoading(false);
          if (sessionId) {
            navigate(`/history?session_id=${sessionId}`);
          }
        }}
        onScrapingCancelled={() => {
          setIsLoading(false);
          setSessionId(null);
          // Only clear critical flags, but pass empty object to trigger reset in form
          setFormInitialData({});
        }}
      />
    </div>
  );
}
