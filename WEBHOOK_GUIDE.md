# Guide Webhook - Hall Prospects

## Vue d'ensemble

Le système de webhook permet à votre service de scraping externe de communiquer avec l'application et d'afficher les résultats en temps réel.

## Architecture

1. **Front-end** : Crée une session de scraping dans la base de données
2. **Service de scraping** (n8n, etc.) : Reçoit les paramètres et effectue le scraping
3. **Webhook Supabase** : Reçoit les mises à jour du service de scraping
4. **Base de données** : Stocke les sessions et résultats
5. **Interface** : Affiche les résultats en temps réel via Supabase Realtime

## URL du Webhook

```
https://acwesyhvhvakumtwtsmd.supabase.co/functions/v1/scraping-webhook
```

Cette URL est visible dans l'interface dans la page "Webhook".

## Format des données

### Mise à jour du progrès

```json
{
  "session_id": "uuid-de-la-session",
  "status": "in_progress",
  "progress_percentage": 50,
  "current_step": "Extraction des données",
  "actual_results": 0,
  "emails_found": 0
}
```

### Complétion avec résultats

```json
{
  "session_id": "uuid-de-la-session",
  "status": "completed",
  "progress_percentage": 100,
  "current_step": "Finalisation",
  "actual_results": 25,
  "emails_found": 15,
  "sheet_url": "https://docs.google.com/spreadsheets/d/...",
  "duration_seconds": 120,
  "results": [
    {
      "business_name": "Restaurant Le Gourmet",
      "address": "123 Rue de Paris, 75001 Paris",
      "phone": "+33 1 23 45 67 89",
      "email": "contact@legourmet.fr",
      "website": "https://legourmet.fr",
      "rating": 4.5,
      "reviews_count": 245,
      "category": "Restaurant"
    }
  ]
}
```

## Champs disponibles

| Champ | Type | Description | Requis |
|-------|------|-------------|--------|
| `session_id` | string (UUID) | Identifiant de la session | ✅ |
| `status` | string | État: `pending`, `in_progress`, `completed`, `failed` | ✅ |
| `progress_percentage` | number | Pourcentage (0-100) | ❌ |
| `current_step` | string | Description de l'étape en cours | ❌ |
| `actual_results` | number | Nombre de résultats trouvés | ❌ |
| `emails_found` | number | Nombre d'emails trouvés | ❌ |
| `sheet_url` | string | URL du Google Sheet | ❌ |
| `duration_seconds` | number | Durée en secondes | ❌ |
| `results` | array | Tableau des résultats détaillés | ❌ |

### Format des résultats

Chaque élément du tableau `results` peut contenir :

| Champ | Type | Description |
|-------|------|-------------|
| `business_name` | string | Nom de l'entreprise (requis) |
| `address` | string | Adresse complète |
| `phone` | string | Numéro de téléphone |
| `email` | string | Adresse email |
| `website` | string | Site web |
| `rating` | number | Note (ex: 4.5) |
| `reviews_count` | number | Nombre d'avis |
| `category` | string | Catégorie |

## Configuration n8n

### Étape 1 : Webhook n8n existant

Votre workflow n8n actuel reçoit les paramètres de scraping depuis l'application via :
```
https://n8n.srv903375.hstgr.cloud/webhook/scrapping-google-maps
```

### Étape 2 : Ajouter le webhook Supabase

Ajoutez un nœud HTTP Request dans votre workflow n8n pour envoyer les mises à jour :

1. **Configuration de base**
   - Method: POST
   - URL: `https://acwesyhvhvakumtwtsmd.supabase.co/functions/v1/scraping-webhook`
   - Content-Type: `application/json`

2. **Pendant le scraping** (mises à jour du progrès)
   ```json
   {
     "session_id": "{{$json.session_id}}",
     "status": "in_progress",
     "progress_percentage": 50,
     "current_step": "Extraction des données"
   }
   ```

3. **À la fin du scraping** (avec résultats)
   ```json
   {
     "session_id": "{{$json.session_id}}",
     "status": "completed",
     "progress_percentage": 100,
     "actual_results": {{$json.results.length}},
     "emails_found": {{$json.emails_count}},
     "sheet_url": "{{$json.sheet_url}}",
     "results": {{$json.results}}
   }
   ```

## Test du webhook

Un script de test est fourni : `test-webhook.js`

Pour l'exécuter :

```bash
node test-webhook.js
```

**Important** : Ce script utilise un session_id fictif. Pour tester avec une vraie session :

1. Lancez un nouveau scraping depuis l'application
2. Copiez le `session_id` depuis la base de données
3. Modifiez le script avec ce `session_id`
4. Exécutez le script

## Affichage des résultats

### En temps réel

L'interface utilise Supabase Realtime pour afficher automatiquement :
- La progression du scraping
- Les étapes en cours
- Les résultats au fur et à mesure

### Page Historique

La page "Historique" liste toutes les sessions de scraping avec un bouton "Voir" pour afficher les résultats détaillés de chaque session.

### Composants créés

1. **ScrapingProgress** : Affiche la progression en temps réel
2. **ScrapingResults** : Liste tous les leads trouvés avec filtres et export CSV
3. **WebhookConfig** : Documentation du webhook dans l'interface

## Sécurité

- Le webhook utilise le service role key de Supabase (pas d'authentification externe requise)
- Les données sont protégées par Row Level Security (RLS)
- Chaque utilisateur ne peut voir que ses propres résultats

## Dépannage

### Le webhook ne reçoit pas les données

Vérifiez :
- L'URL du webhook est correcte
- Le Content-Type est `application/json`
- Le `session_id` existe dans la base de données

### Les résultats ne s'affichent pas

Vérifiez :
- Le champ `results` est un tableau d'objets
- Chaque résultat a au minimum un `business_name`
- Le statut est bien `completed`

### Le progrès ne se met pas à jour

Vérifiez :
- Supabase Realtime est activé
- Le `session_id` est correct
- Les mises à jour sont envoyées au webhook
