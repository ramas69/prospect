# Format Webhook N8N

## URL du Webhook

```
https://acwesyhvhvakumtwtsmd.supabase.co/functions/v1/scraping-webhook
```

## Format du Payload

Le webhook attend un tableau contenant un objet avec les champs suivants:

```json
[
  {
    "session_id": "uuid-de-la-session",
    "nom_feuille_google_sheet": "Feuille 43",
    "lien_google_sheet": "https://docs.google.com/spreadsheets/d/...",
    "statut": "termine",
    "count": 2,
    "json_donnee_scrappe": "[{...}, {...}]"
  }
]
```

### Champs Principaux

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|-------------|
| `session_id` | string | UUID de la session de scraping | ✅ Oui |
| `nom_feuille_google_sheet` | string | Nom de la feuille Google Sheets | ❌ Non |
| `lien_google_sheet` | string | URL du Google Sheet | ❌ Non |
| `statut` | string | État du scraping (voir ci-dessous) | ❌ Non |
| `count` | number | Nombre de résultats | ❌ Non |
| `json_donnee_scrappe` | string | JSON stringifié contenant les résultats | ❌ Non |

### Valeurs de `statut`

- `"termine"` → converti en `"completed"`
- `"en_cours"` → converti en `"in_progress"`
- `"echoue"` → converti en `"failed"`
- autre → `"pending"`

## Format des Données Scrapées

Le champ `json_donnee_scrappe` doit être une **string JSON** contenant un tableau d'objets:

```json
"[{\"row_number\":2,\"Nom de catégorie\":\"Restaurant français\",\"Titre\":\"L'Alsacien Dijon\",...}, {...}]"
```

### Structure des Objets Scrapés

Chaque objet dans le tableau peut contenir:

```json
{
  "row_number": 2,
  "Nom de catégorie": "Restaurant français",
  "URL Google Maps": "https://www.google.com/maps/...",
  "Titre": "L'Alsacien Dijon",
  "Rue": "3 Rue Mably",
  "Ville": "Dijon",
  "Code postal": 21000,
  "Email": "contact@restaurant.com",
  "Site web": "https://restaurant.com",
  "Téléphone": 33380608478,
  "Score total": 4.6,
  "Nombre d'avis": 1448,
  "Heures d'ouverture": "[...]",
  "Infos": "{...}",
  "Résumé": "..."
}
```

### Mapping des Champs

Le webhook convertit automatiquement les champs:

| Champ N8N | Champ Base de Données | Notes |
|-----------|----------------------|-------|
| `Titre` | `business_name` | Nom du commerce |
| `Rue` + `Code postal` + `Ville` | `address` | Concaténés avec ", " |
| `Téléphone` | `phone` | Converti en string avec préfixe "+" |
| `Email` | `email` | Ignoré si "aucun_mail" |
| `Site web` | `website` | URL du site |
| `Score total` | `rating` | Note sur 5 |
| `Nombre d'avis` | `reviews_count` | Nombre d'avis |
| `Nom de catégorie` | `category` | Type de commerce |

## Gestion des Emails

Les emails sont filtrés automatiquement:
- ✅ Accepté: email valide avec "@"
- ❌ Rejeté: "aucun_mail", emails vides, emails sans "@"

Le compteur `emails_found` compte uniquement les emails valides.

## Exemple de Test

Un fichier de test est disponible: `test-webhook-n8n.js`

Pour l'utiliser:

```bash
node test-webhook-n8n.js
```

⚠️ **Important**: Le test utilise un faux `session_id`. Pour un test réel, créez d'abord une session de scraping dans l'application.

## Réponse du Webhook

En cas de succès:

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "processed": {
    "session_id": "uuid-de-la-session",
    "status": "completed",
    "results_count": 2,
    "emails_found": 1
  }
}
```

En cas d'erreur:

```json
{
  "error": "Message d'erreur",
  "details": "Détails de l'erreur"
}
```

## Configuration N8N

Dans votre workflow N8N:

1. **Webhook Response Node**: Configurez pour envoyer au format tableau
2. **Session ID**: Récupérez le `session_id` depuis la réponse de l'API de démarrage
3. **Format JSON**: Stringifiez les données scrapées dans `json_donnee_scrappe`

### Exemple de Node N8N (HTTP Request)

```javascript
// URL
{{ $env.SUPABASE_URL }}/functions/v1/scraping-webhook

// Method
POST

// Body (JSON)
[
  {
    "session_id": "{{ $json.session_id }}",
    "nom_feuille_google_sheet": "{{ $json.sheet_name }}",
    "lien_google_sheet": "{{ $json.sheet_url }}",
    "statut": "termine",
    "count": {{ $json.results.length }},
    "json_donnee_scrappe": "{{ JSON.stringify($json.results) }}"
  }
]
```

## Notes Importantes

1. Le webhook accepte les requêtes **sans authentification** (`verify_jwt: false`)
2. CORS est activé pour tous les origins
3. Le webhook log automatiquement les payloads reçus pour le debugging
4. Les numéros de téléphone sont automatiquement formatés avec le préfixe "+"
5. Les profils utilisateurs sont mis à jour automatiquement (stats, badges, etc.)
